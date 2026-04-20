<script lang="ts">
  import { onMount } from "svelte";
  import { app } from "./lib/stores/app";
  import EventList from "./lib/components/EventList.svelte";
  import RightPanel from "./lib/components/RightPanel.svelte";
  import AddEventModal from "./lib/components/AddEventModal.svelte";
  import LogCommentModal from "./lib/components/LogCommentModal.svelte";
  import SettingsPanel from "./lib/components/SettingsPanel.svelte";
  import LogsPanel from "./lib/components/LogsPanel.svelte";

  onMount(async () => {
    const saved = localStorage.getItem("nominous-theme") as "dark" | "light" | null;
    if (saved) app.setTheme(saved);

    await app.loadSettings();
    await app.loadEvents();
    app.checkNotifications();

    const interval = setInterval(() => app.checkNotifications(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  });

  $effect(() => {
    document.documentElement.setAttribute("data-theme", $app.theme);
  });
</script>

<div class="layout">
  {#if $app.showLogs}
    <LogsPanel />
  {:else if $app.showSettings}
    <SettingsPanel />
  {:else}
    <EventList />
    <RightPanel />
  {/if}
</div>

{#if $app.showAddModal}
  <AddEventModal />
{/if}

{#if $app.showCommentModal}
  <LogCommentModal />
{/if}

{#if $app.error}
  <div class="error-toast" role="alert">
    <span>{$app.error}</span>
    <button onclick={() => app.clearError()}>✕</button>
  </div>
{/if}

<style>
  .layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--bg);
  }

  .error-toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--error);
    color: white;
    padding: 10px 16px;
    border-radius: var(--radius);
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    z-index: 9999;
    max-width: 360px;
  }

  .error-toast button {
    color: white;
    opacity: 0.8;
    font-size: 14px;
    flex-shrink: 0;
  }
  .error-toast button:hover { opacity: 1; }
</style>
