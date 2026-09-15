"""Extract ruled weekly timetables. All output requires human review."""
import json
import re
import sys
import pdfplumber

GROUP = re.compile(r"\b[A-Z]{1,5}-\d{3}\b")
TIME = re.compile(r"^(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})$")
DAYS = {"Luni": 0, "Marţi": 1, "Marți": 1, "Miercuri": 2, "Joi": 3, "Vineri": 4, "Sâmbătă": 5, "Duminică": 6}


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
            cells = [(c, (page.crop(c).extract_text(x_tolerance=0.4, y_tolerance=0.4) or '').strip()) for c in table.cells]
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
            for cell, text in cells:
                if not text or text == "#" or cell[0] < left or cell[1] <= table.bbox[1] + 2:
                    continue
                groups = sorted({g for hc, names in headers if cell[0] <= (hc[0] + hc[2]) / 2 <= cell[2] for g in names})
                if not groups:
                    continue
                overlaps = [(sc, day, start, end) for sc, day, start, end in slots if min(cell[3], sc[3]) - max(cell[1], sc[1]) > 2]
                if not overlaps:
                    warnings.append(f"Страница {page_index + 1}: не определено время для {text[:60]}")
                    continue
                # Preserve every occupied interval when a cell spans several slots.
                for sc, day, start, end in overlaps:
                    parity = "every"
                    if len(overlaps) == 1 and cell[3] - cell[1] < (sc[3] - sc[1]) * .7:
                        parity = "odd" if (cell[1] + cell[3]) / 2 < (sc[1] + sc[3]) / 2 else "even"
                    lines = [line.strip() for line in text.splitlines() if line.strip()]
                    room_pattern = r"[A-ZА-Я]?\d[\dA-ZА-Я\s/.,-]*"
                    while lines and re.fullmatch(room_pattern, lines[0]):
                        lines.pop(0)
                    if not lines:
                        warnings.append(f"Страница {page_index + 1}: отдельная ячейка аудитории ({text}) требует сверки с соседним занятием.")
                        continue
                    subject = lines[0]
                    lecture = subject.startswith("c.")
                    laboratory = subject.startswith("lab.")
                    if lecture:
                        subject = subject[2:].strip()
                    elif laboratory:
                        subject = subject[4:].strip()
                    # Keep all original lines: teacher/room splits may be ambiguous.
                    room = lines[-1] if len(lines) > 1 and re.fullmatch(room_pattern, lines[-1]) else ""
                    details = lines[1:-1] if room else lines[1:]
                    teacher = " ".join(details) if details and all("." in line for line in details) else ""
                    if details and not teacher:
                        subject = " ".join([subject] + details)
                    lessons.append({"id": "", "subject": subject or text, "type": "Лекция" if lecture else "Лабораторная" if laboratory else "Не указан", "day": day, "start": start, "end": end, "teacher": teacher, "room": room, "topic": "", "parity": parity, "audiences": [{"group": g, "subgroup": "all"} for g in groups], "reviewed": False, "sourceText": f"Страница {page_index + 1}\n{text}"})
            warnings.append(f"Страница {page_index + 1}: проверьте все предметы, преподавателей, аудитории и распределение по подгруппам; исходные строки сохранены.")
    if not lessons:
        warnings.append("Занятия не извлечены. Создан пустой черновик для ручного заполнения.")
    return {"lessons": lessons, "warnings": warnings}


if __name__ == "__main__":
    try:
        print(json.dumps(extract(sys.argv[1]), ensure_ascii=False))
    except Exception:
        print("Не удалось разобрать PDF. Проверьте файл и поддержку pdfplumber.", file=sys.stderr)
        sys.exit(1)
