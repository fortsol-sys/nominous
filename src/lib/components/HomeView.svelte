<script lang="ts">
  import { app } from "../stores/app";
  import type { NomEvent } from "../types";

  const now = new Date();

  const active = $derived($app.events.filter((e) => new Date(e.target_date) >= now));
  const done = $derived($app.events.filter((e) => new Date(e.target_date) < now));

  const grouped = $derived.by(() => {
    const map = new Map<string, NomEvent[]>();
    for (const e of active) {
      const cat = e.category || "Uncategorized";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(e);
    }
    return map;
  });

  function catColor(name: string) {
    return $app.settings?.categories.find((c) => c.name === name)?.color ?? "#6366f1";
  }

  function priColor(name: string) {
    return $app.settings?.priorities.find((p) => p.name === name)?.color ?? "#6b7280";
  }

  function daysLeft(e: NomEvent) {
    const diff = new Date(e.target_date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  }

  function progress(e: NomEvent) {
    const s = new Date(e.created_at).getTime();
    const en = new Date(e.target_date).getTime();
    return Math.min(100, Math.max(0, ((Date.now() - s) / (en - s)) * 100));
  }

  const upcomingThisWeek = $derived(active.filter((e) => daysLeft(e) <= 7).length);
</script>

<div class="home">
  <header class="home-header">
    <div class="home-title-row">
      <h1 class="home-title">Overview</h1>
      <div class="home-stats">
        <span class="stat">{active.length} active</span>
        {#if upcomingThisWeek > 0}
          <span class="stat warning">{upcomingThisWeek} due this week</span>
        {/if}
        {#if done.length > 0}
          <span class="stat muted">{done.length} done</span>
        {/if}
      </div>
    </div>
    <button class="btn btn-primary" onclick={() => app.openAdd()}>+ New Event</button>
  </header>

  <div class="home-body">
    {#if $app.events.length === 0}
      <div class="empty-state">
        <div class="empty-icon">◷</div>
        <p>No events yet. Start by creating one.</p>
        <button class="btn btn-primary" onclick={() => app.openAdd()}>+ New Event</button>
      </div>
    {:else}
      {#each [...grouped.entries()] as [cat, events]}
        {@const color = catColor(cat)}
        <section class="cat-section">
          <div class="cat-head" style="border-left-color: {color}">
            <div class="cat-dot" style="background: {color}"></div>
            <span class="cat-name">{cat}</span>
            <span class="cat-count">{events.length}</span>
          </div>
          <div class="event-grid">
            {#each events as event}
              {@const days = daysLeft(event)}
              {@const pc = catColor(event.category)}
              {@const prog = progress(event)}
              <button
                class="tile"
                style="border-color: {pc}44"
                onclick={() => app.selectEvent(event)}
              >
                <div class="tile-top">
                  <span class="tile-name">{event.name}</span>
                  <span
                    class="tile-days"
                    style="color: {days <= 7 ? 'var(--warning)' : days <= 30 ? 'var(--text-secondary)' : pc}"
                  >{days}d</span>
                </div>
                <div class="tile-bar">
                  <div class="tile-fill" style="width: {prog}%; background: {pc}"></div>
                </div>
                <div class="tile-footer">
                  <span class="badge" style="background: {priColor(event.priority)}22; color: {priColor(event.priority)}">{event.priority}</span>
                  {#if event.stages.length > 0}
                    {@const completed = event.stages.filter((s) => s.completed).length}
                    <span class="stage-count">{completed}/{event.stages.length} stages</span>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        </section>
      {/each}

      {#if done.length > 0}
        <section class="cat-section done-section">
          <div class="cat-head" style="border-left-color: var(--text-muted)">
            <div class="cat-dot" style="background: var(--text-muted)"></div>
            <span class="cat-name">Done</span>
            <span class="cat-count">{done.length}</span>
          </div>
          <div class="event-grid">
            {#each done as event}
              {@const pc = catColor(event.category)}
              <button class="tile done-tile" onclick={() => app.selectEvent(event)}>
                <div class="tile-top">
                  <span class="tile-name">{event.name}</span>
                  <span class="tile-done-badge">done</span>
                </div>
                <div class="tile-footer">
                  <span class="badge" style="background: {pc}22; color: {pc}">{event.category}</span>
                </div>
              </button>
            {/each}
          </div>
        </section>
      {/if}
    {/if}
  </div>
</div>

<style>
  .home {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--bg);
  }

  .home-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0;
    gap: 16px;
  }

  .home-title-row {
    display: flex;
    align-items: baseline;
    gap: 16px;
  }

  .home-title {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .home-stats {
    display: flex;
    gap: 10px;
  }

  .stat {
    font-size: 12px;
    color: var(--text-muted);
  }

  .stat.warning {
    color: var(--warning);
    font-weight: 600;
  }

  .home-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px 32px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--text-muted);
    padding: 80px 0;
  }

  .empty-icon {
    font-size: 64px;
    opacity: 0.3;
  }

  .empty-state p {
    font-size: 15px;
  }

  .cat-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .cat-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 10px;
    border-left: 3px solid;
  }

  .cat-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .cat-name {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .cat-count {
    font-size: 11px;
    color: var(--text-muted);
    margin-left: auto;
  }

  .event-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 10px;
  }

  .tile {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    background: var(--surface);
    border: 1px solid;
    border-radius: var(--radius);
    text-align: left;
    transition: background 0.15s;
  }

  .tile:hover {
    background: var(--surface-hover);
  }

  .tile-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .tile-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tile-days {
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .tile-bar {
    height: 3px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }

  .tile-fill {
    height: 100%;
    border-radius: 2px;
  }

  .tile-footer {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .stage-count {
    font-size: 11px;
    color: var(--text-muted);
    margin-left: auto;
  }

  .done-section {
    opacity: 0.65;
  }

  .done-tile {
    border-color: var(--border) !important;
  }

  .tile-done-badge {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
</style>
