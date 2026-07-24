import emailjs from "@emailjs/browser";

// ponytail: EmailJS free tier = 200 emails/mo, sent from the teacher's own
// Gmail. Swap to Resend + Supabase edge function if volume exceeds; the
// signature below stays stable, only this body changes.

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;

export type NextBookEmail = {
  studentName: string;
  parentEmail: string;
  seriesName: string;
  nextBookTitle: string;
  teacherEmail: string;
};

export async function sendNextBookEmail(msg: NextBookEmail): Promise<void> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error(
      "EmailJS not configured. Set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY.",
    );
  }
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_email: msg.parentEmail,
      student_name: msg.studentName,
      series_name: msg.seriesName,
      next_book: msg.nextBookTitle,
      teacher_email: msg.teacherEmail,
    },
    { publicKey: PUBLIC_KEY },
  );
}
