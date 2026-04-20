<script lang="ts">
  import { app } from "../stores/app";
  import type { Settings } from "../types";
  import { invoke } from "@tauri-apps/api/core";

  let settings = $state<Settings>(
    structuredClone($app.settings ?? {
      categories: [],
      priorities: [],
      default_notifications: [],
    })
  );

  let activeTab = $state<"config" | "activity" | "applogs" | "data">("config");
  let appLogs = $state<string[]>([]);
  let logsLoading = $state(false);

  $effect(() => {
    if (activeTab === "applogs") {
      logsLoading = true;
      invoke<string[]>("get_app_logs")
        .then((lines) => { appLogs = lines; })
        .catch(() => { appLogs = []; })
        .finally(() => { logsLoading = false; });
    }
  });

  function addCategory() {
    settings.categories = [...settings.categories, { name: "New Category", color: "#6366f1" }];
  }

  function removeCategory(i: number) {
    settings.categories = settings.categories.filter((_, idx) => idx !== i);
  }

  function addPriority() {
    settings.priorities = [
      ...settings.priorities,
      { name: "New Priority", color: "#6b7280", order: settings.priorities.length },
    ];
  }

  function removePriority(i: number) {
    settings.priorities = settings.priorities.filter((_, idx) => idx !== i);
  }

  async function save() {
    await app.saveSettings(settings);
    app.closeSettings();
  }

  async function clearLogs() {
    await invoke("clear_app_logs");
    appLogs = [];
  }
</script>

<div class="settings-layout">
  <header class="settings-header">
    <button class="btn btn-ghost back-btn" onclick={() => app.closeSettings()}>← Back</button>
    <h1 class="settings-title">Settings</h1>
    {#if activeTab === "config"}
      <button class="btn btn-primary" onclick={save}>Save</button>
    {:else}
      <div></div>
    {/if}
  </header>

  <div class="tab-bar">
    <button class:active={activeTab === "config"} onclick={() => (activeTab = "config")}>Configuration</button>
    <button class:active={activeTab === "activity"} onclick={() => (activeTab = "activity")}>Activity Log</button>
    <button class:active={activeTab === "applogs"} onclick={() => (activeTab = "applogs")}>App Logs</button>
    <button class:active={activeTab === "data"} onclick={() => (activeTab = "data")}>Data</button>
  </div>

  {#if activeTab === "config"}
    <div class="settings-body">
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Categories</h2>
          <button class="btn btn-ghost" onclick={addCategory}>+ Add</button>
        </div>
        <div class="item-list">
          {#each settings.categories as _, i (i)}
            <div class="item-row">
              <input type="color" bind:value={settings.categories[i].color} style="width: 36px; flex-shrink: 0" />
              <input type="text" bind:value={settings.categories[i].name} placeholder="Category name" />
              <button class="btn btn-danger icon-btn" onclick={() => removeCategory(i)}>✕</button>
            </div>
          {/each}
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Priorities</h2>
          <button class="btn btn-ghost" onclick={addPriority}>+ Add</button>
        </div>
        <div class="item-list">
          {#each settings.priorities as _, i (i)}
            <div class="item-row">
              <input type="color" bind:value={settings.priorities[i].color} style="width: 36px; flex-shrink: 0" />
              <input type="text" bind:value={settings.priorities[i].name} placeholder="Priority name" />
              <input type="number" bind:value={settings.priorities[i].order} title="Order" style="width: 60px" min="0" />
              <button class="btn btn-danger icon-btn" onclick={() => removePriority(i)}>✕</button>
            </div>
          {/each}
        </div>
      </section>
    </div>

  {:else if activeTab === "activity"}
    <div class="tab-body centered">
      <p class="tab-hint">The Activity Log shows all comments and stage updates across your events.</p>
      <button
        class="btn btn-primary"
        onclick={() => { app.closeSettings(); app.openLogs(); }}
      >Open Activity Log →</button>
    </div>

  {:else if activeTab === "applogs"}
    <div class="log-body">
      <div class="log-toolbar">
        <span class="log-count">{appLogs.length} entries</span>
        <button class="btn btn-ghost btn-sm" onclick={clearLogs}>Clear logs</button>
      </div>
      {#if logsLoading}
        <p class="log-hint">Loading…</p>
      {:else if appLogs.length === 0}
        <p class="log-hint">No log entries yet.</p>
      {:else}
        <div class="log-lines">
          {#each appLogs as line}
            <div class="log-line">{line}</div>
          {/each}
        </div>
      {/if}
    </div>

  {:else}
    <div class="tab-body centered">
      <div class="placeholder-icon">☁</div>
      <p class="placeholder-title">Data Connections</p>
      <p class="placeholder-desc">
        Configure storage backends — local file server, cloud storage (S3, Dropbox), or sync services.<br />
        Coming in a future release.
      </p>
    </div>
  {/if}
</div>

<style>
  .settings-layout {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    min-width: 0;
  }

  .settings-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0;
  }

  .settings-title {
    flex: 1;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .back-btn { font-size: 13px; }

  .tab-bar {
    display: flex;
    gap: 0;
    padding: 0 24px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .tab-bar button {
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    border-radius: 0;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color 0.15s, border-color 0.15s;
  }

  .tab-bar button:hover {
    color: var(--text-primary);
    background: none;
  }

  .tab-bar button.active {
    color: var(--text-primary);
    border-bottom-color: var(--accent);
    background: none;
  }

  .settings-body {
    flex: 1;
    overflow-y: auto;
    padding: 32px 40px;
    display: flex;
    flex-direction: column;
    gap: 40px;
    max-width: 600px;
  }

  .section { display: flex; flex-direction: column; gap: 16px; }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .item-list { display: flex; flex-direction: column; gap: 8px; }

  .item-row { display: flex; gap: 8px; align-items: center; }

  .icon-btn {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 12px;
  }

  /* Activity tab */
  .tab-body {
    flex: 1;
    padding: 40px;
  }

  .tab-body.centered {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    max-width: 480px;
  }

  .tab-hint {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  /* App logs tab */
  .log-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .log-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 24px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .log-count {
    font-size: 12px;
    color: var(--text-muted);
  }

  .btn-sm {
    font-size: 12px;
    padding: 4px 10px;
  }

  .log-hint {
    padding: 40px 24px;
    font-size: 13px;
    color: var(--text-muted);
  }

  .log-lines {
    flex: 1;
    overflow-y: auto;
    padding: 12px 24px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .log-line {
    font-size: 12px;
    font-family: monospace;
    color: var(--text-secondary);
    padding: 3px 0;
    border-bottom: 1px solid var(--border);
    word-break: break-all;
  }

  /* Data tab */
  .placeholder-icon {
    font-size: 48px;
    opacity: 0.2;
  }

  .placeholder-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .placeholder-desc {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.7;
  }
</style>
