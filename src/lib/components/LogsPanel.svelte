<script lang="ts">
  import { app } from "../stores/app";

  type LogRow = {
    timestamp: string;
    kind: string;
    content: string;
    eventId: string;
    eventName: string;
    categoryColor: string;
  };

  let filterEvent = $state("");
  let filterKind = $state<"all" | "comment" | "stage_add" | "stage_complete">("all");

  const allLogs = $derived<LogRow[]>(
    $app.events
      .flatMap((event) => {
        const color =
          $app.settings?.categories.find((c) => c.name === event.category)?.color ?? "#6366f1";
        return event.log.map((entry) => ({
          ...entry,
          eventId: event.id,
          eventName: event.name,
          categoryColor: color,
        }));
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  );

  const filtered = $derived(
    allLogs.filter((row) => {
      const matchesEvent =
        !filterEvent || row.eventName.toLowerCase().includes(filterEvent.toLowerCase());
      const matchesKind = filterKind === "all" || row.kind === filterKind;
      return matchesEvent && matchesKind;
    })
  );

  function kindLabel(kind: string) {
    if (kind === "comment") return "comment";
    if (kind === "stage_complete") return "stage done";
    if (kind === "stage_add") return "stage added";
    return kind;
  }

  function kindColor(kind: string) {
    if (kind === "comment") return "var(--text-muted)";
    if (kind === "stage_complete") return "var(--success)";
    return "var(--accent)";
  }

  function fmtTimestamp(ts: string) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric",
    }) + " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  function goToEvent(eventId: string) {
    const event = $app.events.find((e) => e.id === eventId);
    if (event) {
      app.selectEvent(event);
      app.closeLogs();
    }
  }
</script>

<div class="logs-layout">
  <header class="logs-header">
    <button class="btn btn-ghost back-btn" onclick={() => app.closeLogs()}>← Back</button>
    <h1 class="logs-title">Activity Log</h1>
    <span class="log-count">{filtered.length} entries</span>
  </header>

  <div class="logs-toolbar">
    <input
      type="search"
      placeholder="Filter by event name…"
      bind:value={filterEvent}
    />
    <div class="kind-filter">
      {#each [["all","All"],["comment","Comments"],["stage_complete","Stage Done"],["stage_add","Stage Added"]] as [val, label]}
        <button
          class:active={filterKind === val}
          onclick={() => (filterKind = val as typeof filterKind)}
        >{label}</button>
      {/each}
    </div>
  </div>

  <div class="logs-body">
    {#if filtered.length === 0}
      <p class="empty">No log entries found.</p>
    {:else}
      {#each filtered as row (row.eventId + row.timestamp)}
        <div class="log-row">
          <div class="log-timeline">
            <div class="log-dot" style="background: {kindColor(row.kind)}"></div>
            <div class="log-line"></div>
          </div>
          <div class="log-content">
            <div class="log-top">
              <button
                class="event-tag"
                style="background: {row.categoryColor}22; color: {row.categoryColor}"
                onclick={() => goToEvent(row.eventId)}
                title="Go to event"
              >
                {row.eventName}
              </button>
              <span class="kind-badge" style="color: {kindColor(row.kind)}">
                {kindLabel(row.kind)}
              </span>
              <span class="log-time">{fmtTimestamp(row.timestamp)}</span>
            </div>
            <p class="log-text">{row.content}</p>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .logs-layout {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    min-width: 0;
  }

  .logs-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0;
  }

  .logs-title {
    flex: 1;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .back-btn { font-size: 13px; }

  .log-count {
    font-size: 12px;
    color: var(--text-muted);
  }

  .logs-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .logs-toolbar input {
    width: 220px;
    font-size: 13px;
  }

  .kind-filter {
    display: flex;
    background: var(--surface-hover);
    border-radius: var(--radius-sm);
    padding: 3px;
    gap: 2px;
  }

  .kind-filter button {
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    border-radius: 3px;
  }

  .kind-filter button.active {
    background: var(--surface-active);
    color: var(--text-primary);
  }

  .kind-filter button:hover:not(.active) {
    color: var(--text-secondary);
  }

  .logs-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px 32px;
    max-width: 860px;
  }

  .empty {
    color: var(--text-muted);
    font-size: 13px;
    text-align: center;
    padding: 48px 0;
  }

  .log-row {
    display: flex;
    gap: 16px;
    position: relative;
  }

  .log-timeline {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    padding-top: 3px;
  }

  .log-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    z-index: 1;
  }

  .log-line {
    width: 2px;
    flex: 1;
    min-height: 24px;
    background: var(--border);
    margin-top: 4px;
  }

  .log-row:last-child .log-line {
    display: none;
  }

  .log-content {
    flex: 1;
    padding-bottom: 20px;
    min-width: 0;
  }

  .log-top {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }

  .event-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .event-tag:hover { opacity: 0.75; }

  .kind-badge {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .log-time {
    font-size: 11px;
    color: var(--text-muted);
    margin-left: auto;
  }

  .log-text {
    font-size: 13px;
    color: var(--text-primary);
    line-height: 1.5;
  }
</style>
