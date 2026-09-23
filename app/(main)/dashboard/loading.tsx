export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse">
      <section className="mb-8">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="mt-3 h-9 w-80 max-w-full rounded bg-gray-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-gray-100" />
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-2xl border border-gray-200 bg-white p-5"
          >
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="mt-4 h-8 w-12 rounded bg-gray-200" />
            <div className="mt-3 h-3 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="h-96 rounded-2xl border border-gray-200 bg-white xl:col-span-2" />
        <div className="h-96 rounded-2xl border border-gray-200 bg-white" />
        <div className="h-72 rounded-2xl border border-gray-200 bg-white xl:col-span-2" />
        <div className="h-72 rounded-2xl border border-gray-200 bg-white" />
      </div>
    </div>
  );
}
