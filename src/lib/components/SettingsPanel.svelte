<script lang="ts">
  import { app } from "../stores/app";
  import type { Settings } from "../types";

  let settings = $state<Settings>(
    structuredClone($app.settings ?? {
      categories: [],
      priorities: [],
      default_notifications: [],
    })
  );

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
</script>

<div class="settings-layout">
  <header class="settings-header">
    <button class="btn btn-ghost back-btn" onclick={() => app.closeSettings()}>← Back</button>
    <h1 class="settings-title">Settings</h1>
    <button class="btn btn-primary" onclick={save}>Save</button>
  </header>

  <div class="settings-body">
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Activity</h2>
      </div>
      <button class="btn btn-ghost log-link" onclick={() => { app.closeSettings(); app.openLogs(); }}>
        View Activity Log →
      </button>
    </section>

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
  }

  .settings-title {
    flex: 1;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .back-btn { font-size: 13px; }

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

  .log-link {
    font-size: 13px;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    width: fit-content;
  }

  .icon-btn {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 12px;
  }
</style>
