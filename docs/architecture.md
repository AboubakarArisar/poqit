# Architecture

POQIT is split into a Tauri desktop application and a static public website. The desktop UI owns presentation; SQLite owns durable item metadata; Rust owns Windows integration and application lifecycle.

The frontend repository interface has a local-storage fallback used only by browser development. Native builds always use the SQLite plugin and registered migrations.

The Edge Pocket is a separate transparent Tauri window. Native system-wide drag observation is isolated in `src-tauri/src/windows.rs` so COM registration and teardown remain paired.
