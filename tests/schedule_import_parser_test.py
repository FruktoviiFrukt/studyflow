"""Regression cases for parallel lessons in ruled PDF cells."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch


MODULE = Path(__file__).resolve().parents[1] / "scripts/schedule-import/parse_pdf.py"
spec = importlib.util.spec_from_file_location("schedule_pdf_parser", MODULE)
parser = importlib.util.module_from_spec(spec)
spec.loader.exec_module(parser)


class FakeTable:
    bbox = (0, 0, 300, 300)

    def __init__(self, cells):
        self.cells = list(cells)


class FakePage:
    def __init__(self, cells, edges=None, rects=None):
        self.cells = cells
        self.edges = edges or []
        self.rects = rects or []

    def find_tables(self, _settings):
        return [FakeTable(self.cells)]

    def crop(self, cell):
        return FakeCrop(self.cells[cell])

    def within_bbox(self, cell):
        return FakeCrop(self.cells[cell])


class FakeCrop:
    def __init__(self, text):
        self.text = text

    def extract_text(self, **_settings):
        return self.text


class FakePdf:
    def __init__(self, page):
        self.pages = [page]

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False


def extract_cell(text, span_two_slots):
    cells = {
        (100, 0, 200, 20): "TI-245",
        (0, 20, 40, 250): "Luni",
        (40, 20, 100, 100): "08:00–09:30",
        (40, 100, 100, 180): "09:45–11:15",
        (100, 20, 200, 180 if span_two_slots else 100): text,
    }
    return extract_cells(cells)


def extract_cells(cells, edges=None, rects=None):
    with patch.object(parser.pdfplumber, "open", return_value=FakePdf(FakePage(cells, edges, rects))):
        return parser.extract("ignored.pdf")


class ParallelCellsTest(unittest.TestCase):
    def test_two_slot_numbered_cell_creates_two_long_lessons(self):
        result = extract_cell("lab. 05 gr.\n1) CDE\nChiriac M.\nA03\n2) MS\nLitra D.\n422", True)
        lessons = result["lessons"]
        self.assertEqual(len(lessons), 2)
        self.assertEqual(
            [(lesson["subject"], lesson["teacher"], lesson["room"]) for lesson in lessons],
            [("CDE", "Chiriac M.", "A03"), ("MS", "Litra D.", "422")],
        )
        self.assertTrue(all((lesson["start"], lesson["end"]) == ("08:00", "11:15") for lesson in lessons))
        self.assertTrue(all(lesson["audiences"] == [{"group": "TI-245", "subgroup": "all"}] for lesson in lessons))

    def test_one_slot_two_teachers_and_rooms_are_paired(self):
        lessons = extract_cell("DAS\nCara A.\nCazac M.\n115 / 630", False)["lessons"]
        self.assertEqual(
            [(lesson["subject"], lesson["teacher"], lesson["room"]) for lesson in lessons],
            [("DAS", "Cara A.", "115"), ("DAS", "Cazac M.", "630")],
        )
        self.assertTrue(all((lesson["start"], lesson["end"]) == ("08:00", "09:30") for lesson in lessons))

    def test_half_group_teachers_alternate_by_week_across_two_slots(self):
        result = extract_cell("lab. 0.5 gr.\nAFU\nBrînză M.\nȚugulea V.\n419", True)
        self.assertEqual(
            [(item["subject"], item["teacher"], item["room"], item["parity"]) for item in result["lessons"]],
            [("AFU", "Brînză M.", "419", "odd"), ("AFU", "Țugulea V.", "419", "even")],
        )
        self.assertTrue(all((item["start"], item["end"]) == ("08:00", "11:15") for item in result["lessons"]))
        self.assertTrue(any("сверьте" in warning for warning in result["warnings"]))

    def test_wide_lecture_keeps_teacher_room_and_IBM_audience(self):
        cells = {
            (0, 20, 40, 250): "Luni",
            (40, 20, 100, 100): "08:00–09:30",
            (40, 100, 100, 180): "09:45–11:15",
            (200, 20, 800, 180): "c. Matematici Speciale\nCostaș A.\n3-3 Amdaris",
        }
        for index, group in enumerate(("AI-252", "AI-251", "CR-251", "CR-252", "R-251", "MN-251", "IBM-251")):
            left = 100 + index * 100
            cells[(left, 0, left + 100, 20)] = group
        lessons = extract_cells(cells)["lessons"]
        self.assertEqual(len(lessons), 1)
        self.assertEqual(
            (lessons[0]["subject"], lessons[0]["teacher"], lessons[0]["room"]),
            ("Matematici Speciale", "Costaș A.", "3-3 Amdaris"),
        )
        self.assertIn({"group": "IBM-251", "subgroup": "all"}, lessons[0]["audiences"])

    def test_fragments_without_visible_border_form_one_lesson(self):
        cells = {
            (100, 0, 200, 20): "TI-245",
            (0, 20, 40, 150): "Luni",
            (40, 20, 100, 100): "08:00–09:30",
            (100, 20, 200, 55): "c. Programarea declarativă",
            (100, 55, 200, 100): "Bumbu T.\n104",
        }
        lessons = extract_cells(cells)["lessons"]
        self.assertEqual(len(lessons), 1)
        self.assertEqual(
            (lessons[0]["subject"], lessons[0]["teacher"], lessons[0]["room"]),
            ("Programarea declarativă", "Bumbu T.", "104"),
        )

    def test_visible_border_keeps_consecutive_lessons_separate(self):
        cells = {
            (100, 0, 200, 20): "TI-245",
            (0, 20, 40, 150): "Luni",
            (40, 20, 100, 60): "08:00–09:30",
            (40, 60, 100, 100): "09:45–11:15",
            (100, 20, 200, 60): "c. Sisteme de operare\nBeșliu V.\n310",
            (100, 60, 200, 100): "c. Sisteme de operare\nBeșliu V.\n310",
        }
        border = {"orientation": "h", "top": 60, "x0": 100, "x1": 200,
                  "object_type": "rect_edge", "non_stroking_color": 0}
        lessons = extract_cells(cells, [border])["lessons"]
        self.assertEqual(len(lessons), 2)
        self.assertTrue(all(item["teacher"] == "Beșliu V." and item["room"] == "310" for item in lessons))

    def test_wrapped_subject_keeps_teacher_and_room_separate(self):
        lesson = parser.parse_cell(
            "PD (octombrie/\nnoiembrie)\nLeah A.\n708",
            0, "13:30", "15:00", "odd", ["TI-245"], 0,
        )[0][0]
        self.assertEqual(
            (lesson["subject"], lesson["teacher"], lesson["room"]),
            ("PD (octombrie/ noiembrie)", "Leah A.", "708"),
        )

    def test_room_before_teacher_and_multi_letter_initials(self):
        cases = [
            ("lab. CI 2\nA03\nMagariu N.", "CI 2", "Magariu N.", "A03"),
            ("c. MP\nNegritu Gh.\n6-2", "MP", "Negritu Gh.", "6-2"),
            ("c. Managmentul Proiectelor\nZbancă D.\nAula 6-2 Henri Coandă",
             "Managmentul Proiectelor", "Zbancă D.", "Aula 6-2 Henri Coandă"),
            ("BD\nBulai R.\nD-01/03", "BD", "Bulai R.", "D-01/03"),
        ]
        for text, subject, teacher, room in cases:
            with self.subTest(text=text):
                lesson = parser.parse_cell(text, 0, "08:00", "09:30", "every", ["TI-245"], 0)[0][0]
                self.assertEqual((lesson["subject"], lesson["teacher"], lesson["room"]),
                                 (subject, teacher, room))

    def test_type_comes_from_grey_fill_then_lab_prefix_then_seminar(self):
        cells = {
            (100, 0, 200, 20): "TI-245",
            (0, 20, 40, 150): "Luni",
            (40, 20, 100, 60): "08:00–09:30",
            (40, 60, 100, 100): "09:45–11:15",
            (40, 100, 100, 140): "11:30–13:00",
            (100, 20, 200, 60): "c. Programarea declarativă\nBumbu T.\n104",
            (100, 60, 200, 100): "lab. BD\nSaranciuc D.\n104",
            (100, 100, 200, 140): "PD\nLeah A.\n622",
        }
        rects = [{"x0": 100, "top": 20, "x1": 200, "bottom": 60,
                  "non_stroking_color": 0.851}]
        borders = [{"orientation": "h", "top": top, "x0": 100, "x1": 200,
                    "object_type": "rect_edge", "non_stroking_color": 0}
                   for top in (60, 100)]
        lessons = extract_cells(cells, borders, rects)["lessons"]
        self.assertEqual([lesson["type"] for lesson in lessons],
                         ["Лекция", "Лабораторная", "Семинар"])
        self.assertEqual(parser.parse_cell("c. PD\nLeah A.\n622", 0, "08:00", "09:30",
                                           "every", ["TI-245"], 0)[0][0]["type"], "Семинар")


if __name__ == "__main__":
    unittest.main()
