"""Extract ruled weekly timetables. All output requires human review."""
import json
import re
import sys
import pdfplumber

GROUP = re.compile(r"\b[A-Z]{1,5}-\d{3}\b")
TIME = re.compile(r"^(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})$")
DAYS = {"Luni": 0, "Marţi": 1, "Marți": 1, "Miercuri": 2, "Joi": 3, "Vineri": 4, "Sâmbătă": 5, "Duminică": 6}
ROOM = re.compile(r"(?:[A-Za-zА-Яа-я]-?\d|\d|Aula\s+\d)[\w\s/.,-]*", re.IGNORECASE)
NUMBERED = re.compile(r"^[12]\)\s*")
HALF_GROUP = re.compile(r"(?:0[.,]?5|½)\s*gr\.?", re.IGNORECASE)
TEACHER = re.compile(r"^[^\d()]+?\s+[A-ZĂÂÎȘȚ][a-zăâîșț]{0,2}\.?$")
# Only a surname + initials, not arbitrary trailing words. Bare Roman numerals
# are left in course titles (e.g. "Matematica I").
TEACHER_NAME = r"[A-ZĂÂÎȘȚŞŢ][a-zăâîșțşţ]+(?:[-’'][A-Za-zăâîșțşţĂÂÎȘȚŞŢ]+)*\s+(?:[A-ZĂÂÎȘȚŞŢ][a-zăâîșțşţ]{0,2}\.|[A-HJ-UW-ZĂÂÎȘȚŞŢ])"
INLINE_TEACHER = re.compile(r"(.+?)\s+(" + TEACHER_NAME + r")(?:\s+(.+))?")


def separate_inline_details(lines):
    """Split only recognizable teacher/room suffixes; retain uncertain text."""
    expanded = []
    for line in lines:
        inline = INLINE_TEACHER.fullmatch(line)
        if inline and (not inline[3] or ROOM.fullmatch(inline[3])):
            expanded.extend(part for part in inline.groups() if part)
        else:
            expanded.append(line)
    return expanded


def shaded_cell(rects, box):
    """Recognize the light grey fill used for lectures, including merged cells."""
    area = (box[2] - box[0]) * (box[3] - box[1])
    if area <= 0:
        return False
    covered = 0
    for rect in rects:
        color = rect.get("non_stroking_color")
        components = color if isinstance(color, (tuple, list)) else [color]
        if not components or not all(isinstance(value, (int, float)) for value in components):
            continue
        if len(components) > 1 and max(components) - min(components) > 0.08:
            continue
        shade = sum(components) / len(components)
        if not 0.5 <= shade < 0.97:
            continue
        width = max(0, min(box[2], rect["x1"]) - max(box[0], rect["x0"]))
        height = max(0, min(box[3], rect["bottom"]) - max(box[1], rect["top"]))
        covered += width * height
    return covered / area >= 0.65


def dark_separator(edges, left, right, top):
    """Ignore fill boundaries; only a visible line divides two lessons."""
    for edge in edges:
        if edge.get("orientation") != "h" or abs(edge["top"] - top) > 0.5:
            continue
        if edge["x0"] > left + 1 or edge["x1"] < right - 1:
            continue
        color = edge.get("non_stroking_color") if edge.get("object_type") == "rect_edge" else edge.get("stroking_color")
        if color is None:
            return True
        components = color if isinstance(color, (tuple, list)) else [color]
        if components and all(isinstance(component, (int, float)) for component in components):
            if sum(components) / len(components) < 0.55:
                return True
    return False


def merge_fragments(cells, edges):
    """Join table-finder fragments that have no visible border between them."""
    ordered = sorted(cells, key=lambda item: (item[0][0], item[0][2], item[0][1]))
    merged = []
    for box, text in ordered:
        if merged:
            previous, previous_text = merged[-1]
            if (abs(previous[0] - box[0]) < 0.7 and
                    abs(previous[2] - box[2]) < 0.7 and
                    abs(previous[3] - box[1]) < 0.7 and
                    not dark_separator(edges, previous[0], previous[2], box[1])):
                merged[-1] = ((previous[0], previous[1], previous[2], box[3]), previous_text + "\n" + text)
                continue
        merged.append((box, text))
    return merged


def parse_cell(text, day, start, end, parity, groups, page_index, shaded=False):
    """Turn one PDF cell into group-visible lessons, preserving parallel options."""
    laboratory = text.strip().startswith("lab.")
    half_group = bool(HALF_GROUP.search(text))
    normalized = text
    if half_group:
        # Some PDFs flatten subgroup labels and both options onto one line.
        # The marker describes the audience, never part of a subject name.
        normalized = HALF_GROUP.sub("", normalized)
        normalized = re.sub(r"(?<!\w)([12]\))\s*", r"\n\1 ", normalized)
    lines = [line.strip() for line in normalized.splitlines() if line.strip()]
    if half_group:
        lines = [line for line in lines if line not in ("lab.", "c.")]
    lines = separate_inline_details(lines)
    while lines and ROOM.fullmatch(lines[0]):
        lines.pop(0)
    if not lines:
        return [], [f"Страница {page_index + 1}: отдельная ячейка аудитории ({text}) требует сверки с соседним занятием."]
    if all(re.fullmatch(TEACHER_NAME, line) or ROOM.fullmatch(line) for line in lines):
        return [], [f"Страница {page_index + 1}: найден преподаватель или аудитория без названия предмета ({text}); добавьте занятие вручную после сверки с PDF."]

    lesson_type = "Лабораторная" if laboratory else "Лекция" if shaded else "Семинар"
    numbered = [i for i, line in enumerate(lines) if NUMBERED.match(line)]
    if numbered:
        chunks = [lines[a:b] for a, b in zip(numbered, numbered[1:] + [len(lines)])]
    elif half_group and lines[0].startswith(("lab.", "c.")) and len(lines) > 1:
        chunks = [lines[1:]]
    else:
        chunks = [lines]
    warnings = []
    if numbered:
        warnings.append(f"Страница {page_index + 1}: варианты 1) и 2) показаны всей группе; сверьте оба занятия с PDF.")

    entries = []
    for chunk in chunks:
        subject = NUMBERED.sub("", chunk[0]).strip()
        if subject.startswith("lab."):
            subject = subject[4:].strip()
        elif subject.startswith("c."):
            subject = subject[2:].strip()
        details = chunk[1:]
        room_lines = [line for line in details if ROOM.fullmatch(line)]
        teachers = [line for line in details if TEACHER.fullmatch(line)]
        subject = " ".join([subject] + [line for line in details if not TEACHER.fullmatch(line) and not ROOM.fullmatch(line)])
        room = " / ".join(room_lines)
        rooms = [part.strip() for part in re.split(r"\s+/\s+", room)] if room else []
        if not numbered and len(teachers) == len(rooms) == 2:
            entries.extend((subject, teacher, classroom, parity) for teacher, classroom in zip(teachers, rooms))
        elif half_group and not numbered and len(teachers) == 2 and len(rooms) == 1 and room:
            entries.extend((subject, teacher, room, week) for teacher, week in zip(teachers, ("odd", "even")))
            warnings.append(f"Страница {page_index + 1}: преподаватели для 0.5 gr. распределены по нечётной/чётной неделе сверху вниз; сверьте с PDF.")
        else:
            entries.append((subject, " ".join(teachers), room, parity))

    lessons = [{
        "id": "", "subject": subject or text, "type": lesson_type,
        "day": day, "start": start, "end": end, "teacher": teacher,
        "room": room, "topic": "", "parity": entry_parity,
        "audiences": [{"group": group, "subgroup": "all"} for group in groups],
        "reviewed": False, "sourceText": f"Страница {page_index + 1}\n{text}",
    } for subject, teacher, room, entry_parity in entries]
    return lessons, warnings


def extract(path):
    lessons, warnings = [], []
    with pdfplumber.open(path) as pdf:
        if len(pdf.pages) > 10:
            raise ValueError("Не более 10 страниц в одном PDF")
        for page_index, page in enumerate(pdf.pages):
            # The default 3pt snapping merges nearby border rectangles in dense
            # timetables, collapsing entire days into one cell. Keep them apart.
            tables = page.find_tables({"snap_tolerance": 2, "join_tolerance": 2, "intersection_tolerance": 2})
            if not tables:
                warnings.append(f"Страница {page_index + 1}: таблица не найдена, требуется ручной ввод.")
                continue
            table = max(tables, key=lambda t: len(t.cells))
            if len(table.cells) > 10000:
                raise ValueError("Слишком большая таблица")
            # within_bbox excludes text that merely touches an adjacent cell.
            cells = [(c, (page.within_bbox(c).extract_text(x_tolerance=0.4, y_tolerance=0.4) or '').strip()) for c in table.cells]
            headers = [(c, GROUP.findall(text)) for c, text in cells if abs(c[1] - table.bbox[1]) < 2 and GROUP.search(text)]
            if not headers:
                warnings.append(f"Страница {page_index + 1}: группы не найдены.")
                continue
            left = min(c[0] for c, _ in headers)
            day_cells = [(c, DAYS[text]) for c, text in cells if c[0] < left and text in DAYS]
            slots = []
            for c, text in cells:
                match = TIME.fullmatch(text.replace("#", "").strip())
                if c[0] >= left or not match:
                    continue
                day = next((d for dc, d in day_cells if dc[1] - 1 <= c[1] and c[3] <= dc[3] + 1), None)
                if day is not None:
                    h1, m1, h2, m2 = match.groups()
                    slots.append((c, day, f"{int(h1):02}:{m1}", f"{int(h2):02}:{m2}"))
            content = merge_fragments(
                [(c, text) for c, text in cells if text and c[0] >= left and c[1] > table.bbox[1] + 2],
                page.edges,
            )
            for cell, text in content:
                if not text or text == "#" or cell[0] < left or cell[1] <= table.bbox[1] + 2:
                    continue
                groups = sorted({g for hc, names in headers if cell[0] <= (hc[0] + hc[2]) / 2 <= cell[2] for g in names})
                if not groups:
                    continue
                overlaps = [(sc, day, start, end) for sc, day, start, end in slots if min(cell[3], sc[3]) - max(cell[1], sc[1]) > 2]
                if not overlaps:
                    warnings.append(f"Страница {page_index + 1}: не определено время для {text[:60]}")
                    continue
                # One cell spanning two slots is one longer lesson, not two copies.
                for day in sorted({item[1] for item in overlaps}):
                    occupied = [(sc, start, end) for sc, d, start, end in overlaps if d == day]
                    start = min(item[1] for item in occupied)
                    end = max(item[2] for item in occupied)
                    parity = "every"
                    if len(occupied) == 1:
                        sc = occupied[0][0]
                        if cell[3] - cell[1] < (sc[3] - sc[1]) * .7:
                            parity = "odd" if (cell[1] + cell[3]) / 2 < (sc[1] + sc[3]) / 2 else "even"
                    found, notes = parse_cell(
                        text, day, start, end, parity, groups, page_index,
                        shaded=shaded_cell(page.rects, cell),
                    )
                    lessons.extend(found)
                    warnings.extend(notes)
            warnings.append(f"Страница {page_index + 1}: проверьте все предметы, преподавателей, аудитории и время; исходные строки сохранены.")
    if not lessons:
        warnings.append("Занятия не извлечены. Создан пустой черновик для ручного заполнения.")
    return {"lessons": lessons, "warnings": warnings}


if __name__ == "__main__":
    try:
        print(json.dumps(extract(sys.argv[1]), ensure_ascii=False))
    except Exception:
        print("Не удалось разобрать PDF. Проверьте файл и поддержку pdfplumber.", file=sys.stderr)
        sys.exit(1)
