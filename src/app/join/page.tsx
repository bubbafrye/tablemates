"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeRoomCode, sessionPath } from "@/platform/codes";

function JoinPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = useMemo(
    () => normalizeRoomCode(searchParams.get("code") ?? ""),
    [searchParams],
  );

  useEffect(() => {
    if (!code) {
      router.replace("/");
      return;
    }
    router.replace(sessionPath(code));
  }, [code, router]);

  return null;
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinPageInner />
    </Suspense>
  );
}
