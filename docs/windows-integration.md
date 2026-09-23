# Windows integration

## Edge Pocket risk

Receiving a drop over the visible 24 px POQIT edge strip is supported by Tauri. The strip expands when the drag enters its window, and file paths are captured through Tauri's native drag/drop event. It currently uses the primary monitor only. It does not detect a drag anywhere on the desktop, follow a secondary monitor, or provide drag-out. Those behaviors still need design, implementation, and native testing before being advertised.

The current implementation is in `apps/desktop/src/Pocket.tsx` and `apps/desktop/src-tauri/src/lib.rs`. A future system-wide edge integration would need a separate native spike:

1. Create the transparent edge HWND without activation.
2. Register the HWND as an OLE drop target.
3. Keep a narrow activation strip available during drag operations.
4. Transition the frontend state machine through Peek, Open, Receiving, Received, and Dismiss.
5. Call `RevokeDragDrop` and release COM resources during idempotent shutdown.

Do not add process-wide mouse hooks outside this module. Mixed-DPI monitor coordinates must be tested before enabling follow-active-monitor behavior.
