export const site = {
  name: "tablemates",
  title: "tablemates",
  description: "Pick a game. Bring your people.",
  figma: "https://www.figma.com/design/tE15PVyJVeYZ6XP0d0xfMc/Untitled?node-id=0-1",
};

export function contactMailto() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  if (!email) return "mailto:";
  return `mailto:${email}`;
}

export function partyHost() {
  return process.env.NEXT_PUBLIC_PARTY_HOST ?? "127.0.0.1:1999";
}
