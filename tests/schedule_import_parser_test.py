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
        if cell in self.cells:
            return FakeCrop(self.cells[cell])
        return FakeCrop("\n".join(text for box, text in sorted(self.cells.items(), key=lambda item:item[0][1])
                                  if box[0]>=cell[0] and box[2]<=cell[2] and box[1]>=cell[1] and box[3]<=cell[3]))


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
    def test_sport_location_and_corroborated_surname_are_metadata(self):
        lesson=parser.parse_cell("Ed. Fizică\nSala sportivă",0,"08:00","09:30","every",["TI-245"],0)[0][0]
        self.assertEqual((lesson["subject"],lesson["room"]),("Ed. Fizică","Sala sportivă"))
        lesson=parser.parse_cell("CDE\nBîrnaz\n524",0,"08:00","09:30","every",["TI-245"],0,known_surnames={"Bîrnaz"})[0][0]
        self.assertEqual((lesson["subject"],lesson["teacher"]),("CDE","Bîrnaz"))
        unknown=parser.parse_cell("CDE\nUnknown\n524",0,"08:00","09:30","every",["TI-245"],0)[0][0]
        self.assertEqual(unknown["subject"],"CDE Unknown")

    def test_half_group_title_is_not_discarded_and_prefix_is_case_insensitive(self):
        for text in ("lab. 0.5 gr. CDE\nLitra D.\nA03", "Lab.\nCDE\nLitra D.\nA03", "lab. PADM 0,5 gr.\nBîrnaz A.\n427"):
            lesson=extract_cell(text,False)["lessons"][0]
            self.assertIn(lesson["subject"], ("CDE", "PADM"))
            self.assertEqual(lesson["type"], "Лабораторная")

    def test_teacher_lists_and_initial_first_names_do_not_pollute_subject(self):
        for names in ("Șova M.,Nicolai F.", "Strucova T., Pilețchi T.", "P.Russu", "Reițman P. / Dumitrașcu M.", "DutoaL., Nicolai F."):
            lesson=extract_cell("L. Engleză\n"+names+"\n611",False)["lessons"][0]
            self.assertEqual(lesson["subject"], "L. Engleză")
            self.assertTrue(lesson["teacher"])
            self.assertEqual(extract_cell(names,False)["lessons"], [])

    def test_title_crossing_empty_fragments_is_read_after_geometry_merge(self):
        cells={(100,0,200,20):"TI-245",(0,20,40,100):"Luni",(40,20,100,100):"08:00–09:30",
               (100,20,200,35):"",(100,35,200,45):"",(100,45,200,100):"624\nCantir L."}
        original=FakePage.within_bbox
        def read(page,box):
            if box==(100,20,200,100):return FakeCrop("L. Română\n624\nCantir L.")
            return original(page,box)
        with patch.object(FakePage,'within_bbox',read): lessons=extract_cells(cells)["lessons"]
        self.assertEqual(len(lessons),1)
        self.assertEqual((lessons[0]["subject"],lessons[0]["teacher"],lessons[0]["room"]),("L. Română","Cantir L.","624"))

    def test_inline_teacher_and_room_are_separate_from_subject(self):
        cases = [
            ("CI 2 A03 Magariu N.", "CI 2", "Magariu N.", "A03"),
            ("Matematici Speciale Bostan V. ; Cojuhari E. 3-3 Amdaris", "Matematici Speciale", "Bostan V. Cojuhari E.", "3-3 Amdaris"),
            ("ASCS Plămădeală C", "ASCS", "Plămădeală C", ""),
            ("Baze de date 1 Saranciuc D. 3-3 Amdaris", "Baze de date 1", "Saranciuc D.", "3-3 Amdaris"),
            ("Analiza și Specif. Software Plămădeală C", "Analiza și Specif. Software", "Plămădeală C", ""),
            ("BD (noiembrie / decembrie) Saranciuc D.", "BD (noiembrie / decembrie)", "Saranciuc D.", ""),
            ("APA Munteanu M. D-01-03", "APA", "Munteanu M.", "D-01-03"),
        ]
        for text, subject, teacher, room in cases:
            with self.subTest(text=text):
                lessons = extract_cell(text, False)["lessons"]
                self.assertEqual(len(lessons), 1)
                self.assertEqual((lessons[0]["subject"], lessons[0]["teacher"], lessons[0]["room"]), (subject, teacher, room))
                self.assertIn(text, lessons[0]["sourceText"])

    def test_standalone_metadata_is_flagged_not_created_as_subject(self):
        for text in ("Aula 6-2 Henri Coandă", "Plămădeală C", "Saranciuc D.\n3-3 Amdaris", "Zbancă D. Aula 6-2 Henri Coandă"):
            result = extract_cell(text, False)
            self.assertEqual(result["lessons"], [])
            self.assertTrue(any(text in warning for warning in result["warnings"]))

    def test_legitimate_course_numbers_and_uncertain_suffixes_are_preserved(self):
        for text in ("Matematica I", "Baze de date 1", "Circuite Integrate 2", "Programarea C++", "Analiza Matematică I", "ASCS Plămădeală C cabinet necunoscut"):
            lessons = extract_cell(text, False)["lessons"]
            self.assertEqual(lessons[0]["subject"], text)

    def test_flattened_half_group_options_are_existing_subject_names(self):
        for text in (
            "0,5 gr. 1) CDE Chiriac M. A03 2) MS Litra D.",
            "lab. 0,5 gr.\n1) CDE Chiriac M. A03\n2) MS Litra D.",
        ):
            lessons = extract_cell(text, False)["lessons"]
            self.assertEqual(
                [(l["subject"], l["teacher"], l["room"]) for l in lessons],
                [("CDE", "Chiriac M.", "A03"), ("MS", "Litra D.", "")],
            )
            self.assertTrue(all(text in l["sourceText"] for l in lessons))

    def test_half_group_marker_is_not_a_subject_prefix_or_suffix(self):
        for text, subject, teacher in (
            ("0,5 gr. AFU Brînză M.", "AFU", "Brînză M."),
            ("PADM 0,5 gr.", "PADM", ""),
            ("0,5 gr.\nAFU\nBrînză M.", "AFU", "Brînză M."),
        ):
            lessons = extract_cell(text, False)["lessons"]
            self.assertEqual(len(lessons), 1)
            self.assertEqual((lessons[0]["subject"], lessons[0]["teacher"]), (subject, teacher))

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
