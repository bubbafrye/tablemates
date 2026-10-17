import type { ReactNode } from "react";
import styles from "./MarkdownDoc.module.css";

type MarkdownDocProps = {
  markdown: string;
};

/** Minimal Markdown → React for our docs (headings, lists, tables, code, links). */
export function MarkdownDoc({ markdown }: MarkdownDocProps) {
  const blocks = splitBlocks(markdown);

  return (
    <article className={styles.doc} data-name="markdown-doc">
      {blocks.map((block, index) => renderBlock(block, index))}
    </article>
  );
}

function splitBlocks(markdown: string): string[] {
  return markdown
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
}

function renderBlock(block: string, key: number) {
  if (block.startsWith("```")) {
    const lines = block.split("\n");
    const body = lines.slice(1, lines[lines.length - 1] === "```" ? -1 : undefined).join("\n");
    return (
      <pre key={key} className={styles.code}>
        <code>{body}</code>
      </pre>
    );
  }

  if (block.startsWith("| ") || block.startsWith("|")) {
    return renderTable(block, key);
  }

  if (block.startsWith("# ")) {
    return (
      <h1 key={key} className={styles.h1}>
        {inline(block.slice(2))}
      </h1>
    );
  }
  if (block.startsWith("## ")) {
    return (
      <h2 key={key} className={styles.h2}>
        {inline(block.slice(3))}
      </h2>
    );
  }
  if (block.startsWith("### ")) {
    return (
      <h3 key={key} className={styles.h3}>
        {inline(block.slice(4))}
      </h3>
    );
  }

  if (block.split("\n").every((line) => /^[-*] /.test(line))) {
    return (
      <ul key={key} className={styles.list}>
        {block.split("\n").map((line, i) => (
          <li key={i}>{inline(line.replace(/^[-*] /, ""))}</li>
        ))}
      </ul>
    );
  }

  if (block.split("\n").every((line) => /^\d+\. /.test(line))) {
    return (
      <ol key={key} className={styles.list}>
        {block.split("\n").map((line, i) => (
          <li key={i}>{inline(line.replace(/^\d+\. /, ""))}</li>
        ))}
      </ol>
    );
  }

  return (
    <p key={key} className={styles.p}>
      {inline(block.replace(/\n/g, " "))}
    </p>
  );
}

function renderTable(block: string, key: number) {
  const rows = block
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim()),
    )
    .filter((cells) => !cells.every((c) => /^:?-+:?$/.test(c)));

  if (rows.length === 0) return null;
  const [head, ...body] = rows;

  return (
    <div key={key} className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {head.map((cell, i) => (
              <th key={i}>{inline(cell)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>{inline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={i++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={i++} className={styles.inlineCode}>
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const m = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) {
        nodes.push(
          <a key={i++} href={m[2]} target="_blank" rel="noopener noreferrer">
            {m[1]}
          </a>,
        );
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
