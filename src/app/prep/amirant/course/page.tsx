import { AMIRANT_PREPARATION_MANIFEST, getManifestQuiz } from "@/lib/amirant-course";
import { PREP_BASE } from "@/lib/prep/constants";
import { Container } from "@/components/ui";
import { AmirantCourseOverallProgress } from "@/components/prep/amirant-course/AmirantCourseOverallProgress";
import { AmirantCourseLandingPage } from "@/components/prep/amirant-course/AmirantCourseLandingPage";

const BASE = `${PREP_BASE}/amirant/course`;

/** מבחן קצר לכפתורי הלנדינג; אם אין במניפסט (ייבוא עתידי) — נופלים למבחן ראשון כללי */
const LANDING_TASTE_QUIZ_ID = "quiz-landing-taste";

export default function AmirantCourseHomePage() {
  const m = AMIRANT_PREPARATION_MANIFEST;
  const firstQuiz = m.modules.flatMap((moduleItem) => moduleItem.quizzes).at(0) ?? null;
  const firstSimulation = m.simulations.at(0) ?? null;
  const tasteQuiz = getManifestQuiz(LANDING_TASTE_QUIZ_ID);
  const demoQuizHref = tasteQuiz
    ? `${BASE}/quiz/${tasteQuiz.id}`
    : firstQuiz
      ? `${BASE}/quiz/${firstQuiz.id}`
      : BASE;
  const firstSimulationHref = firstSimulation ? `${BASE}/simulation/${firstSimulation.id}` : null;

  return (
    <Container max="measureWide">
      <div>
        <AmirantCourseOverallProgress />
        <AmirantCourseLandingPage
          title={m.title}
          description={m.description}
          demoQuizHref={demoQuizHref}
          firstSimulationHref={firstSimulationHref}
          dashboardHref={`${BASE}/dashboard`}
        />
      </div>
    </Container>
  );
}
