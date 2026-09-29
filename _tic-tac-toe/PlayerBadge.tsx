"use client";

import { useEffect, useRef, useState } from "react";
import type { Mark } from "./logic";
import { MarkIcon } from "./Mark";
import styles from "./PlayerBadge.module.css";

type PlayerBadgeProps = {
  mark: Mark;
  name: string;
  active: boolean;
  editable?: boolean;
  onRename?: (name: string) => void;
};

export function PlayerBadge({ mark, name, active, editable = false, onRename }: PlayerBadgeProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  useEffect(() => {
    if (!editing) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [editing]);

  function commit() {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === name) {
      setDraft(name);
      return;
    }
    onRename?.(next);
  }

  return (
    <div
      className={`${styles.player} ${active ? styles.active : styles.inactive}`}
      data-name="player"
      data-active={active ? "true" : "false"}
    >
      <MarkIcon mark={mark} size="xsm" />
      {editable && editing ? (
        <input
          ref={inputRef}
          className={styles.nameInput}
          value={draft}
          maxLength={20}
          aria-label="Your name"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setDraft(name);
              setEditing(false);
            }
          }}
        />
      ) : editable ? (
        <button
          type="button"
          className={styles.nameButton}
          onClick={() => setEditing(true)}
          aria-label={`Edit name, currently ${name}`}
        >
          {name}
        </button>
      ) : (
        <span className={styles.name}>{name}</span>
      )}
    </div>
  );
}
