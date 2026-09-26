import { SessionView } from "@/components/session/SessionView";
import { normalizeRoomCode } from "@/platform/codes";

type SessionPageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ game?: string }>;
};

export default async function SessionPage({ params, searchParams }: SessionPageProps) {
  const { code } = await params;
  const { game } = await searchParams;
  return <SessionView code={normalizeRoomCode(code)} gameId={game} />;
}
