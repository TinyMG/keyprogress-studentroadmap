-- NotePath data migration — run AFTER schema.sql + seed.sql
-- in the Supabase SQL editor.
--
-- INSTRUCTIONS:
-- 1. Go to Supabase dashboard → Authentication → Users
-- 2. Copy your user ID (the long UUID)
-- 3. Paste it below where it says REPLACE_WITH_YOUR_USER_ID
-- 4. Run this script

DO $migration$
DECLARE
  -- >>> PASTE YOUR SUPABASE USER ID HERE <<<
  v_teacher_id uuid := 'd33a12d2-6100-4390-b962-3f9b2b759ca4';
  v_jameel uuid;
  v_liam uuid;
  v_ava uuid;
  v_sofia uuid;
  v_emma uuid;
  v_noah uuid;
BEGIN
  -- Temporarily disable the teacher_id trigger so we can set it explicitly
  ALTER TABLE students DISABLE TRIGGER students_set_teacher_id;

  -- ===== Insert missing resources (not in seed.sql) =====
  -- These appear in StudentResource/ResourceHistory but weren't in the seed

  INSERT INTO approved_resources (name, description, category, author, stage_id)
  SELECT 'Faber Piano Adventures Level 3B', 'Late beginner method — Level 3B',
         'Method', 'Nancy Faber', id
  FROM curriculum_stages WHERE stage_number = 3
  ON CONFLICT DO NOTHING;

  INSERT INTO approved_resources (name, description, category, author, stage_id)
  SELECT 'Piano Safari Level 1 — Rote Cards', 'Rote cards companion to Piano Safari Level 1',
         'Custom', 'Katherine Fisher', id
  FROM curriculum_stages WHERE stage_number = 0
  ON CONFLICT DO NOTHING;

  INSERT INTO approved_resources (name, description, category, author, stage_id)
  SELECT 'Royal Conservatory Theory Level 6', 'RCM theory level 6 — harmony and analysis',
         'Theory', 'RCM', id
  FROM curriculum_stages WHERE stage_number = 5
  ON CONFLICT DO NOTHING;

  INSERT INTO approved_resources (name, description, category, author, stage_id)
  SELECT 'RCM Piano Repertoire Grade 6', 'Official RCM Grade 6 repertoire anthology',
         'Repertoire', 'RCM', id
  FROM curriculum_stages WHERE stage_number = 5
  ON CONFLICT DO NOTHING;

  INSERT INTO approved_resources (name, description, category, author, stage_id)
  SELECT 'Czerny 100 Progressive Studies Op. 139', 'Progressive studies for scale and chord facility',
         'Technique', 'Carl Czerny', id
  FROM curriculum_stages WHERE stage_number = 4
  ON CONFLICT DO NOTHING;

  INSERT INTO approved_resources (name, description, category, author, stage_id)
  SELECT 'Piano Safari Level 1 (Flashcards)', 'Flashcard companion to Piano Safari Level 1',
         'Custom', 'Katherine Fisher', id
  FROM curriculum_stages WHERE stage_number = 0
  ON CONFLICT DO NOTHING;

  -- ===== Insert students =====
  -- series_id is NOT NULL in our schema; use 'piano-adventures' as default

  INSERT INTO students (teacher_id, name, series_id, parent_email, parent_name,
    age, date_of_birth, stage_id, date_entered_stage, lesson_focus,
    general_notes, sub_notes, is_adult)
  SELECT v_teacher_id, 'Jameel Planco', 'piano-adventures', 'bonnie063011@gmail.com',
    'Yvonne Planco', 15, '2011-06-30', s.id, '2026-08-29', '',
    '', '', false
  FROM curriculum_stages s WHERE s.stage_number = 4
  RETURNING id INTO v_jameel;

  INSERT INTO students (teacher_id, name, series_id, parent_email, parent_name,
    age, stage_id, date_entered_stage, lesson_focus, general_notes, sub_notes)
  SELECT v_teacher_id, 'Liam Nguyen', 'piano-adventures', 'minh.nguyen@email.com',
    'Minh Nguyen', 11, s.id, '2026-01-10',
    'Reading ledger lines and crossing thumb smoothly',
    'Strong sight reader. Can be impatient — encourage slow practice.',
    'Liam is confident and self-directed. He may skip ahead in the book — redirect gently. He''s working on not rushing through eighth notes. Always review the current piece 3 times before moving to the next.'
  FROM curriculum_stages s WHERE s.stage_number = 2
  RETURNING id INTO v_liam;

  INSERT INTO students (teacher_id, name, series_id, parent_email, parent_name,
    age, stage_id, date_entered_stage, lesson_focus, general_notes, sub_notes)
  SELECT v_teacher_id, 'Ava Chen', 'piano-adventures', 'lily.chen@email.com',
    'Lily Chen', 16, s.id, '2025-06-01',
    'Voicing in Baroque two-part inventions and RCM Grade 6 études',
    'Outstanding student. Preparing for RCM Grade 6 practical exam in October. Has perfect pitch.',
    'Ava is self-sufficient and mature. She knows her assignment and will guide the lesson. If she''s done her assigned pieces, ask her to work on the C harmonic minor scale at 100bpm. She''s preparing for her RCM Grade 6 practical exam.'
  FROM curriculum_stages s WHERE s.stage_number = 5
  RETURNING id INTO v_ava;

  INSERT INTO students (teacher_id, name, series_id, parent_email, parent_name,
    age, stage_id, date_entered_stage, lesson_focus, general_notes, sub_notes)
  SELECT v_teacher_id, 'Sofia Martinez', 'piano-adventures', 'rosa.martinez@email.com',
    'Rosa Martinez', 14, s.id, '2025-09-01',
    'Broken chord accompaniment patterns and minor scales',
    'Excellent student, very motivated. Working toward RCM Grade 4 exam in the fall.',
    'Sofia is preparing for the Spring Recital (June 20). Focus on her Sonatina in C by Clementi — hands together, pages 4-8. She also has a theory assignment due next week (RCM Theory Workbook page 34). Do not introduce new material.'
  FROM curriculum_stages s WHERE s.stage_number = 4
  RETURNING id INTO v_sofia;

  INSERT INTO students (teacher_id, name, series_id, parent_email, parent_name,
    age, date_of_birth, stage_id, date_entered_stage, lesson_focus,
    general_notes, sub_notes, is_adult)
  SELECT v_teacher_id, 'Emma Thompson', 'piano-adventures', 'karen.thompson@email.com',
    'Karen Thompson', 7, '2019-08-29', s.id, '2026-03-15',
    'Hand position and identifying keys C-G',
    'Making great progress! Very enthusiastic and practices every day.',
    'Emma is very shy with new people — give lots of encouragement. She loves animal songs. Uses the purple bench cushion from the shelf. Start every lesson with the C position warm-up.',
    false
  FROM curriculum_stages s WHERE s.stage_number = 0
  RETURNING id INTO v_emma;

  INSERT INTO students (teacher_id, name, series_id, parent_email, parent_name,
    age, stage_id, date_entered_stage, lesson_focus, general_notes, sub_notes)
  SELECT v_teacher_id, 'Noah Williams', 'piano-adventures', 'james.williams@email.com',
    'James Williams', 7, s.id, '2025-11-20',
    'Finger independence — fingers 3 and 4 exercises',
    'Energetic and fun student. Short attention span but loves music. Parents very supportive.',
    'Noah has a short attention span — keep activities varied, no more than 5 minutes per task. He responds well to games and stickers. He''s working on Lesson Book pg. 28. Clap rhythms first before playing.'
  FROM curriculum_stages s WHERE s.stage_number = 1
  RETURNING id INTO v_noah;

  -- ===== Insert student_resources (15 assignments) =====

  -- Sofia: Alfred's All-in-One Course Level 2
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_sofia, r.id, 'active', '2025-09-01T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'Alfred''s All-in-One Course Level 2'
  ON CONFLICT DO NOTHING;

  -- Ava: Royal Conservatory Theory Level 6
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_ava, r.id, 'active', '2025-09-01T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'Royal Conservatory Theory Level 6'
  ON CONFLICT DO NOTHING;

  -- Emma: Piano Safari Level 1 (Flashcards)
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_emma, r.id, 'active', '2026-04-01T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'Piano Safari Level 1 (Flashcards)'
  ON CONFLICT DO NOTHING;

  -- Liam: Faber Theory Level 2
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_liam, r.id, 'active', '2026-01-15T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'Faber Theory Level 2'
  ON CONFLICT DO NOTHING;

  -- Liam: Burgmüller 25 Easy Studies Op. 100 (selected)
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_liam, r.id, 'active', '2026-02-01T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'Burgmüller 25 Easy Studies Op. 100 (selected)'
  ON CONFLICT DO NOTHING;

  -- Sofia: Czerny 100 Progressive Studies Op. 139
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_sofia, r.id, 'active', '2025-10-01T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'Czerny 100 Progressive Studies Op. 139'
  ON CONFLICT DO NOTHING;

  -- Noah: Alfred's Basic Piano Theory Level 1A
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_noah, r.id, 'active', '2026-01-10T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'Alfred''s Basic Piano Theory Level 1A'
  ON CONFLICT DO NOTHING;

  -- Sofia: Royal Conservatory Theory Level 3
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_sofia, r.id, 'active', '2025-09-15T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'Royal Conservatory Theory Level 3'
  ON CONFLICT DO NOTHING;

  -- Ava: RCM Piano Repertoire Grade 6
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_ava, r.id, 'active', '2025-06-01T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'RCM Piano Repertoire Grade 6'
  ON CONFLICT DO NOTHING;

  -- Sofia: Sonatina Album (Clementi, Kuhlau)
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_sofia, r.id, 'active', '2026-03-01T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'Sonatina Album (Clementi, Kuhlau)'
  ON CONFLICT DO NOTHING;

  -- Noah: Piano Town Technic Level 1
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_noah, r.id, 'active', '2026-02-01T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'Piano Town Technic Level 1'
  ON CONFLICT DO NOTHING;

  -- Liam: Faber Piano Adventures Level 2A
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_liam, r.id, 'active', '2026-01-10T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'Faber Piano Adventures Level 2A'
  ON CONFLICT DO NOTHING;

  -- Emma: My First Piano Adventure — Lesson Book A
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_emma, r.id, 'active', '2026-03-15T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'My First Piano Adventure — Lesson Book A'
  ON CONFLICT DO NOTHING;

  -- Noah: Faber Piano Adventures Level 1
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_noah, r.id, 'active', '2025-11-20T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'Faber Piano Adventures Level 1'
  ON CONFLICT DO NOTHING;

  -- Ava: Hanon — The Virtuoso Pianist (all 60)
  INSERT INTO student_resources (student_id, resource_id, status, assigned_at)
  SELECT v_ava, r.id, 'active', '2025-06-01T00:00:00Z'
  FROM approved_resources r WHERE r.name = 'Hanon — The Virtuoso Pianist (all 60)'
  ON CONFLICT DO NOTHING;

  -- ===== Insert resource_history (4 completions) =====

  -- Sofia: Faber Piano Adventures Level 3B — Aug 28, 2025
  INSERT INTO resource_history (student_id, resource_id, date_completed)
  SELECT v_sofia, r.id, '2025-08-28'
  FROM approved_resources r WHERE r.name = 'Faber Piano Adventures Level 3B'
  ON CONFLICT DO NOTHING;

  -- Ava: RCM Piano Repertoire Grade 5 — May 30, 2025
  INSERT INTO resource_history (student_id, resource_id, date_completed)
  SELECT v_ava, r.id, '2025-05-30'
  FROM approved_resources r WHERE r.name = 'RCM Piano Repertoire Grade 5'
  ON CONFLICT DO NOTHING;

  -- Noah: Piano Safari Level 1 — Rote Cards — Nov 15, 2025
  INSERT INTO resource_history (student_id, resource_id, date_completed)
  SELECT v_noah, r.id, '2025-11-15'
  FROM approved_resources r WHERE r.name = 'Piano Safari Level 1 — Rote Cards'
  ON CONFLICT DO NOTHING;

  -- Liam: Faber Piano Adventures Level 1 — Jan 8, 2026
  INSERT INTO resource_history (student_id, resource_id, date_completed)
  SELECT v_liam, r.id, '2026-01-08'
  FROM approved_resources r WHERE r.name = 'Faber Piano Adventures Level 1'
  ON CONFLICT DO NOTHING;

  -- ===== Insert lesson_notes (8 notes) =====

  INSERT INTO lesson_notes (student_id, content, created_at) VALUES
    (v_ava, 'Ava ran her entire exam program today for mock run-through. Timing: 18 minutes. Very strong overall. Suggested: more contrast between the Bach and the Haydn in terms of touch and character.', '2026-05-30T00:00:00Z'),
    (v_noah, 'Noah was very energetic today! We used the clap-then-play approach for March of the Goblins and it worked great. He earned 3 stickers. Theory page 14 was completed in lesson. Practice: pg. 28 daily.', '2026-06-02T00:00:00Z'),
    (v_liam, 'Filled in for Sarah today. Liam was cooperative. Reviewed Burgmüller No. 3 and No. 4 as Sarah''s notes suggested. He played No. 3 well, No. 4 needs more work on the dynamic contrast.', '2026-05-20T00:00:00Z'),
    (v_emma, 'Emma played through pages 10–12 with great focus today. Hands separate first, then together on ''Bouncing Balloon.'' Very proud of herself! Practice task: pages 10–12 every day, 3 times each.', '2026-06-03T00:00:00Z'),
    (v_sofia, 'Great lesson! Sofia nailed the Clementi exposition hands together at full tempo. We worked on the development section today — she needs to slow down at bar 22. Theory: completed pages 30–34.', '2026-06-04T00:00:00Z'),
    (v_liam, 'Liam rushed through The Spinning Song again. Spent 10 min on slow practice with metronome at 60bpm. Much better by end of lesson. Assigned: hands separate at 60, then HT at 72 by next week.', '2026-06-05T00:00:00Z'),
    (v_sofia, 'Sofia is performing beautifully. The Sonatina is nearly recital-ready. Encouraged her to imagine playing for the audience and project to the back row. Also started a new Czerny study (No. 16).', '2026-05-28T00:00:00Z'),
    (v_ava, 'Ava''s Bach voicing is improving significantly. The soprano melody is singing out beautifully. We discussed phrasing and how to shape the 4-bar sequences. Haydn nearly polished — work on the coda.', '2026-06-06T00:00:00Z');

  -- ===== Insert student_books (map completions to book roadmap) =====
  -- Map NotePath resource completions to our book series IDs

  -- Liam: Faber Piano Adventures Level 1 → pa-1
  INSERT INTO student_books (student_id, book_id, completed_at)
  VALUES (v_liam, 'pa-1', '2026-01-08T00:00:00Z')
  ON CONFLICT DO NOTHING;

  -- Sofia: Faber Piano Adventures Level 3B → pa-3b
  INSERT INTO student_books (student_id, book_id, completed_at)
  VALUES (v_sofia, 'pa-3b', '2025-08-28T00:00:00Z')
  ON CONFLICT DO NOTHING;

  -- Noah: Piano Safari Level 1 — Rote Cards → ps-1
  INSERT INTO student_books (student_id, book_id, completed_at)
  VALUES (v_noah, 'ps-1', '2025-11-15T00:00:00Z')
  ON CONFLICT DO NOTHING;

  -- Ava: RCM Piano Repertoire Grade 5 → rcm-5 (approximate)
  INSERT INTO student_books (student_id, book_id, completed_at)
  VALUES (v_ava, 'rcm-5', '2025-05-30T00:00:00Z')
  ON CONFLICT DO NOTHING;

  -- Re-enable the teacher_id trigger
  ALTER TABLE students ENABLE TRIGGER students_set_teacher_id;

  RAISE NOTICE 'Migration complete! Inserted 6 students, 15 resource assignments, 4 completion history entries, 8 lesson notes, 4 book completions.';
END$migration$;
