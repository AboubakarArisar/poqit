# POQIT

POQIT is a local-first Windows pocket for files, folders, images, links, and text.

## Prerequisites

- Node.js 20+
- Rust stable with the MSVC target
- Microsoft C++ Build Tools and WebView2 (normally present on Windows 11)

Install Rust from <https://rustup.rs>, then restart the terminal.

## Development

```powershell
npm install
npm run dev
```

The browser development mode uses local storage so the Shelf can be exercised without the native shell. To run the native app:

```powershell
npm run tauri -- dev
```

Run the public website separately:

```powershell
npm run dev:website
```

## Verification

```powershell
npm run check
npm run build
```

The native Edge Pocket is a 24 px screen-edge target that opens when a file is dragged over it. See [Windows integration](docs/windows-integration.md) for current limits.

## Microsoft Store release

POQIT uses an MSIX package for Microsoft Store distribution. The Store signs an approved MSIX; an unsigned package from this project is **not** a public installer. The package script contains the Store identity assigned to the reserved `poqit` product (`9NHXV7XWVK37`): `pindaricoders.poqit`, `CN=B5494106-381D-4BA7-9AD2-55A096587C06`, and `pindaricoders`. Identity verification and Store certification are controlled by Microsoft.

On a trusted Windows build machine with Rust, Node.js, Visual Studio C++ Build Tools, and the Windows SDK installed:

```powershell
.\scripts\package-store.ps1
```

This builds `outputs/POQIT_0.1.0.0_x64.msix` for Store submission. Do not install or publish that unsigned file directly; submit it to Partner Center for certification and Microsoft signing. After the Store listing is live, set `VITE_POQIT_STORE_URL` to its `https://apps.microsoft.com/...` URL when building the website. Until then, the website deliberately shows no download button.

If the local Windows build is blocked by Code Integrity, push this project to a private GitHub repository and run the manual **Store MSIX** workflow in the repository's Actions tab. Download the `poqit-store-msix` artifact from the completed run and upload the contained `.msix` to the **Packages** section of the draft Partner Center submission. The workflow only builds and uploads a submission artifact; it does not sign, install, certify, or publish the app. Review the package and complete the other required submission sections before submitting for certification.

This machine currently blocks unsigned Rust build-script executables under Smart App Control, so the native binary and MSIX have **not** been built or tested here. Do not disable Smart App Control to build POQIT.
