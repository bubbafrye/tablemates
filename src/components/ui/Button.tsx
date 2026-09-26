import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "plain";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  icon = true,
  children,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(" ");

  return (
    <button className={classes} type={type} data-name={`Button-${variant}`} {...props}>
      <span>{children}</span>
      {icon ? (
        variant === "plain" ? (
          <>
            <img
              src="/assets/icon-launch-dark.svg"
              alt=""
              width={12}
              height={12}
              className={`${styles.icon} ${styles.iconDefault}`}
            />
            <img
              src="/assets/icon-launch-muted.svg"
              alt=""
              width={12}
              height={12}
              className={`${styles.icon} ${styles.iconHover}`}
            />
          </>
        ) : (
          <img
            src="/assets/icon-launch.svg"
            alt=""
            width={12}
            height={12}
            className={styles.icon}
          />
        )
      ) : null}
    </button>
  );
}
