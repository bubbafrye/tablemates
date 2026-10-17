import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MarkdownDoc } from "@/components/docs/MarkdownDoc";
import { withBasePath } from "@/platform/site";
import styles from "./page.module.css";

export const metadata = {
  title: "Backend readme · tablemates",
  description: "How tablemates’ Cloudflare / PartyServer backend works.",
};

export default function BackendReadmePage() {
  const markdown = readFileSync(join(process.cwd(), "docs/BACKEND.md"), "utf8");

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <p className={styles.crumb}>
          <a href={withBasePath("/")}>tablemates</a>
          <span aria-hidden> / </span>
          <span>Backend readme</span>
        </p>
        <MarkdownDoc markdown={markdown} />
      </main>
      <SiteFooter />
    </div>
  );
}
