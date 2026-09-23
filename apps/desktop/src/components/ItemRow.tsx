import type { PoqitItem } from "../types";
import { isTauri } from "../lib/runtime";

const labels = { file: "FILE", folder: "DIR", image: "IMG", url: "LINK", text: "TXT" } as const;

function relativeTime(date: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - Date.parse(date)) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ItemRow({ item, onRemove, onError }: { item: PoqitItem; onRemove: () => void; onError: (message: string) => void }) {
  async function open() {
    try {
      if (!isTauri()) return;
      const { openPath, openUrl } = await import("@tauri-apps/plugin-opener");
      if (item.sourcePath) await openPath(item.sourcePath);
      else if (item.sourceUrl) await openUrl(item.sourceUrl);
    } catch (error) { onError(String(error)); }
  }

  async function copy() {
    try {
      const value = item.textValue ?? item.sourceUrl ?? item.sourcePath ?? item.title;
      if (isTauri()) {
        const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
        await writeText(value);
      } else await navigator.clipboard.writeText(value);
    } catch (error) { onError(String(error)); }
  }

  return (
    <article className={`item-row ${item.isMissing ? "missing" : ""}`} tabIndex={0} onDoubleClick={open} onKeyDown={event => { if (event.key === "Enter") void open(); }}>
      <span className={`type-badge ${item.type}`}>{labels[item.type]}</span>
      <span className="item-copy"><strong>{item.title}</strong><small>{item.isMissing ? "Original not found" : `${item.type} · ${relativeTime(item.createdAt)}`}</small></span>
      <span className="row-actions">
        <button onClick={copy} aria-label={`Copy ${item.title}`}>Copy</button>
        {(item.sourcePath || item.sourceUrl) && <button onClick={open} aria-label={`Open ${item.title}`}>Open</button>}
        <button className="danger" onClick={onRemove} aria-label={`Remove ${item.title} from POQIT`}>×</button>
      </span>
    </article>
  );
}
