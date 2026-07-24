# KeyProgress

Free student progress tracking for music teachers. Visual roadmap of a
student's position in a book series, one-tap book completion, and one-click
parent email suggesting the next book to buy.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind — deploys free to
  [Cloudflare Pages](https://pages.cloudflare.com) / Netlify / Vercel.
- **Auth + DB:** [Supabase](https://supabase.com) free tier (Postgres + RLS +
  email/password auth). No backend server.
- **Email:** [EmailJS](https://www.emailjs.com) free tier (200/mo), sent
  client-side from the teacher's own Gmail. No backend.

Operational cost: $0 within free-tier limits.

## Setup

1. **Supabase** — create a project, grab Project URL + anon key from
   *Settings → API*. Open the SQL editor and run
   [`supabase/schema.sql`](supabase/schema.sql). This creates `students` +
   `student_books` with row-level security so each teacher only sees their own
   students.

2. **EmailJS** — create an account, add an Email Service (Gmail), create an
   Email Template, grab the Service ID, Template ID, and Public Key. The
   template should reference these variables:
   - `to_email` — parent email (passed automatically)
   - `student_name`
   - `series_name`
   - `next_book`
   - `teacher_email`

   Example template body:
   > Hello — `{{student_name}}` is ready for the next book in the
   > `{{series_name}}` series: **`{{next_book}}`**. You can order it at your
   > usual retailer. — `{{teacher_email}}`

3. **Env** — copy `.env.example` to `.env` and fill in the five values.

4. **Run** —
   ```bash
   npm install
   npm run dev      # local dev
   npm run build    # production build (tsc + vite)
   npm run check    # run the deriveProgress self-check
   ```

## Book series

Standard published levels for four series, defined in
[`src/data/books.ts`](src/data/books.ts):

- Piano Adventures (Primer → 5)
- Adult Piano Adventures (Book 1 → 2)
- Royal Conservatory of Music (Prep A → ARCT)
- Piano Safari (Level 1 → 3)

To add or edit series, edit that file. Migrate to a DB table only if the
school needs teacher-editable series (see the `ponytail:` note in `books.ts`).

## How it works

- A teacher signs up (Supabase email/password). Each teacher sees only their
  own students — enforced by Postgres RLS, not app code.
- Add a student with a name, a series, and an optional parent email.
- Open a student to see their **roadmap**: a vertical race-line with
  done / in-progress / up-next / goal states (roadmap.sh-style).
- Tap a node to toggle that book as completed.
- "Email parent" sends a templated EmailJS message suggesting the next book.
  Disabled if the series is complete or no parent email is on file.

## Deploy

Free static hosting (Cloudflare Pages recommended):
1. `npm run build` → `dist/`
2. Push the repo, connect it to Cloudflare Pages, set the env vars in the
   dashboard, build command `npm run build`, output dir `dist`.
