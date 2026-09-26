import { GameLibrary } from "@/components/home/GameLibrary";
import { Hero } from "@/components/home/Hero";
import { RegisterCta } from "@/components/home/RegisterCta";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <Hero />
      <GameLibrary />
      <RegisterCta />
      <SiteFooter />
    </div>
  );
}
