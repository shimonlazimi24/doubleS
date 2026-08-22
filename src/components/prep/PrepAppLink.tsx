import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * A link to a signed-in page, without prefetching.
 *
 * Next prefetches every `<Link>` that scrolls into view. For a static marketing
 * page that is nearly free and genuinely helps. For the pages behind the login
 * it is the opposite: each prefetch runs the middleware's auth check and the
 * page's own queries against a database in Tokyo, for a page the learner may
 * never open. Measured on the live site, one visit to the personal area
 * prefetched the dashboard (4.6s), settings (3.1s), weak-quiz (1.4s) and the
 * continue router (1.3s) — none of which had been clicked.
 *
 * Use this for anything under the login. Keep plain `Link` on marketing pages.
 */
export function PrepAppLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} prefetch={false} />;
}
