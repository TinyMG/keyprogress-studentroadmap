import { useEffect, useState } from "react";
import Auth from "./components/Auth";
import Sidebar, { type View } from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import StudentList from "./components/StudentList";
import StudentDetail from "./components/StudentDetail";
import Curriculum from "./components/Curriculum";
import SkillPathway from "./components/SkillPathway";
import ResourcesPage from "./components/ResourcesPage";
import { supabase, type Student } from "./lib/supabase";

export default function App() {
  const [session, setSession] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("dashboard");
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
    setView("dashboard");
  }

  function openStudent(s: Student) {
    setSelected(s);
    setView("student");
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center text-slate-500">
        …
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const teacherEmail =
    (session as { user?: { email?: string } }).user?.email ?? "";

  return (
    <div className="flex min-h-full bg-slate-50">
      <Sidebar
        current={view}
        onNavigate={(v) => {
          if (v !== "student") setSelected(null);
          setView(v);
        }}
        teacherEmail={teacherEmail}
        onSignOut={signOut}
      />
      <main className="ml-64 flex-1">
        {view === "dashboard" && <Dashboard />}
        {view === "students" && <StudentList onSelect={openStudent} />}
        {view === "student" && selected && (
          <StudentDetail
            student={selected}
            teacherEmail={teacherEmail}
            onBack={() => {
              setSelected(null);
              setView("students");
            }}
          />
        )}
        {view === "curriculum" && <Curriculum />}
        {view === "roadmap" && <SkillPathway onSelect={openStudent} />}
        {view === "resources" && <ResourcesPage />}
      </main>
    </div>
  );
}
