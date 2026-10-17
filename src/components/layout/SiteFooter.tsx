"use client";

import { useState } from "react";
import { contactMailto, withBasePath } from "@/platform/site";
import { UsageDashboard } from "@/components/ui/UsageDashboard";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  const [dashboardOpen, setDashboardOpen] = useState(false);

  return (
    <footer className={styles.footer} data-name="footer">
      <div className={styles.body}>
        <button
          type="button"
          className={styles.credit}
          onClick={() => setDashboardOpen(true)}
          aria-label="Site usage dashboard"
          data-name="usage-trigger"
        >
          Made for fun by Jason
        </button>
        <a className={styles.contact} href={contactMailto()}>
          <img src={withBasePath("/assets/icon-mail.svg")} alt="" width={20} height={21} />
          <span>Hit me up</span>
        </a>
      </div>
      {dashboardOpen ? (
        <UsageDashboard onClose={() => setDashboardOpen(false)} />
      ) : null}
    </footer>
  );
}
