export default function AuthHero() {
  return (
    <section
      className="relative hidden min-h-screen overflow-hidden bg-slate-900 lg:flex"
      style={{
        backgroundImage:
          "linear-gradient(rgba(12, 40, 85, 0.55), rgba(12, 40, 85, 0.72)), url('/utm-campus.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex w-full flex-col justify-between p-12 text-white xl:p-16">
        <div>
          <div className="text-3xl font-bold tracking-tight">StudyFlow</div>

          <p className="mt-2 text-sm text-white/80">
            Политехнический Университет Молдовы
          </p>
        </div>

        <div className="max-w-xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-blue-100">
            Учись проще
          </p>

          <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">
            Всё необходимое для учёбы в одном месте
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-white/80">
            Расписание, задания, материалы, средний балл и подготовка к
            экзаменам вместе со StudyFlow.
          </p>
        </div>

        <p className="text-sm text-white/60">Made by students for students</p>
      </div>
    </section>
  );
}
