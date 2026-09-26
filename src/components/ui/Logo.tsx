import styles from "./Logo.module.css";

type LogoProps = {
  size?: number;
};

export function Logo({ size = 20 }: LogoProps) {
  return (
    <span className={styles.logo} style={{ width: size, height: size }} data-name="logo">
      <span className={styles.row}>
        <span className={styles.dark} />
        <span className={styles.primary} />
      </span>
      <span className={styles.row}>
        <span className={styles.primary} />
        <span className={styles.dark} />
      </span>
    </span>
  );
}
