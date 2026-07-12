import { notFound } from "next/navigation";

/** אין עדיין מאמרים שפורסמו - כל סלאג מחזיר 404 עד שיהיה תוכן אמיתי. */
export default function PrepBlogPostPage() {
  notFound();
}
