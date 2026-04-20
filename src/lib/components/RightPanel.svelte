<script lang="ts">
  import { app } from "../stores/app";
  import CountdownView from "./CountdownView.svelte";
  import TimelineView from "./TimelineView.svelte";

  let view = $state<"countdown" | "timeline">("countdown");
</script>

<main class="panel">
  {#if $app.selectedEvent}
    {@const event = $app.selectedEvent}
    {@const catColor = $app.settings?.categories.find((c) => c.name === event.category)?.color ?? "#6366f1"}
    {@const priColor = $app.settings?.priorities.find((p) => p.name === event.priority)?.color ?? "#6b7280"}

    <header class="panel-header">
      <div class="header-left">
        <h1 class="event-title">{event.name}</h1>
        <div class="header-badges">
          <span class="badge" style="background:{catColor}22;color:{catColor}">{event.category}</span>
          <span class="badge" style="background:{priColor}22;color:{priColor}">{event.priority}</span>
        </div>
      </div>
      <div class="header-actions">
        <div class="view-toggle">
          <button
            class:active={view === "countdown"}
            onclick={() => (view = "countdown")}
          >Countdown</button>
          <button
            class:active={view === "timeline"}
            onclick={() => (view = "timeline")}
          >Timeline</button>
        </div>
        <button class="btn btn-ghost" onclick={() => app.openCommentModal()}>+ Comment</button>
        <button class="btn btn-ghost" onclick={() => app.openAdd(event)}>Edit</button>
        <button
          class="btn btn-danger"
          onclick={() => {
            if (confirm(`Delete "${event.name}"?`)) app.deleteEvent(event.id);
          }}
        >Delete</button>
      </div>
    </header>

    <div class="panel-content">
      {#if view === "countdown"}
        <CountdownView {event} />
      {:else}
        <TimelineView {event} />
      {/if}
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">◷</div>
      <p>Select an event to view its countdown</p>
      <button class="btn btn-primary" onclick={() => app.openAdd()}>+ New Event</button>
    </div>
  {/if}
</main>

<style>
  .panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--bg);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    gap: 16px;
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .event-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-badges {
    display: flex;
    gap: 6px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .view-toggle {
    display: flex;
    background: var(--surface-hover);
    border-radius: var(--radius-sm);
    padding: 3px;
    gap: 2px;
  }

  .view-toggle button {
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    border-radius: 3px;
  }

  .view-toggle button.active {
    background: var(--surface-active);
    color: var(--text-primary);
  }

  .view-toggle button:hover:not(.active) {
    color: var(--text-secondary);
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 32px 40px;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--text-muted);
  }

  .empty-icon {
    font-size: 64px;
    opacity: 0.3;
  }

  .empty-state p {
    font-size: 15px;
  }
</style>
