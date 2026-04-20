use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

use crate::models::*;

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_data_dir().map_err(|e| e.to_string())?.join("events"))
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_data_dir().map_err(|e| e.to_string())?.join("settings.json"))
}

fn notifications_sent_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_data_dir().map_err(|e| e.to_string())?.join("notifications_sent.json"))
}

fn app_log_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_data_dir().map_err(|e| e.to_string())?.join("nominous.log"))
}

fn log_app(app: &AppHandle, level: &str, msg: &str) {
    if let Ok(path) = app_log_path(app) {
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let entry = format!(
            "[{}] [{}] {}\n",
            chrono::Local::now().format("%Y-%m-%dT%H:%M:%S"),
            level,
            msg
        );
        use std::io::Write;
        if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(&path) {
            let _ = f.write_all(entry.as_bytes());
        }
    }
}

fn parse_event(content: &str) -> Option<Event> {
    let trimmed = content.trim();
    if !trimmed.starts_with("---") {
        return None;
    }
    let rest = &trimmed[3..];
    let end = rest.find("\n---")?;
    let yaml = &rest[..end];
    serde_yaml::from_str(yaml).ok()
}

fn write_event(app: &AppHandle, event: &Event) -> Result<(), String> {
    let dir = data_dir(app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let yaml = serde_yaml::to_string(event).map_err(|e| e.to_string())?;

    let mut body = format!("# {}\n\n", event.name);
    body.push_str(&format!("**Target:** {}  \n", event.target_date));
    body.push_str(&format!(
        "**Category:** {} | **Priority:** {}\n",
        event.category, event.priority
    ));

    if !event.stages.is_empty() {
        body.push_str("\n## Stages\n\n");
        for s in &event.stages {
            let check = if s.completed { "x" } else { " " };
            let date = s.date.as_deref().map(|d| format!(" ({})", d)).unwrap_or_default();
            body.push_str(&format!("- [{}] {}{}\n", check, s.title, date));
        }
    }

    if !event.log.is_empty() {
        body.push_str("\n## Log\n\n");
        for entry in &event.log {
            body.push_str(&format!("- {} — {}\n", entry.timestamp, entry.content));
        }
    }

    let content = format!("---\n{}---\n\n{}", yaml, body);
    fs::write(dir.join(format!("{}.md", event.id)), content).map_err(|e| e.to_string())
}

fn load_events(dir: &PathBuf) -> Result<Vec<Event>, String> {
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut events = vec![];
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.path().extension().and_then(|e| e.to_str()) == Some("md") {
            if let Ok(content) = fs::read_to_string(entry.path()) {
                if let Some(ev) = parse_event(&content) {
                    events.push(ev);
                }
            }
        }
    }
    events.sort_by(|a, b| a.target_date.cmp(&b.target_date));
    Ok(events)
}

fn parse_date(s: &str) -> Option<chrono::DateTime<chrono::Local>> {
    use chrono::TimeZone;
    chrono::DateTime::parse_from_rfc3339(s)
        .map(|dt| dt.with_timezone(&chrono::Local))
        .or_else(|_| {
            chrono::NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S").map(|dt| {
                chrono::Local
                    .from_local_datetime(&dt)
                    .single()
                    .unwrap_or_else(|| chrono::Local::now())
            })
        })
        .ok()
}

pub fn default_settings() -> Settings {
    Settings {
        categories: vec![
            Category { name: "Work".into(), color: "#6366f1".into() },
            Category { name: "Personal".into(), color: "#10b981".into() },
            Category { name: "Health".into(), color: "#f59e0b".into() },
            Category { name: "Finance".into(), color: "#3b82f6".into() },
        ],
        priorities: vec![
            Priority { name: "Critical".into(), color: "#ef4444".into(), order: 0 },
            Priority { name: "High".into(), color: "#f97316".into(), order: 1 },
            Priority { name: "Medium".into(), color: "#eab308".into(), order: 2 },
            Priority { name: "Low".into(), color: "#6b7280".into(), order: 3 },
        ],
        default_notifications: vec![
            NotificationRule { trigger: "7d".into(), enabled: true },
            NotificationRule { trigger: "1d".into(), enabled: true },
        ],
    }
}

#[tauri::command]
pub fn get_events(app: AppHandle) -> Result<Vec<Event>, String> {
    let events = load_events(&data_dir(&app)?)?;
    log_app(&app, "INFO", &format!("Loaded {} event(s)", events.len()));
    Ok(events)
}

#[tauri::command]
pub fn save_event(app: AppHandle, event: Event) -> Result<(), String> {
    log_app(&app, "INFO", &format!("Saving event '{}'", event.name));
    write_event(&app, &event)
}

#[tauri::command]
pub fn delete_event(app: AppHandle, id: String) -> Result<(), String> {
    let path = data_dir(&app)?.join(format!("{}.md", id));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    log_app(&app, "INFO", &format!("Deleted event: {}", id));
    Ok(())
}

#[tauri::command]
pub fn get_app_logs(app: AppHandle) -> Result<Vec<String>, String> {
    let path = app_log_path(&app)?;
    if !path.exists() {
        return Ok(vec![]);
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let lines: Vec<String> = content.lines().rev().take(500).map(String::from).collect();
    Ok(lines)
}

#[tauri::command]
pub fn clear_app_logs(app: AppHandle) -> Result<(), String> {
    let path = app_log_path(&app)?;
    if path.exists() {
        fs::write(path, "").map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_settings(app: AppHandle) -> Result<Settings, String> {
    let path = settings_path(&app)?;
    if !path.exists() {
        return Ok(default_settings());
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    let path = settings_path(&app)?;
    fs::create_dir_all(path.parent().unwrap()).map_err(|e| e.to_string())?;
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;
    log_app(&app, "INFO", "Settings saved");
    Ok(())
}

#[tauri::command]
pub fn check_notifications(app: AppHandle) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;

    let events = load_events(&data_dir(&app)?)?;
    let sent_path = notifications_sent_path(&app)?;

    let mut sent: HashMap<String, String> = if sent_path.exists() {
        serde_json::from_str(&fs::read_to_string(&sent_path).unwrap_or_default())
            .unwrap_or_default()
    } else {
        HashMap::new()
    };

    let now = chrono::Local::now();
    let today = now.format("%Y-%m-%d").to_string();

    for event in &events {
        let Some(target) = parse_date(&event.target_date) else {
            continue;
        };
        let days_until = (target - now).num_days();

        for rule in &event.notifications {
            if !rule.enabled {
                continue;
            }
            let threshold = match rule.trigger.as_str() {
                "7d" => Some(7),
                "3d" => Some(3),
                "1d" => Some(1),
                "12h" | "1h" => Some(0),
                _ => None,
            };
            if let Some(t) = threshold {
                if days_until <= t && days_until >= 0 {
                    let key = format!("{}_{}", event.id, rule.trigger);
                    if sent.get(&key).map(|s| s.as_str()) != Some(today.as_str()) {
                        let _ = app
                            .notification()
                            .builder()
                            .title("Nominous")
                            .body(&format!("{} — {} day(s) remaining", event.name, days_until))
                            .show();
                        log_app(&app, "INFO", &format!("Notification sent: '{}' trigger={}", event.name, rule.trigger));
                        sent.insert(key, today.clone());
                    }
                }
            }
        }

        let has_stage_rule = event.notifications.iter().any(|r| r.trigger == "stage" && r.enabled);
        if has_stage_rule {
            for stage in &event.stages {
                if stage.completed {
                    continue;
                }
                if let Some(date) = &stage.date {
                    if date.starts_with(&today) {
                        let key = format!("{}_stage_{}", event.id, stage.id);
                        if sent.get(&key).map(|s| s.as_str()) != Some(today.as_str()) {
                            let _ = app
                                .notification()
                                .builder()
                                .title("Nominous — Stage Due")
                                .body(&format!("{}: {} is due today", event.name, stage.title))
                                .show();
                            sent.insert(key, today.clone());
                        }
                    }
                }
            }
        }
    }

    if let Ok(content) = serde_json::to_string(&sent) {
        let _ = fs::write(sent_path, content);
    }

    Ok(())
}
