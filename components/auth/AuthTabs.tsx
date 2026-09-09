type AuthMode = "login" | "register";

type AuthTabsProps = {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
};

export default function AuthTabs({ mode, onChange }: AuthTabsProps) {
  return (
    <div className="mt-8 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
      <button
        type="button"
        onClick={() => onChange("login")}
        className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
          mode === "login"
            ? "bg-white text-blue-700 shadow-sm"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        Войти
      </button>

      <button
        type="button"
        onClick={() => onChange("register")}
        className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
          mode === "register"
            ? "bg-white text-blue-700 shadow-sm"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        Регистрация
      </button>
    </div>
  );
}
