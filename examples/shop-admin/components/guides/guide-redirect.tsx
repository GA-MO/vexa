"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** /tests moved to /guides; a client redirect keeps the old links alive in the static export too. */
export function GuideRedirect({ id }: { id?: string }) {
  const router = useRouter();
  const target = id ? `/guides/${id}` : "/guides";
  useEffect(() => {
    router.replace(target);
  }, [router, target]);
  return (
    <p className="p-6 text-sm text-muted-foreground">
      Moved to <Link href={target}>{target}</Link>.
    </p>
  );
}
