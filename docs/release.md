# Release

1. Install stable Rust, Node.js 20+, MSVC Build Tools, and WebView2.
2. Run `npm ci`, `npm run check`, and `npm run build`.
3. Build installers with `npm run tauri -- build`.
4. Sign the executable and installers with the organization code-signing certificate.
5. Verify install, upgrade, launch-at-login, and uninstall in a clean Windows 11 VM.

Updater signing must be configured before enabling an update endpoint. Never commit private keys or certificate passwords.
