import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GameLibrary } from "@/components/home/GameLibrary";
import { Hero } from "@/components/home/Hero";
import { RegisterCta } from "@/components/home/RegisterCta";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { parseGamesDataCsv } from "@/platform/gamesData";
import styles from "./page.module.css";

export default function Home() {
  const rows = parseGamesDataCsv(
    readFileSync(join(process.cwd(), "public/games-data.csv"), "utf8"),
  );

  return (
    <div className={styles.page}>
      <SiteHeader />
      <Hero />
      <GameLibrary rows={rows} />
      <RegisterCta />
      <SiteFooter />
    </div>
  );
}
