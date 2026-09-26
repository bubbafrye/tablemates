"use client";

import { FormEvent, useState } from "react";
import { Button } from "./Button";
import styles from "./JoinField.module.css";

type JoinFieldProps = {
  variant?: "join" | "register";
  onSubmit: (value: string) => void;
  disabled?: boolean;
};

export function JoinField({ variant = "join", onSubmit, disabled }: JoinFieldProps) {
  const [value, setValue] = useState("");
  const isJoin = variant === "join";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = value.trim();
    if (!next || disabled) return;
    onSubmit(next);
  }

  return (
    <form className={styles.field} data-name="input" onSubmit={handleSubmit}>
      <input
        className={styles.input}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={isJoin ? "Enter room code..." : "you@yourface.com"}
        aria-label={isJoin ? "Enter room code" : "Email"}
        type={isJoin ? "text" : "email"}
        autoCapitalize={isJoin ? "characters" : "off"}
        autoComplete={isJoin ? "off" : "email"}
        disabled={disabled}
      />
      <div className={styles.buttons} data-name="buttons">
        {isJoin ? (
          <Button variant="plain" type="submit" disabled={disabled}>
            Join
          </Button>
        ) : (
          <Button variant="secondary" type="submit" disabled={disabled}>
            Register
          </Button>
        )}
      </div>
    </form>
  );
}
