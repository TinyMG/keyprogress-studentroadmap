import { useEffect, useState } from "react";
import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import StudentList from "./components/StudentList";
import StudentDetail from "./components/StudentDetail";
import Curriculum from "./components/Curriculum";
import SkillPathway from "./components/SkillPathway";
import ResourcesPage from "./components/ResourcesPage";
import AdminPage from "./components/AdminPage";
import { supabase, fetchProfile, type Student } from "./lib/supabase";
import { errorMessage } from "./lib/error";
import type { Role, View } from "./logic/roles";

export default function App() {
  const [session, setSession] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("dashboard");
  const [role, setRole] = useState<Role>("teacher");
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

  useEffect(() => {
    if (!session) return;
    const uid =
      (session as { user?: { id?: string } }).user?.id ?? "";
    // Fails safe to "teacher": missing profile row (schema not re-run)
    // keeps today's access instead of locking anyone out.
    fetchProfile(uid)
      .then((p) => setRole(p.role))
      .catch((err) => console.error(errorMessage(err)));
  }, [session]);

  async function signOut() {
    await supabase.auth.signOut();
    setSelected(null);
    setView("dashboard");
    setRole("teacher");
  }

  function openStudent(s: Student) {
    setSelected(s);
    setView("student");
  }

  function navigate(v: View) {
    if (v !== "student") setSelected(null);
    setView(v);
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

  const sessionUser = session as { user?: { email?: string } };
  const teacherEmail = sessionUser.user?.email ?? "";

  return (
    <div className="flex min-h-full bg-slate-50">
      <Sidebar
        current={view}
        onNavigate={navigate}
        teacherEmail={teacherEmail}
        role={role}
        onSignOut={signOut}
      />
      <main className="ml-64 flex-1">
        {view === "dashboard" && <Dashboard />}
        {view === "students" && (
          <StudentList onSelect={openStudent} canEdit={role !== "student"} />
        )}
        {view === "student" && selected && (
          <StudentDetail
            student={selected}
            teacherEmail={teacherEmail}
            readOnly={role === "student"}
            onBack={() => {
              setSelected(null);
              setView("students");
            }}
          />
        )}
        {view === "curriculum" && <Curriculum />}
        {view === "roadmap" && <SkillPathway onSelect={openStudent} />}
        {view === "resources" && <ResourcesPage />}
        {view === "admin" && role === "admin" && <AdminPage />}
      </main>
    </div>
  );
}
