<script lang="ts">
  import type { NomEvent } from "../types";
  import { app } from "../stores/app";

  let { event, selected, onclick }: {
    event: NomEvent;
    selected: boolean;
    onclick: () => void;
  } = $props();

  const daysLeft = $derived.by(() => {
    const diff = new Date(event.target_date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  });

  const progress = $derived.by(() => {
    const start = new Date(event.created_at).getTime();
    const end = new Date(event.target_date).getTime();
    return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
  });

  const categoryColor = $derived(
    $app.settings?.categories.find((c) => c.name === event.category)?.color ?? "#6366f1"
  );
  const priorityColor = $derived(
    $app.settings?.priorities.find((p) => p.name === event.priority)?.color ?? "#6b7280"
  );
  const isPast = $derived(new Date(event.target_date) < new Date());
  const daysColor = $derived(
    isPast ? "var(--error)" : daysLeft <= 7 ? "var(--warning)" : "var(--text-secondary)"
  );
</script>

<button class="card" class:selected {onclick}>
  <div class="card-accent" style="background: {categoryColor}"></div>
  <div class="card-body">
    <div class="card-top">
      <span class="event-name">{event.name}</span>
      <span class="days" style="color: {daysColor}">
        {#if isPast}done{:else}{daysLeft}d{/if}
      </span>
    </div>
    <div class="card-meta">
      <span class="badge" style="background: {categoryColor}22; color: {categoryColor}">
        {event.category}
      </span>
      <span class="badge" style="background: {priorityColor}22; color: {priorityColor}">
        {event.priority}
      </span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" style="width: {progress}%; background: {categoryColor}"></div>
    </div>
  </div>
</button>

<style>
  .card {
    display: flex;
    align-items: stretch;
    width: 100%;
    text-align: left;
    border-radius: var(--radius);
    overflow: hidden;
    border: 1px solid transparent;
    transition: background 0.1s, border-color 0.1s;
  }

  .card:hover {
    background: var(--surface-hover);
    border-color: var(--border);
  }

  .card.selected {
    background: var(--surface-active);
    border-color: var(--border-light);
  }

  .card-accent {
    width: 3px;
    flex-shrink: 0;
  }

  .card-body {
    flex: 1;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .card-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .event-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .days {
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .card-meta {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .progress-track {
    height: 3px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s;
  }
</style>
