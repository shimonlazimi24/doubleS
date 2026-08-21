import { AmirantCurriculumHub } from "@/components/prep/amirant-course/AmirantCurriculumHub";
import { getSiteVideos } from "@/lib/prep/site-settings.server";

export default async function AmirantCourseHomePage() {
  const videos = await getSiteVideos();
  return <AmirantCurriculumHub introVideoUrl={videos.courseRoadmap} />;
}
