import { Card } from "@/components/ui/card";

export default function GpaPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Успеваемость</p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Оценки от преподавателей</h2>
      </div>
      <Card className="rounded-2xl border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold">Здесь будут ваши оценки</h3>
        <p className="mt-2 text-sm leading-6 text-gray-500">Раздел в разработке. Позже здесь появятся предметы и оценки, выставленные преподавателями.</p>
      </Card>
    </div>
  );
}
