type StatCardProps = {
  title: string;
  value: number;
  description: string;
  color: "blue" | "green" | "orange" | "purple";
};

const colorStyles = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
};

export default function StatCard({
  title,
  value,
  description,
  color,
}: StatCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorStyles[color]}`}
          aria-hidden="true"
        >
          <span className="h-3 w-3 rounded-full bg-current" />
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-500">{description}</p>
    </article>
  );
}
