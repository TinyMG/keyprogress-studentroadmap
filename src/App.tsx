import { useEffect, useState } from "react";
import Auth from "./components/Auth";
import StudentList from "./components/StudentList";
import StudentDetail from "./components/StudentDetail";
import { supabase, type Student } from "./lib/supabase";

export default function App() {
  const [session, setSession] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Student | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setSelected(null);
  }

  if (loading) {
    return <div className="flex min-h-full items-center justify-center text-slate-500">…</div>;
  }

  if (!session) {
    return <Auth />;
  }

  const teacherEmail =
    (session as { user?: { email?: string } }).user?.email ?? "";

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <span className="font-bold text-slate-900">KeyProgress</span>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="hidden sm:inline">{teacherEmail}</span>
            <button onClick={signOut} className="font-medium text-brand-600 hover:underline">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {selected ? (
        <StudentDetail
          student={selected}
          teacherEmail={teacherEmail}
          onBack={() => setSelected(null)}
        />
      ) : (
        <StudentList onSelect={setSelected} />
      )}
    </div>
  );
}
