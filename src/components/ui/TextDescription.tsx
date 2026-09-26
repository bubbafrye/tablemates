import styles from "./TextDescription.module.css";

type TextDescriptionProps = {
  children: string;
};

export function TextDescription({ children }: TextDescriptionProps) {
  return (
    <p className={styles.description} data-name="text-description">
      {children}
    </p>
  );
}
