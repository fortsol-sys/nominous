pub mod commands;
pub mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_events,
            commands::save_event,
            commands::delete_event,
            commands::get_settings,
            commands::save_settings,
            commands::check_notifications,
            commands::export_json,
            commands::export_csv,
            commands::backup_data,
            commands::get_app_logs,
            commands::clear_app_logs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running nominous");
}
