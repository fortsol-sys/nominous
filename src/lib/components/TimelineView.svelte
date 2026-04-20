<script lang="ts">
  import type { NomEvent, Stage } from "../types";
  import { app } from "../stores/app";

  let { event }: { event: NomEvent } = $props();

  let now = $state(new Date());

  $effect(() => {
    const id = setInterval(() => { now = new Date(); }, 30000);
    return () => clearInterval(id);
  });

  const startDate = $derived(new Date(event.created_at));
  const start = $derived(startDate.getTime());
  const end = $derived(new Date(event.target_date).getTime());
  const totalDays = $derived(Math.round((end - start) / 86400000));

  const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const axisTicks = $derived.by(() => {
    const ticks: { label: string; pct: number }[] = [];
    if (totalDays <= 10) return ticks;

    if (totalDays > 60) {
      let cur = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
      while (cur.getTime() < end) {
        const p = pct(cur.getTime());
        if (p > 3 && p < 97) {
          const lbl = cur.getMonth() === 0
            ? `${MONTHS_SHORT[cur.getMonth()]} '${String(cur.getFullYear()).slice(2)}`
            : MONTHS_SHORT[cur.getMonth()];
          ticks.push({ label: lbl, pct: p });
        }
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      }
    } else {
      const firstMonday = new Date(startDate);
      firstMonday.setDate(firstMonday.getDate() + (8 - firstMonday.getDay()) % 7);
      let cur = firstMonday;
      while (cur.getTime() < end) {
        const p = pct(cur.getTime());
        if (p > 3 && p < 97) {
          ticks.push({
            label: cur.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            pct: p,
          });
        }
        cur = new Date(cur.getTime() + 7 * 86400000);
      }
    }
    return ticks;
  });
  const total = $derived(end - start);
  const elapsed = $derived(now.getTime() - start);
  const progress = $derived(Math.min(100, Math.max(0, (elapsed / total) * 100)));

  function pct(ts: number) {
    return Math.min(100, Math.max(0, ((ts - start) / total) * 100));
  }

  const stageMarkers = $derived(
    event.stages
      .map((s) => ({ ...s, pct: s.date ? pct(new Date(s.date).getTime()) : null }))
      .filter((s) => s.pct !== null)
  );

  const commentMarkers = $derived(
    event.log
      .filter((e) => e.kind === "comment")
      .map((e) => ({ ...e, pct: pct(new Date(e.timestamp).getTime()) }))
      .filter((e) => e.pct >= 0 && e.pct <= 100)
  );

  const catColor = $derived(
    $app.settings?.categories.find((c) => c.name === event.category)?.color ?? "#6366f1"
  );

  let stagePending = $state<string | null>(null);
  let stageComment = $state("");
  let stageCommentInput = $state<HTMLInputElement | null>(null);

  $effect(() => {
    if (stagePending && stageCommentInput) {
      stageCommentInput.focus();
    }
  });

  async function toggleStage(stage: Stage) {
    if (stage.completed) {
      // Un-completing — no prompt needed
      await app.saveEvent({
        ...event,
        stages: event.stages.map((s) => s.id === stage.id ? { ...s, completed: false } : s),
      });
    } else {
      stagePending = stage.id;
      stageComment = "";
    }
  }

  async function confirmStage() {
    const stage = event.stages.find((s) => s.id === stagePending);
    if (!stage) return;
    const newLog = [
      ...event.log,
      { timestamp: new Date().toISOString(), kind: "stage_complete" as const, content: `Completed: ${stage.title}` },
      ...(stageComment.trim()
        ? [{ timestamp: new Date().toISOString(), kind: "comment" as const, content: stageComment.trim() }]
        : []),
    ];
    await app.saveEvent({
      ...event,
      stages: event.stages.map((s) => s.id === stagePending ? { ...s, completed: true } : s),
      log: newLog,
    });
    stagePending = null;
    stageComment = "";
  }

  function cancelStage() {
    stagePending = null;
    stageComment = "";
  }

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric",
    });
  }

  function fmtDateShort(s: string) {
    return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
</script>

<div class="timeline-wrap">
  <div class="bar-section">
    <div class="bar-labels">
      <span>{fmtDateShort(event.created_at)}</span>
      <span>{fmtDateShort(event.target_date)}</span>
    </div>

    <div class="bar-container">
      <div class="markers-above">
        {#each stageMarkers as stage}
          <div class="stage-marker" style="left: {stage.pct}%">
            <div
              class="stage-dot"
              class:completed={stage.completed}
              style="border-color: {catColor}; {stage.completed ? `background: ${catColor}` : ''}"
              title={stage.title}
            ></div>
            <span class="stage-label">{stage.title}</span>
          </div>
        {/each}
      </div>

      <div class="bar-track">
        <div class="bar-fill" style="width: {progress}%; background: {catColor}"></div>
        {#each commentMarkers as c}
          <div class="comment-dot" style="left: {c.pct}%" title={c.content}></div>
        {/each}
        {#if progress > 0 && progress < 100}
          <div class="now-cursor" style="left: {progress}%">
            <div class="now-line"></div>
            <span class="now-label">now</span>
          </div>
        {/if}
      </div>
    {#if axisTicks.length > 0}
      <div class="axis-row">
        {#each axisTicks as tick}
          <div class="axis-tick" style="left:{tick.pct}%">
            <div class="tick-mark"></div>
            <span class="tick-label">{tick.label}</span>
          </div>
        {/each}
      </div>
    {/if}
    </div>

    <div class="progress-label">
      <span style="color: {catColor}; font-weight: 700">{progress.toFixed(1)}%</span>
      <span class="text-muted"> elapsed</span>
    </div>
  </div>

  {#if event.stages.length > 0}
    <section class="section">
      <h3 class="section-title">Stages</h3>
      <div class="stage-list">
        {#each event.stages as stage (stage.id)}
          <div class="stage-item" class:completed={stage.completed}>
            <button
              class="stage-check"
              onclick={() => toggleStage(stage)}
              style="border-color: {catColor}; {stage.completed ? `background: ${catColor}` : ''}"
            >
              {#if stage.completed}<span class="check-icon">✓</span>{/if}
            </button>
            <div class="stage-info">
              <span class="stage-title">{stage.title}</span>
              {#if stage.date}
                <span class="stage-date">{fmtDate(stage.date)}</span>
              {/if}
            </div>
          </div>
          {#if stagePending === stage.id}
            <div class="stage-prompt">
              <input
                bind:this={stageCommentInput}
                class="stage-comment-input"
                type="text"
                placeholder="Add a note for this completion… (optional)"
                bind:value={stageComment}
                onkeydown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); confirmStage(); }
                  if (e.key === "Escape") cancelStage();
                }}
              />
              <button class="btn btn-primary btn-xs" onclick={confirmStage}>Done</button>
              <button class="btn btn-ghost btn-xs" onclick={cancelStage}>Skip</button>
            </div>
          {/if}
        {/each}
      </div>
    </section>
  {/if}

</div>

<style>
  .timeline-wrap {
    display: flex;
    flex-direction: column;
    gap: 40px;
    max-width: 720px;
  }

  .bar-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .bar-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-muted);
  }

  .bar-container {
    position: relative;
  }

  .markers-above {
    position: relative;
    height: 44px;
    margin-bottom: 4px;
  }

  .stage-marker {
    position: absolute;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .stage-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid;
    background: var(--bg);
    flex-shrink: 0;
  }

  .stage-dot.completed {
    border-color: transparent;
  }

  .stage-label {
    font-size: 10px;
    color: var(--text-secondary);
    white-space: nowrap;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-track {
    position: relative;
    height: 8px;
    background: var(--surface-active);
    border-radius: 4px;
    overflow: visible;
  }

  .bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 1s linear;
  }

  .comment-dot {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-muted);
    border: 2px solid var(--bg);
    cursor: default;
  }

  .now-cursor {
    position: absolute;
    top: -4px;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
  }

  .now-line {
    width: 2px;
    height: 16px;
    background: var(--text-secondary);
    border-radius: 1px;
  }

  .now-label {
    font-size: 10px;
    color: var(--text-secondary);
    margin-top: 2px;
  }

  .axis-row {
    position: relative;
    height: 26px;
    margin-top: 2px;
  }

  .axis-tick {
    position: absolute;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .tick-mark {
    width: 1px;
    height: 6px;
    background: var(--border-light);
  }

  .tick-label {
    font-size: 10px;
    color: var(--text-muted);
    white-space: nowrap;
    margin-top: 2px;
  }

  .progress-label {
    font-size: 13px;
    color: var(--text-secondary);
    text-align: center;
  }

  .text-muted { color: var(--text-muted); }

  .section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .stage-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .stage-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .stage-item.completed .stage-title {
    text-decoration: line-through;
    color: var(--text-muted);
  }

  .stage-check {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }

  .check-icon {
    font-size: 10px;
    color: white;
    font-weight: 700;
  }

  .stage-info {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .stage-title { font-size: 14px; color: var(--text-primary); }
  .stage-date { font-size: 12px; color: var(--text-muted); }

  .stage-prompt {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0 4px 30px;
    animation: slideDown 0.15s ease;
  }

  .stage-comment-input {
    flex: 1;
    font-size: 12px;
    padding: 5px 8px;
    height: 30px;
  }

  .btn-xs {
    padding: 4px 10px;
    font-size: 12px;
    height: 28px;
    flex-shrink: 0;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
