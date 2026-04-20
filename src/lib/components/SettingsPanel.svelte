<script lang="ts">
  import { app } from "../stores/app";
  import type { Settings } from "../types";
  import { getAppLogs, clearAppLogs, exportData as storeExportData, backupData } from "../storage";

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

  // Data tab state — read directly from the store snapshot to avoid $state-in-$state warning
  let backupPath = $state($app.settings?.backup_path ?? "");
  let lastBackup = $state($app.settings?.last_backup ?? "");
  let backupRunning = $state(false);
  let exportRunning = $state<"json" | "csv" | null>(null);
  let dataMsg = $state<{ kind: "ok" | "err"; text: string } | null>(null);

  $effect(() => {
    if (activeTab === "applogs") {
      logsLoading = true;
      getAppLogs()
        .then((lines) => { appLogs = lines; })
        .catch(() => { appLogs = []; })
        .finally(() => { logsLoading = false; });
    }
  });

  async function exportData(format: "json" | "csv") {
    exportRunning = format;
    dataMsg = null;
    try {
      const path = await storeExportData(format);
      dataMsg = { kind: "ok", text: `Saved to: ${path}` };
    } catch (e) {
      dataMsg = { kind: "err", text: String(e) };
    } finally {
      exportRunning = null;
    }
  }

  async function runBackup() {
    if (!backupPath.trim()) {
      dataMsg = { kind: "err", text: "Enter a backup folder path first." };
      return;
    }
    backupRunning = true;
    dataMsg = null;
    try {
      const ts = await backupData(backupPath.trim(), settings);
      lastBackup = ts;
      settings = { ...settings, backup_path: backupPath.trim(), last_backup: ts };
      dataMsg = { kind: "ok", text: `Backup complete — ${new Date(ts).toLocaleString()}` };
    } catch (e) {
      dataMsg = { kind: "err", text: String(e) };
    } finally {
      backupRunning = false;
    }
  }

  function fmtBackupDate(ts: string) {
    try { return new Date(ts).toLocaleString(); } catch { return ts; }
  }

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
    await clearAppLogs();
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
    <div class="data-body">
      {#if dataMsg}
        <div class="data-msg" class:ok={dataMsg.kind === "ok"} class:err={dataMsg.kind === "err"}>
          {dataMsg.text}
          <button onclick={() => (dataMsg = null)}>✕</button>
        </div>
      {/if}

      <!-- Export -->
      <section class="data-section">
        <div class="data-section-head">
          <h2 class="data-section-title">Export</h2>
          <p class="data-section-desc">Download all your events, stages, and activity as a portable file.</p>
        </div>
        <div class="export-actions">
          <div class="export-card">
            <div class="export-card-info">
              <span class="export-card-name">JSON</span>
              <span class="export-card-detail">Full data — all fields, log entries, stages</span>
            </div>
            <button
              class="btn btn-primary"
              disabled={!!exportRunning}
              onclick={() => exportData("json")}
            >{exportRunning === "json" ? "Exporting…" : "Export JSON"}</button>
          </div>
          <div class="export-card">
            <div class="export-card-info">
              <span class="export-card-name">CSV</span>
              <span class="export-card-detail">Summary table — opens in Excel / Google Sheets</span>
            </div>
            <button
              class="btn btn-primary"
              disabled={!!exportRunning}
              onclick={() => exportData("csv")}
            >{exportRunning === "csv" ? "Exporting…" : "Export CSV"}</button>
          </div>
        </div>
      </section>

      <div class="data-divider"></div>

      <!-- Local Backup -->
      <section class="data-section">
        <div class="data-section-head">
          <h2 class="data-section-title">Local Backup</h2>
          <p class="data-section-desc">Copy your event files and settings to any folder on your machine.</p>
        </div>
        <div class="backup-form">
          <label for="backup-path">Backup folder path</label>
          <div class="backup-input-row">
            <input
              id="backup-path"
              type="text"
              placeholder="/home/user/Documents/Nominous Backup"
              bind:value={backupPath}
            />
            <button
              class="btn btn-primary"
              disabled={backupRunning || !backupPath.trim()}
              onclick={runBackup}
            >{backupRunning ? "Backing up…" : "Backup Now"}</button>
          </div>
          {#if lastBackup}
            <p class="backup-last">Last backup: {fmtBackupDate(lastBackup)}</p>
          {:else}
            <p class="backup-last muted">No backup recorded yet.</p>
          {/if}
        </div>
      </section>

      <div class="data-divider"></div>

      <!-- Cloud / Remote (planned) -->
      <section class="data-section">
        <div class="data-section-head">
          <h2 class="data-section-title">
            Cloud &amp; Remote Storage
            <span class="coming-soon">Coming soon</span>
          </h2>
          <p class="data-section-desc">Sync your data to a remote storage provider automatically.</p>
        </div>
        <div class="cloud-grid">
          {#each [
            { name: "Dropbox", icon: "◈", desc: "Sync via Dropbox API" },
            { name: "Amazon S3", icon: "◉", desc: "S3-compatible object storage" },
            { name: "WebDAV / File Server", icon: "⊞", desc: "HTTP-based file server" },
            { name: "Custom Script", icon: "⌘", desc: "Run a script after each save" },
          ] as provider}
            <div class="cloud-card disabled">
              <span class="cloud-icon">{provider.icon}</span>
              <div class="cloud-info">
                <span class="cloud-name">{provider.name}</span>
                <span class="cloud-desc">{provider.desc}</span>
              </div>
              <button class="btn btn-ghost" disabled>Set up</button>
            </div>
          {/each}
        </div>
      </section>
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
  .data-body {
    flex: 1;
    overflow-y: auto;
    padding: 28px 40px;
    display: flex;
    flex-direction: column;
    gap: 0;
    max-width: 680px;
  }

  .data-msg {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    margin-bottom: 20px;
  }

  .data-msg.ok  { background: rgba(34,197,94,0.12); color: var(--success); }
  .data-msg.err { background: rgba(239,68,68,0.12);  color: var(--error); }
  .data-msg button { font-size: 13px; opacity: 0.7; }
  .data-msg button:hover { opacity: 1; }

  .data-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 4px 0 28px;
  }

  .data-section-head { display: flex; flex-direction: column; gap: 4px; }

  .data-section-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .data-section-desc {
    font-size: 13px;
    color: var(--text-muted);
  }

  .data-divider {
    height: 1px;
    background: var(--border);
    margin-bottom: 28px;
  }

  .coming-soon {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
    background: var(--surface-active);
    padding: 2px 7px;
    border-radius: 99px;
  }

  /* Export cards */
  .export-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .export-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .export-card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .export-card-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .export-card-detail {
    font-size: 12px;
    color: var(--text-muted);
  }

  /* Backup form */
  .backup-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .backup-input-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .backup-input-row input { flex: 1; }

  .backup-last {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .backup-last.muted { color: var(--text-muted); }

  /* Cloud grid */
  .cloud-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cloud-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .cloud-card.disabled { opacity: 0.45; }

  .cloud-icon {
    font-size: 20px;
    width: 28px;
    text-align: center;
    flex-shrink: 0;
    color: var(--text-muted);
  }

  .cloud-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cloud-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .cloud-desc {
    font-size: 12px;
    color: var(--text-muted);
  }
</style>
