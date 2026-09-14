import { DAYS, SLOTS, type AdminLesson } from "@/lib/admin-schedule";

export default function ScheduleStudentPreview({
  lessons,
  day,
  editable,
  issueIds,
  onEdit,
}: {
  lessons: AdminLesson[];
  day: string;
  editable: boolean;
  issueIds: Set<string>;
  onEdit: (lesson: AdminLesson) => void;
}) {
  const days =
    day === ""
      ? [
          0,
          1,
          2,
          3,
          4,
          ...[5, 6].filter((d) => lessons.some((l) => l.day === d)),
        ]
      : [Number(day)];
  // Keep all seven university slots visible and retain any manually entered interval.
  const slots = [
    ...new Set([...SLOTS, ...lessons.map((l) => `${l.start}–${l.end}`)]),
  ].sort();
  return (
    <div
      className="overflow-x-auto"
      role="region"
      aria-label="Предпросмотр расписания студента"
      tabIndex={0}
    >
      <table
        className="w-full table-fixed border-collapse text-left"
        style={{ minWidth: days.length > 1 ? 100 + days.length * 175 : 300 }}
      >
        <thead>
          <tr className="bg-gray-50">
            <th
              scope="col"
              className="w-[100px] p-3 text-xs font-medium text-gray-500"
            >
              Время
            </th>
            {days.map((d) => (
              <th
                key={d}
                scope="col"
                className="border-l border-gray-100 p-3 text-sm font-semibold"
              >
                {DAYS[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot} className="border-t border-gray-100">
              <th
                scope="row"
                className="p-3 align-top text-xs font-normal text-gray-500"
              >
                <span className="block font-semibold text-gray-700">
                  {slot.split("–")[0]}
                </span>
                <span className="mt-1 block">{slot.split("–")[1]}</span>
                <span className="mt-2 block text-[10px]">
                  {SLOTS.includes(slot)
                    ? `${SLOTS.indexOf(slot) + 1} пара`
                    : "Другое время"}
                </span>
              </th>
              {days.map((d) => {
                const matches = lessons.filter(
                  (l) => l.day === d && `${l.start}–${l.end}` === slot,
                );
                return (
                  <td
                    key={d}
                    className="h-24 border-l border-gray-100 p-2 align-top"
                  >
                    {matches.length ? (
                      <div className="space-y-2">
                        {matches.map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            disabled={!editable}
                            onClick={() => onEdit(l)}
                            className="w-full rounded-xl border-l-4 border-blue-500 bg-blue-50 p-3 text-left transition hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-default"
                          >
                            <p className="text-xs font-semibold text-blue-600">
                              {l.start}–{l.end}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-blue-950 [overflow-wrap:anywhere]">
                              {l.subject}
                            </p>
                            <p className="mt-1 text-xs text-blue-800">
                              {l.type}
                            </p>
                            <p className="mt-3 text-xs text-blue-800">
                              Ауд. {l.room || "не указана"}
                            </p>
                            <p className="mt-1 text-xs text-blue-700">
                              {l.teacher || "Преподаватель не указан"}
                            </p>
                            {issueIds.has(l.id) && (
                              <p className="mt-2 text-xs font-semibold text-amber-800">
                                Нужно проверить
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="sr-only">Нет занятий</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
