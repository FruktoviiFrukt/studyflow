"""Extract one-off periodic-assessment schedules from a ruled PDF table.

Unlike the weekly-grid lecture timetable (parse_pdf.py), this table has real
ruled borders and one row per exam session, so pdfplumber's default table
extraction already returns clean rows: no shading-based type detection and
no day-of-week header mapping are needed here. All output still requires
human review.
"""
import json
import re
import sys
from datetime import date as make_date
import pdfplumber

# Extends parse_pdf.py's single-segment GROUP pattern to also match compound
# codes like "SD-IA-241" (a joint-programme group), which the original
# pattern would truncate to "IA-241".
GROUP = re.compile(r"\b[A-Z]{1,5}(?:-[A-Z]{1,5})*-\d{3}\b")
DATE = re.compile(r"^(\d{1,2})\.(\d{1,2})\.(\d{4})$")
TIME = re.compile(r"^(\d{1,2})[.:](\d{2})$")
# The source only ever gives a start time; 90 minutes matches this school's
# standard lesson-slot length used elsewhere (see lib/admin-schedule.ts SLOTS).
ASSESSMENT_DURATION_MINUTES = 90


def clean(text):
    return re.sub(r"\s+", " ", text).strip() if text else ""


def is_header(row):
    return clean(row[5]) == "Data" or clean(row[1]) == "Disciplina"


def extract(path):
    lessons, warnings = [], []
    with pdfplumber.open(path) as pdf:
        if len(pdf.pages) > 10:
            raise ValueError("Не более 10 страниц в одном PDF")
        discipline = None
        for page_index, page in enumerate(pdf.pages):
            tables = page.find_tables()
            if not tables:
                warnings.append(f"Страница {page_index + 1}: таблица не найдена, требуется ручной ввод.")
                continue
            table = max(tables, key=lambda t: len(t.cells))
            if len(table.cells) > 10000:
                raise ValueError("Слишком большая таблица")
            found_on_page = False
            for row in table.extract():
                if len(row) < 8 or is_header(row):
                    continue
                if row[1]:
                    discipline = clean(row[1])
                groups_text = clean(row[3]) if row[3] else ""
                date_text = clean(row[5]) if row[5] else ""
                time_text = clean(row[6]) if row[6] else ""
                # Blank/footer rows (e.g. a signature line) carry no group,
                # date or time at all; anything else is worth a warning below
                # rather than a silent drop.
                if not groups_text and not date_text and not time_text:
                    continue
                if not groups_text or not date_text or not time_text:
                    warnings.append(
                        f"Страница {page_index + 1}: неполная строка для "
                        f"«{discipline or groups_text or '—'}», требуется ручной ввод.",
                    )
                    continue
                groups = sorted(set(GROUP.findall(groups_text)))
                if not groups:
                    warnings.append(
                        f"Страница {page_index + 1}: не удалось определить группы в «{groups_text[:60]}».",
                    )
                    continue
                date_match = DATE.fullmatch(date_text)
                if not date_match:
                    warnings.append(
                        f"Страница {page_index + 1}: не удалось разобрать дату «{date_text}» "
                        f"для «{discipline or groups_text}».",
                    )
                    continue
                day, month, year = (int(part) for part in date_match.groups())
                try:
                    lesson_date = make_date(year, month, day)
                except ValueError:
                    warnings.append(
                        f"Страница {page_index + 1}: некорректная дата «{date_text}» "
                        f"для «{discipline or groups_text}».",
                    )
                    continue
                time_match = TIME.fullmatch(time_text)
                if not time_match:
                    warnings.append(
                        f"Страница {page_index + 1}: не удалось разобрать время «{time_text}» "
                        f"для «{discipline or groups_text}».",
                    )
                    continue
                hour, minute = (int(part) for part in time_match.groups())
                start_minutes = hour * 60 + minute
                end_minutes = start_minutes + ASSESSMENT_DURATION_MINUTES
                if not (0 <= start_minutes < 24 * 60) or end_minutes > 24 * 60:
                    warnings.append(
                        f"Страница {page_index + 1}: время «{time_text}» вне допустимого "
                        f"диапазона для «{discipline or groups_text}».",
                    )
                    continue
                if not discipline:
                    warnings.append(
                        f"Страница {page_index + 1}: не определён предмет для «{groups_text}», "
                        "использован список групп вместо названия.",
                    )
                # A room can wrap mid-number across lines (e.g. "101/118/1\n13"
                # is really "101/118/113"), so newlines are dropped, not
                # turned into spaces, before splitting on "/".
                room_text = (row[7] or "").replace("\n", "").strip()
                rooms = [part.strip() for part in room_text.split("/") if part.strip()]
                teacher = clean(row[4]) if row[4] else ""
                found_on_page = True
                lessons.append({
                    "id": "",
                    "subject": discipline or groups_text,
                    "type": "Аттестация",
                    "day": lesson_date.weekday(),
                    "date": lesson_date.isoformat(),
                    "start": f"{hour:02}:{minute:02}",
                    "end": f"{end_minutes // 60:02}:{end_minutes % 60:02}",
                    "teacher": teacher,
                    "room": " / ".join(rooms),
                    "topic": "",
                    "parity": "once",
                    "audiences": [{"group": group, "subgroup": "all"} for group in groups],
                    "reviewed": False,
                    "sourceText": "\n".join(filter(None, [
                        f"Страница {page_index + 1}",
                        discipline,
                        groups_text,
                        teacher,
                        f"{date_text} {time_text}",
                        room_text,
                    ])),
                })
            if found_on_page:
                warnings.append(
                    f"Страница {page_index + 1}: сверьте предметы, преподавателей, аудитории и "
                    f"даты с PDF. Окончание рассчитано как начало + {ASSESSMENT_DURATION_MINUTES} "
                    "минут — в источнике указано только время начала.",
                )
    if not lessons:
        warnings.append("Занятия не извлечены. Создан пустой черновик для ручного заполнения.")
    return {"lessons": lessons, "warnings": warnings}


if __name__ == "__main__":
    try:
        print(json.dumps(extract(sys.argv[1]), ensure_ascii=False))
    except Exception:
        print("Не удалось разобрать PDF. Проверьте файл и поддержку pdfplumber.", file=sys.stderr)
        sys.exit(1)
