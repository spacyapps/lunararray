"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// UA sniffing in proxy.ts misses phones running with "Request Desktop Website"
// (and iPadOS, which sends a Mac UA by default). This catches those by the one
// thing that's always honest: the viewport. The two breakpoints are
// complementary (≤ vs >), so / and /mobile can each guard without looping.
export default function ViewportRedirect({
  to,
  query,
}: {
  to: string;
  query: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => {
      if (mq.matches) router.replace(to);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [router, to, query]);

  return null;
}
