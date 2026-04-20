import { invoke } from "@tauri-apps/api/core";
import type { NomEvent, Settings } from "../types";

class AppStore {
  events = $state<NomEvent[]>([]);
  selectedEvent = $state<NomEvent | null>(null);
  settings = $state<Settings | null>(null);
  showAddModal = $state(false);
  showCommentModal = $state(false);
  showSettings = $state(false);
  editingEvent = $state<NomEvent | null>(null);
  error = $state<string | null>(null);

  async loadEvents() {
    try {
      this.events = await invoke<NomEvent[]>("get_events");
      if (this.selectedEvent) {
        this.selectedEvent =
          this.events.find((e) => e.id === this.selectedEvent!.id) ?? null;
      }
    } catch (e) {
      this.error = String(e);
    }
  }

  async loadSettings() {
    try {
      this.settings = await invoke<Settings>("get_settings");
    } catch (e) {
      this.error = String(e);
    }
  }

  async saveEvent(event: NomEvent) {
    try {
      await invoke("save_event", { event });
      await this.loadEvents();
    } catch (e) {
      this.error = String(e);
    }
  }

  async deleteEvent(id: string) {
    try {
      await invoke("delete_event", { id });
      if (this.selectedEvent?.id === id) this.selectedEvent = null;
      await this.loadEvents();
    } catch (e) {
      this.error = String(e);
    }
  }

  async saveSettings(s: Settings) {
    try {
      await invoke("save_settings", { settings: s });
      this.settings = s;
    } catch (e) {
      this.error = String(e);
    }
  }

  async checkNotifications() {
    try {
      await invoke("check_notifications");
    } catch (_) {}
  }

  selectEvent(event: NomEvent) {
    this.selectedEvent = event;
  }

  openAdd(event?: NomEvent) {
    this.editingEvent = event ?? null;
    this.showAddModal = true;
  }

  closeAdd() {
    this.showAddModal = false;
    this.editingEvent = null;
  }

  clearError() {
    this.error = null;
  }

  categoryColor(name: string): string {
    return this.settings?.categories.find((c) => c.name === name)?.color ?? "#6366f1";
  }

  priorityColor(name: string): string {
    return this.settings?.priorities.find((p) => p.name === name)?.color ?? "#6b7280";
  }
}

export const app = new AppStore();
