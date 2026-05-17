-- =============================================================================
-- Amirant E2E demo — course + 23-question bank (difficulty 1–6, tagged topics)
-- Short free demo: 10 Q, intermediate+ (see app `AMIRANT_DEMO_SHORT_QUIZ_*`).
-- Prerequisites: run `learning-intelligence-schema.sql` first.
-- Idempotent on fixed primary keys (ON CONFLICT DO NOTHING where applicable).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Category & course
-- ---------------------------------------------------------------------------
INSERT INTO course_categories (id, slug, title, sort_order)
VALUES ('20000001-0000-4000-8000-000000000001', 'amirant-prep', 'הכנה לאמירנט', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO courses (id, category_id, slug, title, description, published, version)
VALUES (
  '20000001-0000-4000-8000-000000000002',
  '20000001-0000-4000-8000-000000000001',
  'amirant-demo',
  'אמירנט — קורס הכנה מלא (סילבוס)',
  'מבנה לפי סילבוס מאל״ו: מבוא, אוצר מילים, סוגי שאלות, פיילוט, סימולציות. בנק 23 שאלות, רמות קושי 1–6.',
  true,
  1
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Modules (2) + lessons (6): video / text / mixed (practice)
-- ---------------------------------------------------------------------------
INSERT INTO modules (id, course_id, title, sort_order) VALUES
  ('20000001-0000-4000-8000-000000000010', '20000001-0000-4000-8000-000000000002', 'מודול 1 · יסודות', 0),
  ('20000001-0000-4000-8000-000000000011', '20000001-0000-4000-8000-000000000002', 'מודול 2 · מיומנויות מבחן', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, module_id, title, sort_order, kind, body_md, video_storage_path, video_duration_sec, estimated_minutes) VALUES
  ('20000001-0000-4000-8000-000000000021', '20000001-0000-4000-8000-000000000010', 'פתיחה — אסטרטגיית קריאה', 0, 'video', NULL, 'demo/amirant/m1-intro-reading.mp4', 720, 12),
  ('20000001-0000-4000-8000-000000000022', '20000001-0000-4000-8000-000000000010', 'דקדוק אקדמי — סקירה', 1, 'text', E'# דקדוק אקדמי\n\nשימו לב בזמנים, מילות קישור והתאמה לנושא.', NULL, NULL, 25),
  ('20000001-0000-4000-8000-000000000023', '20000001-0000-4000-8000-000000000010', 'תרגול מודול 1', 2, 'mixed', E'# תרגול\n\nעברו על הדוגמאות והמשיכו לשיעור הבא.', NULL, NULL, 20),
  ('20000001-0000-4000-8000-000000000024', '20000001-0000-4000-8000-000000000011', 'הבנת הנקרא — טכניקות', 0, 'video', NULL, 'demo/amirant/m2-reading-skills.mp4', 900, 15),
  ('20000001-0000-4000-8000-000000000025', '20000001-0000-4000-8000-000000000011', 'אוצר מילים בהקשר', 1, 'text', E'# אוצר מילים\n\nלמדו מילים מתוך משפטים מלאים, לא רשימות מבודדות.', NULL, NULL, 30),
  ('20000001-0000-4000-8000-000000000026', '20000001-0000-4000-8000-000000000011', 'בוחן דמו — מבחן אמירנט (מלא)', 2, 'mixed', E'# בוחן דמו\n\nלמטה מוצמד בוחן הערכה. זמן מומלץ: 45 דקות.', NULL, NULL, 45)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Topics & subtopics (for tagging + adaptive / weak-topic)
-- ---------------------------------------------------------------------------
INSERT INTO topics (id, course_id, slug, label) VALUES
  ('20000001-0000-4000-8000-000000000031', '20000001-0000-4000-8000-000000000002', 'vocabulary', 'אוצר מילים'),
  ('20000001-0000-4000-8000-000000000032', '20000001-0000-4000-8000-000000000002', 'reading_comprehension', 'הבנת הנקרא'),
  ('20000001-0000-4000-8000-000000000033', '20000001-0000-4000-8000-000000000002', 'sentence_completion', 'השלמת משפטים'),
  ('20000001-0000-4000-8000-000000000034', '20000001-0000-4000-8000-000000000002', 'rephrasing', 'ניסוח מחדש')
ON CONFLICT (id) DO NOTHING;

INSERT INTO subtopics (id, topic_id, slug, label) VALUES
  ('20000001-0000-4000-8000-000000000041', '20000001-0000-4000-8000-000000000031', 'academic_verbs', 'פעלים אקדמיים'),
  ('20000001-0000-4000-8000-000000000042', '20000001-0000-4000-8000-000000000031', 'synonyms', 'מילים נרדפות'),
  ('20000001-0000-4000-8000-000000000043', '20000001-0000-4000-8000-000000000032', 'main_idea', 'רעיון מרכזי'),
  ('20000001-0000-4000-8000-000000000044', '20000001-0000-4000-8000-000000000032', 'inference', 'הסקה מהטקסט'),
  ('20000001-0000-4000-8000-000000000045', '20000001-0000-4000-8000-000000000033', 'connectors', 'מילות קישור'),
  ('20000001-0000-4000-8000-000000000046', '20000001-0000-4000-8000-000000000033', 'collocations', 'צירופי מילים'),
  ('20000001-0000-4000-8000-000000000047', '20000001-0000-4000-8000-000000000034', 'restatement', 'התאמה למשמעות')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Quiz (attached to final lesson)
-- ---------------------------------------------------------------------------
INSERT INTO quizzes (id, lesson_id, title, time_limit_sec, passing_score_pct, sort_order)
VALUES (
  '20000001-0000-4000-8000-000000000040',
  '20000001-0000-4000-8000-000000000026',
  'בוחן דמו אמירנט — גרסת מערכת',
  2340,
  60,
  0
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Questions (20) — בנק לסימולציה; רמות 1–6
-- ---------------------------------------------------------------------------
INSERT INTO quiz_questions (id, quiz_id, order_index, prompt, type, topic_id, subtopic_id, difficulty, explanation) VALUES
('20000001-0000-4000-8000-000000000101', '20000001-0000-4000-8000-000000000040', 1,
 E'The study _____ a significant link between diet and focus.',
 'single_choice', '20000001-0000-4000-8000-000000000031', '20000001-0000-4000-8000-000000000041', 1,
 E'Subject "study" is singular; present tense "demonstrates" agrees.'),
('20000001-0000-4000-8000-000000000102', '20000001-0000-4000-8000-000000000040', 2,
 E'Primary purpose of the paragraph: "Many students underestimate how much time reading in English actually takes. Planning blocks of 45 minutes tends to work better than short fragments."',
 'single_choice', '20000001-0000-4000-8000-000000000032', '20000001-0000-4000-8000-000000000043', 1,
 E'Main idea: allocate meaningful time blocks for English reading.'),
('20000001-0000-4000-8000-000000000103', '20000001-0000-4000-8000-000000000040', 3,
 E'_____, the team decided to postpone the experiment.',
 'single_choice', '20000001-0000-4000-8000-000000000033', '20000001-0000-4000-8000-000000000045', 2,
 E'"However" introduces contrast with the previous clause (often implied).'),
('20000001-0000-4000-8000-000000000104', '20000001-0000-4000-8000-000000000040', 4,
 E'Choose the closest synonym to "significant" in academic writing:',
 'single_choice', '20000001-0000-4000-8000-000000000031', '20000001-0000-4000-8000-000000000042', 2,
 E'"Substantial" matches formal nuance of "significant".'),
('20000001-0000-4000-8000-000000000105', '20000001-0000-4000-8000-000000000040', 5,
 E'It can be inferred from the passage that the author believes open-ended questions are useful because _____.',
 'single_choice', '20000001-0000-4000-8000-000000000032', '20000001-0000-4000-8000-000000000044', 3,
 E'Inference must follow evidence in the text, not outside knowledge.'),
('20000001-0000-4000-8000-000000000106', '20000001-0000-4000-8000-000000000040', 6,
 E'Complete: Students are expected to _____ with the assigned readings before class.',
 'single_choice', '20000001-0000-4000-8000-000000000033', '20000001-0000-4000-8000-000000000046', 3,
 E'Collocation: "engage with" readings is natural academic English.'),
('20000001-0000-4000-8000-000000000107', '20000001-0000-4000-8000-000000000040', 7,
 E'Which verb fits best? The data _____ previous assumptions.',
 'single_choice', '20000001-0000-4000-8000-000000000031', '20000001-0000-4000-8000-000000000041', 3,
 E'"Challenge" fits academic reporting; check tense and agreement.'),
('20000001-0000-4000-8000-000000000108', '20000001-0000-4000-8000-000000000040', 8,
 E'The author''s tone in the conclusion is best described as _____.',
 'single_choice', '20000001-0000-4000-8000-000000000032', '20000001-0000-4000-8000-000000000043', 4,
 E'Identify tone from word choice, not your personal reaction.'),
('20000001-0000-4000-8000-000000000109', '20000001-0000-4000-8000-000000000040', 9,
 E'_____ the budget was limited, the pilot succeeded.',
 'single_choice', '20000001-0000-4000-8000-000000000033', '20000001-0000-4000-8000-000000000045', 4,
 E'"Although" sets up concessive clause; comma separates clauses correctly.'),
('20000001-0000-4000-8000-000000000110', '20000001-0000-4000-8000-000000000040', 10,
 E'Pick the best synonym for "prevalent" in a formal text:',
 'single_choice', '20000001-0000-4000-8000-000000000031', '20000001-0000-4000-8000-000000000042', 4,
 E'"Widespread" is a close formal synonym depending on context.'),
('20000001-0000-4000-8000-000000000111', '20000001-0000-4000-8000-000000000040', 11,
 E'Which statement is most supported by the passage alone?',
 'single_choice', '20000001-0000-4000-8000-000000000032', '20000001-0000-4000-8000-000000000044', 5,
 E'High difficulty: avoid over-inference beyond explicit support.'),
('20000001-0000-4000-8000-000000000112', '20000001-0000-4000-8000-000000000040', 12,
 E'Choose the natural collocation: The policy aims to _____ access to higher education.',
 'single_choice', '20000001-0000-4000-8000-000000000033', '20000001-0000-4000-8000-000000000046', 5,
 E'"Expand access" is a standard academic collocation.'),
('20000001-0000-4000-8000-000000000113', '20000001-0000-4000-8000-000000000040', 13,
 E'The findings are _____ with earlier studies on sleep and memory.',
 'single_choice', '20000001-0000-4000-8000-000000000033', '20000001-0000-4000-8000-000000000046', 3,
 E'"Consistent with" is a standard academic collocation.'),
('20000001-0000-4000-8000-000000000114', '20000001-0000-4000-8000-000000000040', 14,
 E'In academic writing, "mitigate" is closest in meaning to:',
 'single_choice', '20000001-0000-4000-8000-000000000031', '20000001-0000-4000-8000-000000000042', 4,
 E'"Mitigate" means to make something less severe — "alleviate" fits best here.'),
('20000001-0000-4000-8000-000000000115', '20000001-0000-4000-8000-000000000040', 15,
 E'The paragraph argues that "peer review does not guarantee truth, but it reduces obvious errors." The author''s stance is best described as:',
 'single_choice', '20000001-0000-4000-8000-000000000032', '20000001-0000-4000-8000-000000000043', 5,
 E'The author acknowledges limits while defending a modest benefit — qualified support.'),
('20000001-0000-4000-8000-000000000116', '20000001-0000-4000-8000-000000000040', 16,
 E'_____ several limitations, the model predicts outcomes reasonably well.',
 'single_choice', '20000001-0000-4000-8000-000000000033', '20000001-0000-4000-8000-000000000045', 5,
 E'"Despite" + noun phrase introduces concession; "Although" would need a clause.'),
('20000001-0000-4000-8000-000000000117', '20000001-0000-4000-8000-000000000040', 17,
 E'Choose the best replacement for "ubiquitous" in a formal abstract:',
 'single_choice', '20000001-0000-4000-8000-000000000031', '20000001-0000-4000-8000-000000000042', 6,
 E'"Pervasive" captures "present everywhere" in formal registers.'),
('20000001-0000-4000-8000-000000000118', '20000001-0000-4000-8000-000000000040', 18,
 E'From the passage alone: if the experiment lacked a control group, what is the most careful conclusion?',
 'single_choice', '20000001-0000-4000-8000-000000000032', '20000001-0000-4000-8000-000000000044', 6,
 E'Without a control group, causal claims should be weakened to correlational language.'),
('20000001-0000-4000-8000-000000000119', '20000001-0000-4000-8000-000000000040', 19,
 E'The committee was reluctant to _____ the controversial proposal without further data.',
 'single_choice', '20000001-0000-4000-8000-000000000033', '20000001-0000-4000-8000-000000000046', 6,
 E'"Endorse" collocates with proposals in academic/policy contexts.'),
('20000001-0000-4000-8000-000000000120', '20000001-0000-4000-8000-000000000040', 20,
 E'Which verb best fits? The authors _____ that the effect may be culturally specific.',
 'single_choice', '20000001-0000-4000-8000-000000000031', '20000001-0000-4000-8000-000000000041', 5,
 E'"Acknowledge" is common hedging in academic discussion of limitations.'),
('20000001-0000-4000-8000-000000000121', '20000001-0000-4000-8000-000000000040', 21,
 E'Which option best restates the meaning? Original: "The policy is unlikely to change before the election."',
 'single_choice', '20000001-0000-4000-8000-000000000034', '20000001-0000-4000-8000-000000000047', 3,
 E'Same meaning: unlikely to change prior to the election = not expected to change before it.'),
('20000001-0000-4000-8000-000000000122', '20000001-0000-4000-8000-000000000040', 22,
 E'Choose the closest restatement: "She declined the offer because it conflicted with her values."',
 'single_choice', '20000001-0000-4000-8000-000000000034', '20000001-0000-4000-8000-000000000047', 4,
 E'"Turned down" = declined; "clashed with" parallels "conflicted with" in this context.'),
('20000001-0000-4000-8000-000000000123', '20000001-0000-4000-8000-000000000040', 23,
 E'Best paraphrase: "Notwithstanding the risks, the team pushed ahead with the trial."',
 'single_choice', '20000001-0000-4000-8000-000000000034', '20000001-0000-4000-8000-000000000047', 5,
 E'"Notwithstanding" = despite; "pushed ahead" = continued / proceeded.')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Options: 4 per question; exactly one is_correct = true (index 0 = A ... 3 = D)
-- Correct answers: A,B,A,B,B,B,B,B,A,B,B,B (1-based letter mapping below in comments)
-- ---------------------------------------------------------------------------

-- Q1 demonstrates / demonstrate / demonstrated / demonstrating  -> demonstrates (A)
INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000201', '20000001-0000-4000-8000-000000000101', 0, 'demonstrates', true),
('20000001-0000-4000-8000-000000000202', '20000001-0000-4000-8000-000000000101', 1, 'demonstrate', false),
('20000001-0000-4000-8000-000000000203', '20000001-0000-4000-8000-000000000101', 2, 'demonstrated', false),
('20000001-0000-4000-8000-000000000204', '20000001-0000-4000-8000-000000000101', 3, 'demonstrating', false)
ON CONFLICT (id) DO NOTHING;

-- Q2 main idea
INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000205', '20000001-0000-4000-8000-000000000102', 0, 'Short fragments are always better than long sessions', false),
('20000001-0000-4000-8000-000000000206', '20000001-0000-4000-8000-000000000102', 1, 'Students should plan longer focused blocks for reading in English', true),
('20000001-0000-4000-8000-000000000207', '20000001-0000-4000-8000-000000000102', 2, 'Reading in English takes the same time as in Hebrew', false),
('20000001-0000-4000-8000-000000000208', '20000001-0000-4000-8000-000000000102', 3, 'The paragraph is mainly about diet', false)
ON CONFLICT (id) DO NOTHING;

-- Q3 However / Although / Therefore / Moreover -> However (A)
INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000209', '20000001-0000-4000-8000-000000000103', 0, 'However', true),
('20000001-0000-4000-8000-000000000210', '20000001-0000-4000-8000-000000000103', 1, 'Although', false),
('20000001-0000-4000-8000-000000000211', '20000001-0000-4000-8000-000000000103', 2, 'Therefore', false),
('20000001-0000-4000-8000-000000000212', '20000001-0000-4000-8000-000000000103', 3, 'Moreover', false)
ON CONFLICT (id) DO NOTHING;

-- Q4 synonym significant -> substantial (B index 1)
INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000213', '20000001-0000-4000-8000-000000000104', 0, 'tiny', false),
('20000001-0000-4000-8000-000000000214', '20000001-0000-4000-8000-000000000104', 1, 'substantial', true),
('20000001-0000-4000-8000-000000000215', '20000001-0000-4000-8000-000000000104', 2, 'irrelevant', false),
('20000001-0000-4000-8000-000000000216', '20000001-0000-4000-8000-000000000104', 3, 'random', false)
ON CONFLICT (id) DO NOTHING;

-- Q5 inference (B)
INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000217', '20000001-0000-4000-8000-000000000105', 0, 'They are useless', false),
('20000001-0000-4000-8000-000000000218', '20000001-0000-4000-8000-000000000105', 1, 'They encourage deeper processing of the text', true),
('20000001-0000-4000-8000-000000000219', '20000001-0000-4000-8000-000000000105', 2, 'They replace the need to read', false),
('20000001-0000-4000-8000-000000000220', '20000001-0000-4000-8000-000000000105', 3, 'They are only for beginners', false)
ON CONFLICT (id) DO NOTHING;

-- Q6 engage with (B)
INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000221', '20000001-0000-4000-8000-000000000106', 0, 'argue against', false),
('20000001-0000-4000-8000-000000000222', '20000001-0000-4000-8000-000000000106', 1, 'engage with', true),
('20000001-0000-4000-8000-000000000223', '20000001-0000-4000-8000-000000000106', 2, 'ignore', false),
('20000001-0000-4000-8000-000000000224', '20000001-0000-4000-8000-000000000106', 3, 'copy', false)
ON CONFLICT (id) DO NOTHING;

-- Q7 challenge (B)
INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000225', '20000001-0000-4000-8000-000000000107', 0, 'ignores', false),
('20000001-0000-4000-8000-000000000226', '20000001-0000-4000-8000-000000000107', 1, 'challenges', true),
('20000001-0000-4000-8000-000000000227', '20000001-0000-4000-8000-000000000107', 2, 'copy', false),
('20000001-0000-4000-8000-000000000228', '20000001-0000-4000-8000-000000000107', 3, 'decorate', false)
ON CONFLICT (id) DO NOTHING;

-- Q8 tone (B) cautious
INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000229', '20000001-0000-4000-8000-000000000108', 0, 'hostile', false),
('20000001-0000-4000-8000-000000000230', '20000001-0000-4000-8000-000000000108', 1, 'cautiously optimistic', true),
('20000001-0000-4000-8000-000000000231', '20000001-0000-4000-8000-000000000108', 2, 'sarcastic', false),
('20000001-0000-4000-8000-000000000232', '20000001-0000-4000-8000-000000000108', 3, 'joyful', false)
ON CONFLICT (id) DO NOTHING;

-- Q9 Although (A)
INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000233', '20000001-0000-4000-8000-000000000109', 0, 'Although', true),
('20000001-0000-4000-8000-000000000234', '20000001-0000-4000-8000-000000000109', 1, 'Because', false),
('20000001-0000-4000-8000-000000000235', '20000001-0000-4000-8000-000000000109', 2, 'Unless', false),
('20000001-0000-4000-8000-000000000236', '20000001-0000-4000-8000-000000000109', 3, 'While', false)
ON CONFLICT (id) DO NOTHING;

-- Q10 prevalent -> widespread (B)
INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000237', '20000001-0000-4000-8000-000000000110', 0, 'rare', false),
('20000001-0000-4000-8000-000000000238', '20000001-0000-4000-8000-000000000110', 1, 'widespread', true),
('20000001-0000-4000-8000-000000000239', '20000001-0000-4000-8000-000000000110', 2, 'illegal', false),
('20000001-0000-4000-8000-000000000240', '20000001-0000-4000-8000-000000000110', 3, 'private', false)
ON CONFLICT (id) DO NOTHING;

-- Q11 inference hard (B)
INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000241', '20000001-0000-4000-8000-000000000111', 0, 'The author dislikes universities', false),
('20000001-0000-4000-8000-000000000242', '20000001-0000-4000-8000-000000000111', 1, 'The passage supports structured practice over cramming', true),
('20000001-0000-4000-8000-000000000243', '20000001-0000-4000-8000-000000000111', 2, 'Cramming always works', false),
('20000001-0000-4000-8000-000000000244', '20000001-0000-4000-8000-000000000111', 3, 'The author is neutral about all methods', false)
ON CONFLICT (id) DO NOTHING;

-- Q12 expand access (B)
INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000245', '20000001-0000-4000-8000-000000000112', 0, 'reduce', false),
('20000001-0000-4000-8000-000000000246', '20000001-0000-4000-8000-000000000112', 1, 'expand', true),
('20000001-0000-4000-8000-000000000247', '20000001-0000-4000-8000-000000000112', 2, 'deny', false),
('20000001-0000-4000-8000-000000000248', '20000001-0000-4000-8000-000000000112', 3, 'ignore', false)
ON CONFLICT (id) DO NOTHING;

-- Q13–Q20 (options 249–280)
INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000249', '20000001-0000-4000-8000-000000000113', 0, 'angry', false),
('20000001-0000-4000-8000-000000000250', '20000001-0000-4000-8000-000000000113', 1, 'consistent', true),
('20000001-0000-4000-8000-000000000251', '20000001-0000-4000-8000-000000000113', 2, 'silent', false),
('20000001-0000-4000-8000-000000000252', '20000001-0000-4000-8000-000000000113', 3, 'heavy', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000253', '20000001-0000-4000-8000-000000000114', 0, 'worsen', false),
('20000001-0000-4000-8000-000000000254', '20000001-0000-4000-8000-000000000114', 1, 'alleviate', true),
('20000001-0000-4000-8000-000000000255', '20000001-0000-4000-8000-000000000114', 2, 'ignore completely', false),
('20000001-0000-4000-8000-000000000256', '20000001-0000-4000-8000-000000000114', 3, 'postpone indefinitely', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000257', '20000001-0000-4000-8000-000000000115', 0, 'Peer review is useless', false),
('20000001-0000-4000-8000-000000000258', '20000001-0000-4000-8000-000000000115', 1, 'Peer review is imperfect but still valuable', true),
('20000001-0000-4000-8000-000000000259', '20000001-0000-4000-8000-000000000115', 2, 'Truth is impossible in science', false),
('20000001-0000-4000-8000-000000000260', '20000001-0000-4000-8000-000000000115', 3, 'Errors are impossible after review', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000261', '20000001-0000-4000-8000-000000000116', 0, 'Despite', true),
('20000001-0000-4000-8000-000000000262', '20000001-0000-4000-8000-000000000116', 1, 'Although', false),
('20000001-0000-4000-8000-000000000263', '20000001-0000-4000-8000-000000000116', 2, 'Because', false),
('20000001-0000-4000-8000-000000000264', '20000001-0000-4000-8000-000000000116', 3, 'Unless', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000265', '20000001-0000-4000-8000-000000000117', 0, 'rare', false),
('20000001-0000-4000-8000-000000000266', '20000001-0000-4000-8000-000000000117', 1, 'pervasive', true),
('20000001-0000-4000-8000-000000000267', '20000001-0000-4000-8000-000000000117', 2, 'illegal', false),
('20000001-0000-4000-8000-000000000268', '20000001-0000-4000-8000-000000000117', 3, 'temporary', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000269', '20000001-0000-4000-8000-000000000118', 0, 'The treatment definitely caused the outcome', false),
('20000001-0000-4000-8000-000000000270', '20000001-0000-4000-8000-000000000118', 1, 'Causal claims are harder to justify', true),
('20000001-0000-4000-8000-000000000271', '20000001-0000-4000-8000-000000000118', 2, 'The outcome is meaningless', false),
('20000001-0000-4000-8000-000000000272', '20000001-0000-4000-8000-000000000118', 3, 'Replication is unnecessary', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000273', '20000001-0000-4000-8000-000000000119', 0, 'borrow', false),
('20000001-0000-4000-8000-000000000274', '20000001-0000-4000-8000-000000000119', 1, 'endorse', true),
('20000001-0000-4000-8000-000000000275', '20000001-0000-4000-8000-000000000119', 2, 'paint', false),
('20000001-0000-4000-8000-000000000276', '20000001-0000-4000-8000-000000000119', 3, 'ignore', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000277', '20000001-0000-4000-8000-000000000120', 0, 'deny', false),
('20000001-0000-4000-8000-000000000278', '20000001-0000-4000-8000-000000000120', 1, 'acknowledge', true),
('20000001-0000-4000-8000-000000000279', '20000001-0000-4000-8000-000000000120', 2, 'forget', false),
('20000001-0000-4000-8000-000000000280', '20000001-0000-4000-8000-000000000120', 3, 'destroy', false)
ON CONFLICT (id) DO NOTHING;

-- Q21–Q23 rephrasing (restatement)
INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000281', '20000001-0000-4000-8000-000000000121', 0, 'The policy will probably change immediately after the election', false),
('20000001-0000-4000-8000-000000000282', '20000001-0000-4000-8000-000000000121', 1, 'The policy is not expected to change prior to the election', true),
('20000001-0000-4000-8000-000000000283', '20000001-0000-4000-8000-000000000121', 2, 'The election forced an immediate policy change', false),
('20000001-0000-4000-8000-000000000284', '20000001-0000-4000-8000-000000000121', 3, 'The policy had already changed before the campaign', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000285', '20000001-0000-4000-8000-000000000122', 0, 'She accepted the offer because it matched her values', false),
('20000001-0000-4000-8000-000000000286', '20000001-0000-4000-8000-000000000122', 1, 'She turned down the offer as it clashed with her principles', true),
('20000001-0000-4000-8000-000000000287', '20000001-0000-4000-8000-000000000122', 2, 'She ignored the offer and never read it', false),
('20000001-0000-4000-8000-000000000288', '20000001-0000-4000-8000-000000000122', 3, 'She revised the offer to match her budget', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, order_index, label, is_correct) VALUES
('20000001-0000-4000-8000-000000000289', '20000001-0000-4000-8000-000000000123', 0, 'Because of the risks, the team cancelled the trial', false),
('20000001-0000-4000-8000-000000000290', '20000001-0000-4000-8000-000000000123', 1, 'Despite the risks, the team continued with the trial', true),
('20000001-0000-4000-8000-000000000291', '20000001-0000-4000-8000-000000000123', 2, 'The team avoided the trial due to minor risks', false),
('20000001-0000-4000-8000-000000000292', '20000001-0000-4000-8000-000000000123', 3, 'The risks were removed before the trial began', false)
ON CONFLICT (id) DO NOTHING;

COMMIT;
