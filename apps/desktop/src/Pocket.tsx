import { useEffect, useRef, useState } from "react";
import { Lottie } from "./components/Lottie";
import { capturePaths } from "./lib/capture";
import { repository } from "./lib/repository";
import { friendlyError, isTauri } from "./lib/runtime";

export function Pocket() {
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [motion, setMotion] = useState<"hover" | "enter" | "received">("hover");
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const positionWindow = useRef<(expanded: boolean) => Promise<void>>(async () => {});

  useEffect(() => () => { timers.current.forEach(clearTimeout); void repository.close(); }, []);
  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;
    let unlisten: (() => void) | undefined;
    void (async () => {
      const [{ getCurrentWebview }, { getCurrentWindow, primaryMonitor, PhysicalPosition, PhysicalSize }] = await Promise.all([
        import("@tauri-apps/api/webview"), import("@tauri-apps/api/window")
      ]);
      const window = getCurrentWindow();
      positionWindow.current = async expanded => {
        const monitor = await primaryMonitor();
        if (!monitor) throw new Error("No display is available for the POQIT pocket.");
        const width = Math.round((expanded ? 196 : 24) * monitor.scaleFactor);
        const height = Math.round(196 * monitor.scaleFactor);
        const x = monitor.position.x + monitor.size.width - width;
        const y = monitor.position.y + Math.round((monitor.size.height - height) / 2);
        await window.setSize(new PhysicalSize(width, height));
        await window.setPosition(new PhysicalPosition(x, y));
        await window.show();
      };
      await positionWindow.current(false);
      const dropListener = await getCurrentWebview().onDragDropEvent(event => {
        if (event.payload.type === "enter" || event.payload.type === "over") {
          setActive(true);
          void positionWindow.current(true).catch(reason => setError(friendlyError(reason)));
        } else if (event.payload.type === "leave") {
          setActive(false);
          void positionWindow.current(false).catch(reason => setError(friendlyError(reason)));
        } else if (event.payload.type === "drop") {
          setActive(false);
          void receive(capturePaths(event.payload.paths));
        }
      });
      if (disposed) dropListener(); else unlisten = dropListener;
    })().catch(reason => setError(friendlyError(reason)));
    return () => { disposed = true; unlisten?.(); };
  }, []);

  async function receive(operation: Promise<unknown>) {
    try {
      await operation;
      setError(null);
      setMotion("enter");
      if (isTauri()) {
        const { emitTo } = await import("@tauri-apps/api/event");
        await emitTo("main", "poqit:item-added");
      }
      timers.current.forEach(clearTimeout);
      timers.current = [
        setTimeout(() => setMotion("received"), 700),
        setTimeout(() => { setMotion("hover"); void positionWindow.current(false); }, 1400)
      ];
    } catch (reason) { setError(friendlyError(reason)); setMotion("hover"); void positionWindow.current(false); }
  }

  async function dropText(event: React.DragEvent) {
    event.preventDefault();
    if (isTauri() && event.dataTransfer.files.length) return;
    const value = (event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain")).trim();
    if (!value) { setError("This item cannot be added to POQIT."); return; }
    try {
      const isUrl = /^https?:\/\//i.test(value);
      await receive(repository.add({
        type: isUrl ? "url" : "text",
        title: isUrl ? new URL(value).hostname : value.slice(0, 58),
        sourceUrl: isUrl ? value : null,
        textValue: isUrl ? null : value
      }));
    } catch (reason) { setError(friendlyError(reason)); }
  }

  async function openShelf() {
    if (!isTauri() || active) return;
    try {
      const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
      const main = await WebviewWindow.getByLabel("main");
      if (!main) throw new Error("The POQIT shelf is unavailable.");
      await main.show();
      await main.setFocus();
    } catch (reason) { setError(friendlyError(reason)); }
  }

  return <main className={`pocket-window ${active ? "active" : ""}`} onClick={() => { void openShelf(); }} onMouseEnter={() => { setHovered(true); void positionWindow.current(true).catch(reason => setError(friendlyError(reason))); }} onMouseLeave={() => { setHovered(false); if (motion === "hover" && !active) void positionWindow.current(false).catch(reason => setError(friendlyError(reason))); }} onDragOver={event => { event.preventDefault(); setActive(true); }} onDragLeave={() => setActive(false)} onDrop={event => { void dropText(event); }}>
    {error ? <span role="alert" className="pocket-error">{error}</span> : motion === "enter" ? <Lottie path="/assets/poqit-item-enter.lottie.json" label="Adding item" /> : motion === "received" ? <Lottie path="/assets/poqit-item-received.lottie.json" label="Item received" /> : active ? <img src="/assets/poqit-drop-active.png" alt="Release to add to POQIT" /> : hovered ? <Lottie path="/assets/poqit-hover.lottie.json" label="POQIT pocket" /> : <span className="edge-handle" role="img" aria-label="POQIT drop target" />}
  </main>;
}
