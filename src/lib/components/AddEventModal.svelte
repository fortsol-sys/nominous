<script lang="ts">
  import { app } from "../stores/app";
  import type { Stage, NotificationRule } from "../types";

  const isEdit = $derived(!!$app.editingEvent);

  let name = $state($app.editingEvent?.name ?? "");
  let targetDate = $state(
    $app.editingEvent?.target_date
      ? $app.editingEvent.target_date.slice(0, 16)
      : ""
  );
  let category = $state($app.editingEvent?.category ?? $app.settings?.categories[0]?.name ?? "");
  let priority = $state($app.editingEvent?.priority ?? $app.settings?.priorities[1]?.name ?? "");
  let stages = $state<Stage[]>(
    $app.editingEvent?.stages ? structuredClone($app.editingEvent.stages) : []
  );
  let notifications = $state<NotificationRule[]>(
    $app.editingEvent?.notifications
      ? structuredClone($app.editingEvent.notifications)
      : ($app.settings?.default_notifications
          ? structuredClone($app.settings.default_notifications)
          : [])
  );

  let newStageTitle = $state("");
  let newStageDate = $state("");

  const PRESET_TRIGGERS = ["7d", "3d", "1d", "12h", "1h", "stage"];

  function triggerLabel(t: string) {
    const map: Record<string, string> = {
      "7d": "7 days before", "3d": "3 days before", "1d": "1 day before",
      "12h": "12 hours before", "1h": "1 hour before", "stage": "Stage deadlines",
    };
    return map[t] ?? t;
  }

  function isEnabled(trigger: string) {
    return notifications.some((n) => n.trigger === trigger && n.enabled);
  }

  function toggleNotification(trigger: string, enabled: boolean) {
    const existing = notifications.find((n) => n.trigger === trigger);
    if (existing) {
      notifications = notifications.map((n) =>
        n.trigger === trigger ? { ...n, enabled } : n
      );
    } else if (enabled) {
      notifications = [...notifications, { trigger, enabled: true }];
    }
  }

  function addStage() {
    if (!newStageTitle.trim()) return;
    stages = [
      ...stages,
      {
        id: crypto.randomUUID(),
        title: newStageTitle.trim(),
        date: newStageDate || undefined,
        completed: false,
        created_at: new Date().toISOString(),
      },
    ];
    newStageTitle = "";
    newStageDate = "";
  }

  function removeStage(id: string) {
    stages = stages.filter((s) => s.id !== id);
  }

  async function submit() {
    if (!name.trim() || !targetDate) return;
    const id = $app.editingEvent?.id ?? crypto.randomUUID();
    const now = new Date().toISOString();
    await app.saveEvent({
      id,
      name: name.trim(),
      target_date: targetDate.length === 16 ? targetDate + ":00" : targetDate,
      category,
      priority,
      created_at: $app.editingEvent?.created_at ?? now,
      notifications: notifications.filter((n) => n.enabled),
      stages,
      log: $app.editingEvent?.log ?? [],
    });
    app.closeAdd();
  }
</script>

<div class="overlay" role="dialog" aria-modal="true">
  <div class="modal">
    <header class="modal-header">
      <h2>{isEdit ? "Edit Event" : "New Event"}</h2>
      <button class="btn-ghost icon-btn" onclick={() => app.closeAdd()}>✕</button>
    </header>

    <div class="modal-body">
      <div class="field">
        <label for="ev-name">Event name</label>
        <input id="ev-name" type="text" bind:value={name} placeholder="e.g. Product launch" />
      </div>

      <div class="field">
        <label for="ev-date">Target date & time</label>
        <input id="ev-date" type="datetime-local" bind:value={targetDate} />
      </div>

      <div class="row">
        <div class="field">
          <label for="ev-cat">Category</label>
          <select id="ev-cat" bind:value={category}>
            {#each $app.settings?.categories ?? [] as cat}
              <option value={cat.name}>{cat.name}</option>
            {/each}
          </select>
        </div>
        <div class="field">
          <label for="ev-pri">Priority</label>
          <select id="ev-pri" bind:value={priority}>
            {#each ($app.settings?.priorities ?? []).slice().sort((a, b) => a.order - b.order) as pri}
              <option value={pri.name}>{pri.name}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="section">
        <span class="section-label">Stages / Milestones</span>
        {#each stages as stage (stage.id)}
          <div class="stage-row">
            <span class="stage-name">{stage.title}</span>
            {#if stage.date}<span class="stage-date-label">{stage.date.slice(0, 10)}</span>{/if}
            <button class="btn-ghost remove-btn" onclick={() => removeStage(stage.id)}>✕</button>
          </div>
        {/each}
        <div class="add-stage-row">
          <input
            type="text"
            placeholder="Stage title"
            bind:value={newStageTitle}
            onkeydown={(e) => e.key === "Enter" && addStage()}
            style="flex: 1"
          />
          <input type="date" bind:value={newStageDate} style="width: 140px" />
          <button class="btn btn-ghost" onclick={addStage}>+ Add</button>
        </div>
      </div>

      <div class="section">
        <span class="section-label">Notifications</span>
        <div class="notif-grid">
          {#each PRESET_TRIGGERS as trigger}
            <label class="notif-item">
              <input
                type="checkbox"
                checked={isEnabled(trigger)}
                onchange={(e) => toggleNotification(trigger, (e.target as HTMLInputElement).checked)}
              />
              <span>{triggerLabel(trigger)}</span>
            </label>
          {/each}
        </div>
      </div>
    </div>

    <footer class="modal-footer">
      <button class="btn btn-ghost" onclick={() => app.closeAdd()}>Cancel</button>
      <button class="btn btn-primary" onclick={submit} disabled={!name.trim() || !targetDate}>
        {isEdit ? "Save Changes" : "Create Event"}
      </button>
    </footer>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal {
    background: var(--surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    width: 540px;
    max-width: 100%;
    max-height: calc(100vh - 40px);
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .modal-header h2 { font-size: 15px; font-weight: 600; }

  .icon-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 14px;
  }

  .modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
  }

  .field { display: flex; flex-direction: column; gap: 4px; }

  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 4px;
    border-top: 1px solid var(--border);
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .stage-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
  }

  .stage-name { flex: 1; font-size: 13px; color: var(--text-primary); }
  .stage-date-label { font-size: 12px; color: var(--text-muted); }

  .remove-btn {
    color: var(--text-muted);
    font-size: 12px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .add-stage-row { display: flex; gap: 8px; align-items: center; }

  .notif-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

  .notif-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .notif-item input[type="checkbox"] { width: auto; accent-color: var(--accent); }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
