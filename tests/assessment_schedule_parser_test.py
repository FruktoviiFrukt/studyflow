"""Regression cases for the periodic-assessment PDF table parser."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch


MODULE = Path(__file__).resolve().parents[1] / "scripts/schedule-import/parse_assessment_pdf.py"
spec = importlib.util.spec_from_file_location("schedule_assessment_parser", MODULE)
parser = importlib.util.module_from_spec(spec)
spec.loader.exec_module(parser)

HEADER = ["Anul\nde\nstudii", "Disciplina", "Componenţa seriei (grupele)", None,
          "Cadrul didactic\ntitular", "Data", "Ora", "Sala"]


class FakeTable:
    def __init__(self, rows):
        self._rows = rows
        self.cells = list(range(len(rows) * 8))

    def extract(self):
        return self._rows


class FakePage:
    def __init__(self, rows):
        self.rows = rows

    def find_tables(self):
        return [FakeTable(self.rows)]


class FakePdf:
    def __init__(self, pages_rows):
        self.pages = [FakePage(rows) for rows in pages_rows]

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False


def extract_rows(*page_rows):
    with patch.object(parser.pdfplumber, "open", return_value=FakePdf(list(page_rows))):
        return parser.extract("ignored.pdf")


class AssessmentParserTest(unittest.TestCase):
    def test_basic_row_produces_a_dated_seminar_lesson(self):
        rows = [HEADER, [None, "Analiza matematica 1", "1",
                          "CIM-241, CR-241, CR-242", "Pricop V.", "24.10.2024", "9:45", "3-3"]]
        result = extract_rows(rows)
        self.assertEqual(len(result["lessons"]), 1)
        lesson = result["lessons"][0]
        self.assertEqual(lesson["subject"], "Analiza matematica 1")
        self.assertEqual(lesson["type"], "Семинар")
        self.assertEqual(lesson["date"], "2024-10-24")
        self.assertEqual(lesson["day"], 3)  # 2024-10-24 is a Thursday
        self.assertEqual((lesson["start"], lesson["end"]), ("09:45", "11:15"))
        self.assertEqual(lesson["teacher"], "Pricop V.")
        self.assertEqual(lesson["room"], "3-3")
        self.assertEqual(
            [a["group"] for a in lesson["audiences"]],
            ["CIM-241", "CR-241", "CR-242"],
        )
        self.assertTrue(lesson["parity"] == "every" and lesson["reviewed"] is False)

    def test_discipline_and_year_carry_forward_across_rows(self):
        rows = [HEADER,
                [None, "Fizica", "1", "TI-241", "Guțuleac L.", "28.10.2024", "17:00", "6-2"],
                [None, None, "2", "TI-242", "Rusu S.", "24.10.2024", "17:00", "5-1"]]
        lessons = extract_rows(rows)["lessons"]
        self.assertEqual([l["subject"] for l in lessons], ["Fizica", "Fizica"])

    def test_compound_group_code_is_not_truncated(self):
        rows = [HEADER, [None, "Analiza matematica 1", "3",
                          "IA-241, IA-242, SD-IA-241", "Vacaraș O.", "18.10.2024", "17:00", "104"]]
        groups = [a["group"] for a in extract_rows(rows)["lessons"][0]["audiences"]]
        self.assertIn("SD-IA-241", groups)
        self.assertIn("IA-241", groups)

    def test_multiple_teachers_are_joined_into_one_string(self):
        rows = [HEADER, [None, "Proiectarea conceptuală", "1", "FAF-241",
                          "Cazac C.,\nGherman. N.,\nMalîi A.", "21.10.2024", "17:00", "101"]]
        lesson = extract_rows(rows)["lessons"][0]
        self.assertEqual(lesson["teacher"], "Cazac C., Gherman. N., Malîi A.")

    def test_wrapped_room_number_is_rejoined_not_split_on_linebreak(self):
        rows = [HEADER, [None, "Proiectarea conceptuală", "1", "FAF-241",
                          "Cazac C.", "21.10.2024", "17:00", "101/118/1\n13"]]
        lesson = extract_rows(rows)["lessons"][0]
        self.assertEqual(lesson["room"], "101 / 118 / 113")

    def test_empty_teacher_cell_becomes_empty_string(self):
        rows = [HEADER, [None, "Practica de inițiere", "1", "IA-241, SD-241",
                          "", "26.10.2024", "9:45", "614"]]
        lesson = extract_rows(rows)["lessons"][0]
        self.assertEqual(lesson["teacher"], "")

    def test_single_row_discipline_without_series_number_still_parses(self):
        rows = [HEADER, [None, "Matematica discretă", None,
                          "FAF-241, FAF-242, FAF-243", "Bostan V.", "15.10.2024", "9:45", "3-3"]]
        lesson = extract_rows(rows)["lessons"][0]
        self.assertEqual(lesson["subject"], "Matematica discretă")
        self.assertEqual(len(lesson["audiences"]), 3)

    def test_blank_footer_row_is_skipped_silently(self):
        rows = [HEADER,
                [None, "Fizica", "1", "TI-241", "Guțuleac L.", "28.10.2024", "17:00", "6-2"],
                ["", None, None, None, None, None, None, None]]
        result = extract_rows(rows)
        self.assertEqual(len(result["lessons"]), 1)
        self.assertFalse(any("неполная строка" in w for w in result["warnings"]))

    def test_partially_filled_row_warns_instead_of_silently_dropping(self):
        rows = [HEADER, [None, "Fizica", "1", "TI-241", "Guțuleac L.", "", "17:00", "6-2"]]
        result = extract_rows(rows)
        self.assertEqual(result["lessons"], [])
        self.assertTrue(any("неполная строка" in w for w in result["warnings"]))

    def test_unparseable_date_warns_and_skips_the_row(self):
        rows = [HEADER, [None, "Fizica", "1", "TI-241", "Guțuleac L.", "31.02.2024", "17:00", "6-2"]]
        result = extract_rows(rows)
        self.assertEqual(result["lessons"], [])
        self.assertTrue(any("дата" in w for w in result["warnings"]))

    def test_no_groups_found_warns_and_skips_the_row(self):
        rows = [HEADER, [None, "Fizica", "1", "нет групп здесь", "Guțuleac L.", "28.10.2024", "17:00", "6-2"]]
        result = extract_rows(rows)
        self.assertEqual(result["lessons"], [])
        self.assertTrue(any("группы" in w for w in result["warnings"]))

    def test_second_page_continues_without_repeating_the_header(self):
        page1 = [HEADER, [None, "Fizica", "1", "TI-241", "Guțuleac L.", "28.10.2024", "17:00", "6-2"]]
        page2 = [[None, None, "2", "TI-242", "Rusu S.", "24.10.2024", "17:00", "5-1"]]
        lessons = extract_rows(page1, page2)["lessons"]
        self.assertEqual(len(lessons), 2)
        self.assertEqual(lessons[1]["subject"], "Fizica")


if __name__ == "__main__":
    unittest.main()
