import { writable } from "svelte/store";
import type { NomEvent, Settings } from "../types";
import {
  getEvents,
  saveEvent as storeSaveEvent,
  deleteEvent as storeDeleteEvent,
  getSettings,
  saveSettings as storeSaveSettings,
  checkNotifications as storeCheckNotifications,
} from "../storage";

export type Theme = "dark" | "light";

interface AppState {
  events: NomEvent[];
  selectedEvent: NomEvent | null;
  settings: Settings | null;
  showAddModal: boolean;
  showCommentModal: boolean;
  showSettings: boolean;
  showLogs: boolean;
  editingEvent: NomEvent | null;
  error: string | null;
  success: string | null;
  theme: Theme;
}

function createApp() {
  const { subscribe, update } = writable<AppState>({
    events: [],
    selectedEvent: null,
    settings: null,
    showAddModal: false,
    showCommentModal: false,
    showSettings: false,
    showLogs: false,
    editingEvent: null,
    error: null,
    success: null,
    theme: "dark",
  });

  return {
    subscribe,

    async loadEvents() {
      try {
        const events = await getEvents();
        update((s) => ({
          ...s,
          events,
          selectedEvent: s.selectedEvent
            ? (events.find((e) => e.id === s.selectedEvent!.id) ?? null)
            : null,
        }));
      } catch (e) {
        update((s) => ({ ...s, error: String(e) }));
      }
    },

    async loadSettings() {
      try {
        const settings = await getSettings();
        update((s) => ({ ...s, settings }));
      } catch (e) {
        update((s) => ({ ...s, error: String(e) }));
      }
    },

    async saveEvent(event: NomEvent) {
      try {
        await storeSaveEvent(event);
        await this.loadEvents();
      } catch (e) {
        update((s) => ({ ...s, error: String(e) }));
      }
    },

    async deleteEvent(id: string) {
      try {
        await storeDeleteEvent(id);
        update((s) => ({
          ...s,
          selectedEvent: s.selectedEvent?.id === id ? null : s.selectedEvent,
        }));
        await this.loadEvents();
      } catch (e) {
        update((s) => ({ ...s, error: String(e) }));
      }
    },

    async saveSettings(settings: Settings) {
      try {
        await storeSaveSettings(settings);
        update((s) => ({ ...s, settings }));
      } catch (e) {
        update((s) => ({ ...s, error: String(e) }));
      }
    },

    async checkNotifications() {
      try {
        await storeCheckNotifications();
      } catch (_) {}
    },

    selectEvent(event: NomEvent) {
      update((s) => ({ ...s, selectedEvent: event }));
    },

    goHome() {
      update((s) => ({ ...s, selectedEvent: null }));
    },

    openAdd(event?: NomEvent) {
      update((s) => ({ ...s, editingEvent: event ?? null, showAddModal: true }));
    },

    closeAdd() {
      update((s) => ({ ...s, showAddModal: false, editingEvent: null }));
    },

    openSettings() {
      update((s) => ({ ...s, showSettings: true, showLogs: false }));
    },

    closeSettings() {
      update((s) => ({ ...s, showSettings: false }));
    },

    openLogs() {
      update((s) => ({ ...s, showLogs: true, showSettings: false }));
    },

    closeLogs() {
      update((s) => ({ ...s, showLogs: false }));
    },

    openCommentModal() {
      update((s) => ({ ...s, showCommentModal: true }));
    },

    closeCommentModal() {
      update((s) => ({ ...s, showCommentModal: false }));
    },

    clearError() {
      update((s) => ({ ...s, error: null }));
    },

    setSuccess(msg: string) {
      update((s) => ({ ...s, success: msg }));
    },

    clearSuccess() {
      update((s) => ({ ...s, success: null }));
    },

    setTheme(theme: Theme) {
      update((s) => ({ ...s, theme }));
      localStorage.setItem("nominous-theme", theme);
    },

    toggleTheme() {
      update((s) => {
        const theme: Theme = s.theme === "dark" ? "light" : "dark";
        localStorage.setItem("nominous-theme", theme);
        return { ...s, theme };
      });
    },
  };
}

export const app = createApp();
