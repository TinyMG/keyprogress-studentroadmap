import { visibleNav, type View, type Role } from "../logic/roles";

export type { View };

type Props = {
  current: View;
  onNavigate: (v: View) => void;
  teacherEmail: string;
  role: Role;
  onSignOut: () => void;
};

export default function Sidebar({
  current,
  onNavigate,
  teacherEmail,
  role,
  onSignOut,
}: Props) {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 p-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
          <span className="text-sm font-bold text-white">KP</span>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">KeyProgress</p>
          <p className="text-xs text-slate-500">Piano School</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {visibleNav(role).map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
              current === item.id ||
              (item.id === "students" && current === "student")
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <p className="mb-2 truncate text-xs text-slate-500">{teacherEmail}</p>
        <button
          onClick={onSignOut}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
