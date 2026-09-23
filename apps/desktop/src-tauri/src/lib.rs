use tauri::{menu::{Menu, MenuItem}, tray::TrayIconBuilder, Emitter, Manager};
use tauri_plugin_sql::{Migration, MigrationKind};

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct InspectedPath {
    #[serde(rename = "type")]
    item_type: &'static str,
    title: String,
    source_path: String,
    byte_size: Option<u64>,
}

#[tauri::command]
fn inspect_path(path: String) -> Result<InspectedPath, String> {
    let source = std::path::Path::new(&path);
    let metadata = std::fs::metadata(source)
        .map_err(|error| format!("Cannot access the dropped item: {error}"))?;
    if !metadata.is_file() && !metadata.is_dir() {
        return Err("This item is not a regular file or folder.".into());
    }
    let title = source.file_name()
        .and_then(|name| name.to_str())
        .filter(|name| !name.is_empty())
        .unwrap_or(&path)
        .to_owned();
    let extension = source.extension().and_then(|value| value.to_str()).unwrap_or("");
    let item_type = if metadata.is_dir() {
        "folder"
    } else if ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"]
        .iter().any(|candidate| extension.eq_ignore_ascii_case(candidate)) {
        "image"
    } else {
        "file"
    };
    Ok(InspectedPath {
        item_type,
        title,
        source_path: path,
        byte_size: metadata.is_file().then_some(metadata.len()),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "initial_schema",
        sql: include_str!("../migrations/0001_initial.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![inspect_path])
        .plugin(tauri_plugin_single_instance::init(|app, _, _| show_shelf(app)))
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default().add_migrations("sqlite:poqit.db", migrations).build())
        .setup(|app| {
            let open = MenuItem::with_id(app, "open", "Open POQIT", true, None::<&str>)?;
            let capture = MenuItem::with_id(app, "capture", "Save current clipboard", true, None::<&str>)?;
            let pause = MenuItem::with_id(app, "pause", "Show/hide Edge Pocket", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &capture, &pause, &quit])?;
            TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().expect("application icon").clone())
                .tooltip("POQIT — Copy it. Keep it. Move on.")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => show_shelf(app),
                    "capture" => {
                        if let Err(error) = app.emit_to("main", "poqit:capture-clipboard", ()) {
                            log::error!("Could not request clipboard capture: {error}");
                        }
                    }
                    "pause" => {
                        if let Some(window) = app.get_webview_window("pocket") {
                            let result = match window.is_visible() {
                                Ok(true) => window.hide(),
                                Ok(false) => window.show(),
                                Err(error) => Err(error),
                            };
                            if let Err(error) = result { log::error!("Could not toggle Edge Pocket: {error}"); }
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" { api.prevent_close(); let _ = window.hide(); }
            }
        })
        .run(tauri::generate_context!())
        .expect("failed to run POQIT");
}

fn show_shelf(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if let Err(error) = window.show() { log::error!("Could not show POQIT: {error}"); }
        if let Err(error) = window.set_focus() { log::error!("Could not focus POQIT: {error}"); }
    }
}
