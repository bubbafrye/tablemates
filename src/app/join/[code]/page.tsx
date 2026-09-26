import { redirect } from "next/navigation";
import { normalizeRoomCode } from "@/platform/codes";

type JoinPageProps = {
  params: Promise<{ code: string }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params;
  redirect(`/s/${normalizeRoomCode(code)}`);
}
