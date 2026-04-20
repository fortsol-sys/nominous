import type { NomEvent, Settings } from "./types";

const isTauri = () =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

const DEFAULT_SETTINGS: Settings = {
  categories: [
    { name: "Work", color: "#4f8ef7" },
    { name: "Personal", color: "#a78bfa" },
    { name: "Health", color: "#34d399" },
    { name: "Finance", color: "#fbbf24" },
  ],
  priorities: [
    { name: "Low", color: "#6b7280", order: 0 },
    { name: "Medium", color: "#fbbf24", order: 1 },
    { name: "High", color: "#f87171", order: 2 },
  ],
  default_notifications: [],
};

const LS = {
  events: "nominous-events",
  settings: "nominous-settings",
  logs: "nominous-logs",
};

// ── Events ──────────────────────────────────────────────────────────────────

export async function getEvents(): Promise<NomEvent[]> {
  if (isTauri()) return tauriInvoke<NomEvent[]>("get_events");
  const raw = localStorage.getItem(LS.events);
  return raw ? JSON.parse(raw) : [];
}

export async function saveEvent(event: NomEvent): Promise<void> {
  if (isTauri()) return tauriInvoke("save_event", { event });
  const events: NomEvent[] = await getEvents();
  const idx = events.findIndex((e) => e.id === event.id);
  if (idx >= 0) events[idx] = event;
  else events.push(event);
  localStorage.setItem(LS.events, JSON.stringify(events));
}

export async function deleteEvent(id: string): Promise<void> {
  if (isTauri()) return tauriInvoke("delete_event", { id });
  const events: NomEvent[] = await getEvents();
  localStorage.setItem(LS.events, JSON.stringify(events.filter((e) => e.id !== id)));
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  if (isTauri()) return tauriInvoke<Settings>("get_settings");
  const raw = localStorage.getItem(LS.settings);
  return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (isTauri()) return tauriInvoke("save_settings", { settings });
  localStorage.setItem(LS.settings, JSON.stringify(settings));
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function checkNotifications(): Promise<void> {
  if (isTauri()) return tauriInvoke("check_notifications");
  // no-op in web context
}

// ── Logs ──────────────────────────────────────────────────────────────────────

export async function getAppLogs(): Promise<string[]> {
  if (isTauri()) return tauriInvoke<string[]>("get_app_logs");
  const raw = localStorage.getItem(LS.logs);
  return raw ? JSON.parse(raw) : [];
}

export async function clearAppLogs(): Promise<void> {
  if (isTauri()) return tauriInvoke("clear_app_logs");
  localStorage.removeItem(LS.logs);
}

// ── Export / Backup ───────────────────────────────────────────────────────────

export async function exportData(format: "json" | "csv"): Promise<string> {
  if (isTauri()) {
    return tauriInvoke<string>(format === "json" ? "export_json" : "export_csv");
  }
  const events: NomEvent[] = await getEvents();
  if (format === "json") {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, "nominous-export.json");
    return "nominous-export.json";
  } else {
    const header = "id,name,target_date,category,priority,created_at\n";
    const rows = events
      .map((e) =>
        [e.id, e.name, e.target_date, e.category, e.priority, e.created_at]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, "nominous-export.csv");
    return "nominous-export.csv";
  }
}

export async function backupData(dest: string, settings: Settings): Promise<string> {
  if (isTauri()) return tauriInvoke<string>("backup_data", { dest, settings });
  await exportData("json");
  return new Date().toISOString();
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
