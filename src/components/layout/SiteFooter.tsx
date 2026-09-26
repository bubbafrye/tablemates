import { contactMailto } from "@/platform/site";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer} data-name="footer">
      <div className={styles.body}>
        <p className={styles.credit}>Made for fun by Jason</p>
        <a className={styles.contact} href={contactMailto()}>
          <img src="/assets/icon-mail.svg" alt="" width={20} height={21} />
          <span>Hit me up</span>
        </a>
      </div>
    </footer>
  );
}
