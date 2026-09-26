export const site = {
  name: "tablemates",
  title: "tablemates",
  description: "Pick a game. Bring your people.",
  figma: "https://www.figma.com/design/tE15PVyJVeYZ6XP0d0xfMc/Untitled?node-id=0-1",
};

export function basePath() {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

/** Prefix public asset / app paths when deployed under a subpath (GitHub Pages). */
export function withBasePath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath()}${normalized}`;
}

export function contactMailto() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  if (!email) return "mailto:";
  return `mailto:${email}`;
}

export function partyHost() {
  return process.env.NEXT_PUBLIC_PARTY_HOST ?? "127.0.0.1:1999";
}
