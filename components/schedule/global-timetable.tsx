import { DAYS } from "@/lib/admin-schedule";
import {
  templateCells,
  templateIntervals,
  type TemplateResponse,
  type TemplateGroup,
} from "@/lib/global-template-view";
import type { TemplateLesson } from "@/lib/server/global-schedule-template";
import {
  lessonTypes,
  minutesLabel,
  subjectStyle,
} from "@/lib/student-schedule-view";

export default function GlobalTimetable({
  data,
  groups,
  parity,
  onEdit,
  issueIds,
}: {
  data: TemplateResponse;
  groups: TemplateGroup[];
  parity: "ODD" | "EVEN";
  onEdit?: (id: string) => void;
  issueIds?: Set<string>;
}) {
  const groupIds = new Set(groups.map((group) => group.id));
  const days = data.days.map((day) => ({
    weekday: day.weekday,
    lessons: day.lessons.filter(
      (lesson) =>
        (lesson.weekPattern === "EVERY" || lesson.weekPattern === parity) &&
        lesson.groupIds.some((id) => groupIds.has(id)),
    ),
  }));
  const intervals = templateIntervals(days);
  const visibleDays = days.filter(
    (day) => day.weekday < 5 || day.lessons.length,
  );
  return (
    <div
      role="region"
      tabIndex={0}
      aria-label="Общее расписание групп, прокрутка по горизонтали и вертикали"
      className="max-h-[72vh] max-w-full overflow-auto focus-visible:outline-blue-600"
    >
      <table
        className="w-full table-fixed border-separate border-spacing-0 text-left text-xs"
        style={{ minWidth: 208 + groups.length * 176 }}
        aria-label="Глобальное расписание всех групп"
      >
        <thead className="sticky top-0 z-30">
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-40 w-28 min-w-28 border-b border-r border-gray-200 bg-gray-50 p-3"
            >
              День
            </th>
            <th
              scope="col"
              className="sticky left-28 z-40 w-24 min-w-24 border-b border-r border-gray-200 bg-gray-50 p-3"
            >
              Время
            </th>
            {groups.map((group) => (
              <th
                key={group.id}
                scope="col"
                className="min-w-44 border-b border-r border-gray-200 bg-gray-50 p-4 text-sm font-semibold text-gray-700"
              >
                {group.name}
              </th>
            ))}
          </tr>
        </thead>
        {visibleDays.map((day) => (
          <tbody key={day.weekday}>
            {intervals.map((interval, index) => (
              <tr key={`${interval.startMinutes}:${interval.endMinutes}`}>
                {index === 0 && (
                  <th
                    scope="rowgroup"
                    rowSpan={intervals.length}
                    className="sticky left-0 z-20 border-b border-r border-gray-200 bg-white p-3 align-top font-semibold text-gray-700"
                  >
                    {DAYS[day.weekday]}
                  </th>
                )}
                <th
                  scope="row"
                  className="sticky left-28 z-20 border-b border-r border-gray-200 bg-white p-3 align-top font-medium text-gray-600"
                >
                  <span className="block">
                    {minutesLabel(interval.startMinutes)}
                  </span>
                  <span className="mt-1 block text-gray-400">
                    {minutesLabel(interval.endMinutes)}
                  </span>
                </th>
                {templateCells(day.lessons, groups, interval).map((cell) => (
                  <td
                    key={cell.groupId}
                    colSpan={cell.span}
                    className="h-20 border-b border-r border-gray-200 p-2 align-top"
                  >
                    {cell.lessons.length ? (
                      <div className="space-y-2">
                        {cell.lessons.map((lesson: TemplateLesson) => {
                          const content = (
                            <>
                              <p className="font-semibold leading-5">
                                {lesson.subject.name}
                              </p>
                              <p className="mt-1 text-[11px] opacity-75">
                                {lessonTypes[lesson.type]}
                              </p>
                              {(lesson.teacher || lesson.classroom) && (
                                <p className="mt-2 text-[11px] opacity-75">
                                  {[
                                    lesson.teacher,
                                    lesson.classroom &&
                                      `Ауд. ${lesson.classroom}`,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}
                              {lesson.topic && (
                                <p className="mt-1 text-[11px] opacity-75">
                                  {lesson.topic}
                                </p>
                              )}
                              {issueIds?.has(lesson.id) && (
                                <p className="mt-2 text-[11px] font-semibold text-amber-800">
                                  Нужно проверить
                                </p>
                              )}
                            </>
                          );
                          const style = subjectStyle(
                            lesson.subject.name,
                          ).cardStyle;
                          return onEdit ? (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={() => onEdit(lesson.id)}
                              className="w-full rounded-lg border border-gray-200 border-l-4 p-3 text-left focus-visible:outline-blue-600"
                              style={style}
                            >
                              {content}
                            </button>
                          ) : (
                            <div
                              key={lesson.id}
                              className="rounded-lg border border-gray-200 border-l-4 p-3"
                              style={style}
                            >
                              {content}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-300" aria-label="Нет занятий">
                        —
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
