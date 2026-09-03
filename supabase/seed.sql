-- KeyProgress seed: 7 curriculum stages + 48 approved resources
-- Run in Supabase SQL editor after schema.sql. Idempotent.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM curriculum_stages) THEN
    INSERT INTO curriculum_stages (stage_number, name, description) VALUES
      (0, 'Piano Journey',
       'Foundations: sitting position, keyboard geography, finger numbers, and white-key names. Pre-staff orientation and first playing experiences.'),
      (1, 'Completion',
       'Student completes simple pieces with correct notes and steady tempo. Building reliability with the basics.'),
      (2, 'Continuity',
       'Smooth, connected playing; phrases flow without breaks. Hands coordinate more reliably and reading expands.'),
      (3, 'Confidence',
       'Plays with assurance and independence; begins expressive choices and reliable rhythm across changing patterns.'),
      (4, 'Expression',
       'Shapes dynamics, articulation, and phrasing musically. Tone, touch, and pedaling become intentional.'),
      (5, 'Interpretation',
       'Owns the musical character of a piece; makes deliberate interpretive decisions and handles lead sheets.'),
      (6, 'Independence',
       'Learns and performs repertoire independently; self-directed practice and mature musical judgment.');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM approved_resources) THEN
    -- S0: Piano Journey
    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Technique I — Foundations',
           '5-finger scales, simple chords/triads, staccato vs. legato, intro to pedaling, cross-hand arpeggios.',
           'Technique', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 0;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Rhythm I — Basic Rhythms',
           'Whole, half, dotted-half, and quarter notes; 4/4 and 3/4 time.',
           'Rhythm', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 0;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Music Theory I',
           'Orientation, treble & bass clef, grand staff, middle C, time signatures, dynamics/volume.',
           'Theory', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 0;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Piano Adventures — Primer Level (Lesson Book)',
           'Pre-reading and first pieces; black-key groups, then staff orientation. First stop on the Piano Journey.',
           'Method', 'Nancy & Randall Faber', id
    FROM curriculum_stages WHERE stage_number = 0;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'My First Piano Adventure — Lesson Book A',
           'Colorful, engaging first lessons for young beginners',
           'Method', 'Nancy Faber', id
    FROM curriculum_stages WHERE stage_number = 0;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Piano Safari Level 1',
           'Rote and reading approach for absolute beginners',
           'Method', 'Katherine Fisher', id
    FROM curriculum_stages WHERE stage_number = 0;

    -- S1: Completion
    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Piano Adventures — Level 1 (Lesson Book)',
           'C-position, G-position, intervals, and basic note reading on the staff.',
           'Method', 'Nancy & Randall Faber', id
    FROM curriculum_stages WHERE stage_number = 1;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'R.H. Melody / L.H. Bass Playing',
           'Right-hand melody with left-hand bass-note accompaniment.',
           'Rhythm', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 1;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Music Theory II',
           'Intervals, steps & skips, basic key signatures, dynamics markings.',
           'Theory', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 1;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Sight Reading I',
           'Intervallic reading, pattern recognition, rhythm-only sight reading.',
           'Sight Reading', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 1;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Basic Rhythms II',
           'Eighth notes; 2/4, 3/4, 4/4 time; dotted-eighth-to-16th patterns; rests and quarter rests.',
           'Rhythm', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 1;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Faber Piano Adventures Level 1',
           'Core method book for beginner level 1',
           'Method', 'Nancy Faber', id
    FROM curriculum_stages WHERE stage_number = 1;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Piano Town Technic Level 1',
           'Simple technique exercises for beginners',
           'Technique', 'Keith Snell', id
    FROM curriculum_stages WHERE stage_number = 1;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Alfred''s Basic Piano Theory Level 1A',
           'Foundational theory workbook',
           'Theory', 'Willard Palmer', id
    FROM curriculum_stages WHERE stage_number = 1;

    -- S2: Continuity
    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Music Theory III',
           'Primary chords, key signatures, transposition, minor five-finger patterns.',
           'Theory', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 2;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Piano Adventures — Level 2A (Lesson Book)',
           'C, G, F, D, A, E positions; I-IV-V7 chords; eighth notes and transposition.',
           'Method', 'Nancy & Randall Faber', id
    FROM curriculum_stages WHERE stage_number = 2;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Sight Reading II',
           'Multi-key sight reading, two-handed coordination at first sight.',
           'Sight Reading', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 2;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'R.H. Melody / L.H. Chord Playing',
           'Right-hand melody with left-hand chord accompaniment.',
           'Rhythm', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 2;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Technique II',
           '1-octave scales, major & minor scales, chord inversions.',
           'Technique', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 2;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Faber Piano Adventures Level 2A',
           'Building reading skills beyond 5-finger',
           'Method', 'Nancy Faber', id
    FROM curriculum_stages WHERE stage_number = 2;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Faber Theory Level 2',
           'Theory companion to Level 2A method',
           'Theory', 'Nancy Faber', id
    FROM curriculum_stages WHERE stage_number = 2;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Burgmüller 25 Easy Studies Op. 100 (selected)',
           'Expressive character pieces ideal for early reading stage',
           'Repertoire', 'Friedrich Burgmüller', id
    FROM curriculum_stages WHERE stage_number = 2;

    -- S3: Confidence
    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Basic Rhythms III',
           '3/8 and 6/8 time signatures; syncopations; triplets; 16th-note rhythms.',
           'Rhythm', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 3;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Music Theory IV',
           'Chord inversions, secondary chords, form and phrasing analysis.',
           'Theory', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 3;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'R.H. Chord / L.H. Melody Playing',
           'Right-hand chords with left-hand melody — coordination inversion.',
           'Rhythm', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 3;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Piano Adventures — Level 2B (Lesson Book)',
           'Cross-hand arpeggios, syncopation, primary chords in multiple keys.',
           'Method', 'Nancy & Randall Faber', id
    FROM curriculum_stages WHERE stage_number = 3;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Royal Conservatory Theory Level 2',
           'RCM-aligned theory for late beginners',
           'Theory', 'RCM', id
    FROM curriculum_stages WHERE stage_number = 3;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Hanon — The Virtuoso Pianist (first exercises)',
           'Technical exercises, first 10 for late beginners',
           'Technique', 'C.L. Hanon', id
    FROM curriculum_stages WHERE stage_number = 3;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Faber Piano Adventures Level 3A',
           'Late beginner method with more independence',
           'Method', 'Nancy Faber', id
    FROM curriculum_stages WHERE stage_number = 3;

    -- S4: Expression
    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Sight Reading III',
           'Expressive sight reading with dynamics and articulation observed at first glance.',
           'Sight Reading', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 4;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Technique III',
           '2-octave scales, 2-octave arpeggios.',
           'Technique', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 4;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Piano Adventures — Level 3A (Lesson Book)',
           'Octave playing, 6/8 time, damper pedal technique, expressive dynamics.',
           'Method', 'Nancy & Randall Faber', id
    FROM curriculum_stages WHERE stage_number = 4;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Music Theory V',
           'Harmonic analysis, cadences, lead-sheet symbols, style periods.',
           'Theory', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 4;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Sonatina Album (Clementi, Kuhlau)',
           'Classic sonatinas for early intermediate level',
           'Repertoire', 'Various', id
    FROM curriculum_stages WHERE stage_number = 4;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Royal Conservatory Theory Level 3',
           'RCM theory level 3',
           'Theory', 'RCM', id
    FROM curriculum_stages WHERE stage_number = 4;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Alfred''s All-in-One Course Level 2',
           'Comprehensive early intermediate method',
           'Method', 'Willard Palmer', id
    FROM curriculum_stages WHERE stage_number = 4;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Czerny — 100 Progressive Studies Op. 139 (selected)',
           'Progressive studies building scale and chord facility',
           'Technique', 'Carl Czerny', id
    FROM curriculum_stages WHERE stage_number = 4;

    -- S5: Interpretation
    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Piano Adventures — Level 4 (Lesson Book)',
           'Three-note accompaniment patterns, hand-crossing, chord inversions in repertoire.',
           'Method', 'Nancy & Randall Faber', id
    FROM curriculum_stages WHERE stage_number = 5;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Basic Rhythms IV',
           'Changing time signatures within a piece.',
           'Rhythm', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 5;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Piano Adventures — Level 3B (Lesson Book)',
           'Dotted-eighth/sixteenth rhythms, one-octave scales, lead-sheet playing.',
           'Method', 'Nancy & Randall Faber', id
    FROM curriculum_stages WHERE stage_number = 5;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Basic Lead Sheet',
           'Lead-sheet reading introduced across Levels 2A, 3A, 3B, and 4 — chord symbols and melody.',
           'Sight Reading', 'Skill Track', id
    FROM curriculum_stages WHERE stage_number = 5;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'RCM Piano Repertoire Grade 5',
           'Official RCM Grade 5 repertoire anthology',
           'Repertoire', 'RCM', id
    FROM curriculum_stages WHERE stage_number = 5;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Royal Conservatory Theory Level 5',
           'RCM theory level 5 — harmony and analysis begins',
           'Theory', 'RCM', id
    FROM curriculum_stages WHERE stage_number = 5;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Hanon — The Virtuoso Pianist (all 60)',
           'Full Hanon for intermediate technique development',
           'Technique', 'C.L. Hanon', id
    FROM curriculum_stages WHERE stage_number = 5;

    -- S6: Independence
    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Piano Adventures — Level 5 (Lesson Book)',
           'Two-octave scales, ornaments, stylistic interpretation — early-advanced repertoire.',
           'Method', 'Nancy & Randall Faber', id
    FROM curriculum_stages WHERE stage_number = 6;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Royal Conservatory Theory Level 8',
           'Advanced harmony, counterpoint, and analysis',
           'Theory', 'RCM', id
    FROM curriculum_stages WHERE stage_number = 6;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'RCM Piano Repertoire Grade 8',
           'Official RCM Grade 8 repertoire — advanced works',
           'Repertoire', 'RCM', id
    FROM curriculum_stages WHERE stage_number = 6;

    INSERT INTO approved_resources (name, description, category, author, stage_id)
    SELECT 'Clementi Gradus ad Parnassum (selected)',
           'Advanced études for concert-level technique',
           'Technique', 'Muzio Clementi', id
    FROM curriculum_stages WHERE stage_number = 6;
  END IF;
END $$;
