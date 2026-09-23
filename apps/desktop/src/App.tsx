import { useCallback, useEffect, useRef, useState } from "react";
import { ItemRow } from "./components/ItemRow";
import { repository } from "./lib/repository";
import { friendlyError, isTauri } from "./lib/runtime";
import { capturePaths } from "./lib/capture";
import type { ItemType, PoqitItem, ShelfScope } from "./types";

function inferType(name: string): ItemType {
  if (/^https?:\/\//i.test(name)) return "url";
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name)) return "image";
  return "file";
}

export default function App() {
  const [scope, setScope] = useState<ShelfScope>("recent");
  const [items, setItems] = useState<PoqitItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const lastCapturedClipboard = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    try { setItems(await repository.list(scope)); setError(null); }
    catch (reason) { setError(friendlyError(reason)); }
    finally { setBusy(false); }
  }, [scope]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => () => { void repository.close(); }, []);
  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;
    let unlistenDrop: (() => void) | undefined;
    let unlistenAdded: (() => void) | undefined;
    let unlistenCapture: (() => void) | undefined;
    void (async () => {
      const [{ getCurrentWebview }, { listen }] = await Promise.all([
        import("@tauri-apps/api/webview"), import("@tauri-apps/api/event")
      ]);
      const dropListener = await getCurrentWebview().onDragDropEvent(event => {
        if (event.payload.type === "enter" || event.payload.type === "over") setDragging(true);
        if (event.payload.type === "leave") setDragging(false);
        if (event.payload.type === "drop") {
          setDragging(false);
          void capturePaths(event.payload.paths).then(refresh).catch(reason => setError(friendlyError(reason)));
        }
      });
      if (disposed) { dropListener(); return; }
      unlistenDrop = dropListener;
      const addedListener = await listen("poqit:item-added", () => { void refresh(); });
      if (disposed) { addedListener(); return; }
      unlistenAdded = addedListener;
      const captureListener = await listen("poqit:capture-clipboard", () => {
        void (async () => {
          const { readText } = await import("@tauri-apps/plugin-clipboard-manager");
          const text = (await readText()).trim();
          if (!text) throw new Error("The clipboard has no text or link to save.");
          if (text.length > 1_000_000) throw new Error("Clipboard text is too large for POQIT.");
          if (text === lastCapturedClipboard.current) return;
          const isUrl = /^https?:\/\//i.test(text);
          await repository.add({
            type: isUrl ? "url" : "text",
            title: isUrl ? new URL(text).hostname : text.slice(0, 58),
            sourceUrl: isUrl ? text : null,
            textValue: isUrl ? null : text
          });
          lastCapturedClipboard.current = text;
          await refresh();
        })().catch(reason => setError(friendlyError(reason)));
      });
      if (disposed) { captureListener(); return; }
      unlistenCapture = captureListener;
    })().catch(reason => setError(friendlyError(reason)));
    return () => { disposed = true; unlistenDrop?.(); unlistenAdded?.(); unlistenCapture?.(); };
  }, [refresh]);

  async function addText(value?: string) {
    if (value === undefined) { setComposerOpen(true); return; }
    const text = value.trim();
    if (!text) return;
    const type: ItemType = /^https?:\/\//i.test(text) ? "url" : "text";
    await repository.add({ type, title: type === "url" ? new URL(text).hostname : text.slice(0, 58), sourceUrl: type === "url" ? text : null, textValue: type === "text" ? text : null });
    setDraft(""); setComposerOpen(false);
    await refresh();
  }

  async function chooseFiles() {
    try {
      if (!isTauri()) { await addText(); return; }
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ multiple: true, directory: false });
      await capturePaths(selected ?? []);
      await refresh();
    } catch (reason) { setError(friendlyError(reason)); }
  }

  async function drop(event: React.DragEvent) {
    event.preventDefault(); setDragging(false);
    try {
      const files = Array.from(event.dataTransfer.files);
      if (files.length && isTauri()) return;
      if (files.length) for (const file of files) await repository.add({ type: inferType(file.name), title: file.name, byteSize: file.size, mimeType: file.type || null });
      else { const text = event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain"); await addText(text); }
      await refresh();
    } catch (reason) { setError(friendlyError(reason)); }
  }

  return (
    <main className="shell">
      <header><img src="/assets/primarylogo.png" alt="POQIT" /><div><p>poqit</p><span>Copy it. Keep it. Move on.</span></div></header>
      <nav aria-label="Shelf scope">
        {(["general","recent"] as ShelfScope[]).map(value => <button key={value} className={scope === value ? "active" : ""} onClick={() => setScope(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}
      </nav>
      {error && <div className="error" role="alert"><span>{error}</span><button onClick={() => setError(null)}>Dismiss</button></div>}
      {composerOpen && <form className="composer" onSubmit={async event => { event.preventDefault(); try { await addText(draft); } catch (reason) { setError(friendlyError(reason)); } }}>
        <label htmlFor="poqit-content">Text or URL</label>
        <textarea id="poqit-content" autoFocus value={draft} onChange={event => setDraft(event.target.value)} placeholder="Paste something worth keeping…" />
        <div><button type="button" onClick={() => { setComposerOpen(false); setDraft(""); }}>Cancel</button><button className="primary" type="submit" disabled={!draft.trim()}>Keep it</button></div>
      </form>}
      <section className="items" aria-busy={busy}>
        {!busy && !items.length ? <div className="empty"><img src="/assets/poqit-empty-shelf.png" alt="Empty POQIT pocket" /><h1>Nothing here yet.</h1><p>Drop a file, link, image, or text and POQIT will hold it here.</p></div> : items.map(item => <ItemRow key={item.id} item={item} onError={setError} onRemove={async () => { await repository.remove(item.id); await refresh(); }} />)}
      </section>
      <section className={`drop-zone ${dragging ? "active" : ""}`} onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDragOver={event => event.preventDefault()} onDrop={drop}>
        <span>+</span><strong>{dragging ? "Drop to keep it" : "Drop anything here"}</strong>
        <button onClick={chooseFiles}>Choose file</button><button onClick={() => addText()}>Add text or link</button>
      </section>
    </main>
  );
}
