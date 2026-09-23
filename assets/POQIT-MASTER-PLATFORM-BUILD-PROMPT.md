# POQIT — Master Platform Build Prompt

You are a senior Windows desktop, systems, and full-stack engineer. Build **POQIT**, a polished, local-first Windows utility that lets users quickly keep files, images, links, and text in a temporary contextual pocket without interrupting their work.

The core interaction is:

> Copy it. Keep it. Move on.

This is a production implementation request, not a mockup. Build the working desktop application, Windows integration, persistence layer, installer, and a small public website. Use the supplied finished POQIT assets directly. Do not regenerate, reinterpret, or replace the brand artwork.

## 1. Product definition

POQIT is a lightweight Windows utility with two connected surfaces:

1. **Edge Pocket** — a small drop target that peeks from the selected screen edge when the user brings dragged content near it.
2. **Shelf** — a compact panel where saved items can be viewed, reopened, copied, dragged back out, removed, or revealed in File Explorer.

Supported content in V1:

- Files and folders.
- Images and screenshots.
- URLs.
- Plain and rich text copied by the user.

POQIT must never move or delete the original item when the user drops it. A drop means **add a reference to POQIT**. Display the Windows copy/add cursor affordance where possible.

V1 is local-only:

- No account.
- No cloud sync.
- No analytics SDK.
- No advertising.
- No remote upload.
- No browser extension unless implemented as a clearly isolated optional follow-up.

## 2. Required technology

Prefer a lightweight Windows-focused stack:

- **Tauri 2** desktop shell.
- **React + TypeScript** UI.
- **Rust** for native Windows integration and application services.
- **SQLite** for metadata and settings.
- A small local attachments/cache directory under the standard Windows application-data location.
- **Lottie** rendering for the supplied micro-animations.

If a required Windows shell behavior cannot be implemented reliably through Tauri alone, add a narrowly scoped Rust/Win32 implementation. Do not replace the desktop app with Electron merely for convenience.

Use current stable package versions and official APIs. Keep dependencies minimal and justify every non-trivial dependency in the project documentation.

## 3. Repository structure

Use one repository with clear bounded areas:

```text
poqit/
  apps/
    desktop/          # Tauri + React application
    website/          # lightweight public site
  crates/
    poqit-core/       # domain models and application logic
    poqit-windows/    # Win32/OLE/shell integration
    poqit-storage/    # SQLite and local cache
  assets/             # supplied POQIT production assets
  docs/
  scripts/
```

Do not create speculative packages, generic framework layers, or a plugin architecture. Add shared code only when at least two real consumers need it.

## 4. Supplied assets

Treat `assets/` as the source of truth. Use these files exactly:

### Existing brand assets

- `logo.png`
- `primarylogo.png`
- `App-icon.png`
- `tray.png`
- `drop-target.png`

### Interaction animations

- `poqit-hover.lottie.json`
- `poqit-item-enter.lottie.json`
- `poqit-item-received.lottie.json`
- Matching GIF and MP4 previews are references only; use Lottie in the desktop UI.

Lottie behavior:

- Play once with looping disabled.
- Hover: approximately 600 ms.
- Item Enter: approximately 700 ms.
- Item Received: approximately 700 ms.
- Respect reduced-motion preferences by replacing motion with a short opacity transition or static final frame.

### State and marketing artwork

- `poqit-drop-active.png`
- `poqit-empty-shelf.png`
- `poqit-broken-file.png`
- `poqit-loading-mark.png`
- `poqit-installer-artwork.png`
- `poqit-website-hero.png`

Do not bake new copy into these images. All UI and website text must remain accessible native text.

## 5. Visual system

Follow the supplied assets:

- Light interface.
- White and pale cool-gray surfaces.
- Vivid POQIT blue for primary actions and active states.
- Warm orange only for image-related or contextually relevant accents.
- Soft shadows and rounded geometry.
- Generous spacing and restrained borders.
- Windows-native behavior and familiar interaction patterns.

Avoid:

- Purple, pink, decorative gradients, dark SaaS styling, glassmorphism, or neon effects.
- Mascots, confetti, excessive bounce, and unnecessary illustrations.
- Turning every control into a pill.
- Large marketing visuals inside everyday utility screens.

Use Segoe UI Variable for application UI. Use the supplied wordmark artwork instead of recreating the POQIT lettering with a system font.

## 6. Edge Pocket behavior

Implement the drop target as a borderless, transparent, always-on-top window that does not steal focus.

States:

1. **Hidden** — no visible window during normal work.
2. **Peek** — a narrow portion appears at the configured screen edge while compatible content is being dragged nearby.
3. **Open** — expands smoothly as the cursor approaches.
4. **Receiving** — blue outline/plus feedback confirms that releasing will add the item.
5. **Received** — item-enter animation followed by the received/check animation.
6. **Dismiss** — closes after confirmation or when the drag leaves the activation area.

Requirements:

- Default edge: right side of the primary monitor.
- Configurable left or right edge.
- Handle multi-monitor coordinates and Windows display scaling correctly.
- Do not activate over full-screen applications unless the user enables that behavior.
- Do not steal keyboard focus.
- Do not block unrelated drag destinations outside the target bounds.
- Reject unsupported drag payloads with neutral feedback rather than silently failing.
- Avoid polling when native events can be used.
- Tear down drag/drop registrations, hooks, timers, and windows cleanly at shutdown.

Windows-wide drag detection is the highest-risk technical area. First build a small technical spike using supported OLE/Win32 drag/drop APIs. Document the chosen mechanism and its limitations before wiring the final UI. Do not use unsafe global mouse hooks as a shortcut unless they are narrowly scoped, justified, and correctly removed.

## 7. Shelf panel

The shelf is a compact utility window, approximately 360–420 px wide, that opens from:

- The tray icon.
- A configurable global shortcut.
- Clicking the expanded Edge Pocket when no drag is active.

Suggested structure:

```text
┌────────────────────────────────┐
│ poqit                    ···  × │
│ This Context                    │
│                                │
│ [type] Item title               │
│        source · saved 2m ago    │
│                                │
│ [type] Another item             │
│        source · saved 5m ago    │
│                                │
│ ────────────────────────────── │
│ + Drop anything here            │
└────────────────────────────────┘
```

Shelf requirements:

- Virtualized item list when needed.
- Keyboard navigation and visible focus states.
- Drag items back out to compatible Windows applications.
- Double-click or Enter opens an item using the Windows default handler.
- Copy action places text, URL, image, or path on the clipboard.
- Reveal file/folder in File Explorer.
- Remove from POQIT without deleting the original.
- Clear shelf requires confirmation and remains non-destructive to originals.
- Empty state uses `poqit-empty-shelf.png` with concise native text.
- Missing file state uses `poqit-broken-file.png` and offers Locate, Remove, and Reveal Parent when possible.
- Show a small type icon and metadata; do not use a large illustration for every row.

## 8. Context model

V1 must support:

- A **General** shelf available everywhere.
- Optional automatic context buckets based on the foreground application executable and top-level window identity.

Do not claim reliable per-browser-tab context without a browser extension. In the UI, label the contextual shelf **This Context**, not **This Tab**, unless a real browser integration is later present.

Store a stable context key derived from safe local metadata. Do not record window contents, keystrokes, or sensitive document text merely to identify a context.

Allow the user to switch between:

- This Context.
- General.
- Recent.

## 9. Clipboard behavior

Do not silently archive every clipboard change by default.

Provide two explicit capture paths:

1. A global **Save current clipboard to POQIT** shortcut.
2. An optional setting for clipboard watching that is disabled by default and clearly explained.

When clipboard watching is enabled:

- Ignore duplicate consecutive values.
- Impose sensible size limits.
- Never capture password-manager or protected clipboard content when Windows exposes exclusion metadata.
- Allow temporary pause from the tray menu.
- Dispose of clipboard listeners on shutdown.

## 10. Data model

Use a small explicit schema. At minimum:

```text
contexts
  id
  kind
  stable_key
  display_name
  created_at
  last_used_at

items
  id
  context_id nullable
  type              # file, folder, image, url, text
  title
  source_path nullable
  source_url nullable
  text_value nullable
  mime_type nullable
  byte_size nullable
  thumbnail_path nullable
  content_hash nullable
  created_at
  last_opened_at nullable
  is_missing

settings
  key
  value
```

Use migrations from the first version. Enforce foreign keys. Use transactions for multi-step writes. Close the SQLite pool and pending statements during application shutdown.

V1 stores file/folder references rather than copying originals into POQIT. Text and URLs are stored locally in SQLite. Thumbnails and derived previews go into the application cache and may be regenerated.

## 11. Duplicate and error handling

- Detect duplicate file references by normalized path and optional content metadata.
- Detect duplicate URLs after safe normalization without changing meaningful query parameters.
- If a source file is moved or deleted, mark it missing during access or lightweight background validation.
- Never run an aggressive full-disk watcher.
- Surface errors in plain language with a retry action where meaningful.
- No empty catch blocks.
- Log operational errors locally without recording clipboard contents, full text values, or secrets.

## 12. Tray integration

The tray icon is a primary control surface. Menu:

- Open POQIT.
- Save current clipboard.
- Pause/resume Edge Pocket.
- Pause/resume clipboard watcher when enabled.
- Settings.
- Start with Windows toggle.
- About.
- Quit.

Provide accessible tooltip text. Verify the icon at 16, 20, 24, 32, 48, and 64 px on both light and dark Windows taskbars. Use the supplied tray artwork as the visual source, but export actual production icon resources rather than shipping the presentation board itself.

## 13. Settings

Implement only settings needed for V1:

- Pocket edge: left/right.
- Preferred monitor: primary/follow active window/specific display.
- Global shortcut.
- Save-clipboard shortcut.
- Start with Windows.
- Show over full-screen apps.
- Clipboard watcher, disabled by default.
- Confirmation sound: Off/Subtle, default Off.
- Reduced motion: follow system/on/off.
- Local data location and Clear POQIT Data.

Validate shortcut conflicts and show actionable errors.

## 14. Accessibility

- Full keyboard operation.
- Screen-reader labels for every icon-only action.
- Logical focus order.
- High-contrast-compatible focus outlines.
- Minimum practical hit targets for pointer input.
- Do not communicate state through color alone.
- Honor Windows reduced-motion and text-scaling settings.
- Maintain readable contrast on white surfaces.

## 15. Security and privacy

- Local-only by default.
- Never execute dropped files.
- Open content only after direct user action.
- Treat file names, URLs, and clipboard contents as untrusted data.
- Escape rendered text and never inject it as HTML.
- Validate custom URL schemes before launching.
- Do not add broad CORS rules, disabled certificate checks, bypassed authentication, or unsigned update shortcuts.
- Avoid administrator privileges. Install per-user unless a system-wide install is explicitly selected.
- Do not persist secrets in logs or configuration files.

## 16. Resource lifecycle

All native and asynchronous resources require explicit teardown:

- OLE/Win32 drag/drop registrations.
- Global shortcuts and hooks.
- Clipboard listeners.
- Tray icon and menu handlers.
- File watchers.
- Database connections and prepared statements.
- Window event listeners.
- Timers, intervals, animation callbacks, and background tasks.

Centralize shutdown coordination and make it idempotent.

## 17. Installer and updates

Create a signed-build-ready Windows installer configuration:

- Per-user install by default.
- Start menu shortcut.
- Optional launch at startup.
- Clean uninstall that leaves user data only when explicitly chosen.
- Use `poqit-installer-artwork.png` in the installer where supported.
- Produce `.msi` or the most reliable Tauri-supported Windows installer format.

Prepare updater support but do not enable an insecure or unsigned update channel. Document code-signing and update-signing steps using placeholders for certificates and private keys; never commit secrets.

## 18. Public website

Build a small responsive marketing site using the same repository.

Sections:

1. Hero with `poqit-website-hero.png` and native copy.
2. Three-step explanation: Copy or drag, Keep in context, Return when needed.
3. Short feature section: Files, images, links, and text.
4. Privacy statement: local-first, no account required.
5. Windows download call-to-action.
6. FAQ.

Suggested hero copy:

```text
Keep what matters right where you need it.

Drop files, links, images, and text into POQIT—then get back to what you were doing.
```

The site must be fast, accessible, and static-deployable. Do not add authentication, a database, a CMS, or tracking merely for the marketing site.

## 19. Implementation phases

Work in this order:

### Phase 1 — Foundation

- Repository and tooling.
- Domain models.
- SQLite storage and migrations.
- Basic Shelf window with real persisted items.
- Tray icon and application lifecycle.

### Phase 2 — Content workflows

- File/folder drop into Shelf.
- Text, URL, and image capture.
- Open, copy, reveal, drag-out, remove, and missing-item states.
- Global shortcuts.

### Phase 3 — Edge Pocket

- Windows drag-detection technical spike.
- Hidden/peek/open/receiving/received state machine.
- Multi-monitor and DPI handling.
- Lottie integration and reduced-motion fallback.

### Phase 4 — Productization

- Settings.
- Accessibility pass.
- Installer.
- Startup behavior.
- Local diagnostics.
- Marketing website.

Do not start the website before the desktop interaction is functional.

## 20. Testing

Add proportionate automated and manual coverage.

Unit tests:

- Path and URL normalization.
- Duplicate detection.
- Context key creation.
- Item state transitions.
- Database migrations.

Integration tests:

- Add, retrieve, update, and remove each item type.
- Missing-file detection.
- Clipboard capture with duplicates and limits.
- Settings persistence.
- Idempotent shutdown.

Manual Windows acceptance matrix:

- Windows 11 at 100%, 125%, 150%, and 200% scaling.
- Single and multiple monitors with mixed DPI.
- Left and right edge placement.
- Light and dark taskbars.
- Keyboard-only and screen-reader navigation.
- Drag from File Explorer, browsers, desktop, and common editors.
- Full-screen application behavior.
- Sleep/resume, explorer restart, and application restart.
- Install, upgrade, and uninstall.

Do not run global or heavy test suites after trivial edits. Run targeted checks during development and the complete verification suite at feature completion.

## 21. Definition of done

The product is complete when:

- A user can install and launch POQIT without administrator privileges.
- The tray icon works and exits cleanly.
- The Shelf persists files, folders, images, URLs, and text locally.
- Users can open, copy, reveal, drag out, and remove saved items.
- Missing original files show a recoverable broken-file state.
- The Edge Pocket appears without stealing focus and receives compatible drag payloads.
- The three supplied animations play at the correct moments and reduced motion is respected.
- Multi-monitor and DPI behavior is verified.
- No background listener, hook, timer, window, or database connection leaks after exit.
- The installer and public website are buildable from documented commands.
- The repository contains setup, architecture, privacy, troubleshooting, signing, and release documentation.

## 22. Delivery format

Deliver:

- Complete source code.
- Database migrations.
- Production asset wiring.
- Targeted automated tests.
- Windows installer configuration.
- Public website.
- `README.md` with setup and build commands.
- `docs/architecture.md`.
- `docs/privacy.md`.
- `docs/windows-integration.md` documenting the Edge Pocket mechanism and teardown.
- `docs/release.md` covering signing and packaging.

Before implementation, summarize the planned architecture and call out the Windows drag-detection approach as the main technical risk. Then implement phase by phase, keeping the application runnable at the end of each phase. Do not replace working supplied assets, introduce unrelated features, or broaden the scope without explicit approval.
