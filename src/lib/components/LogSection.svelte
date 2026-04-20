<script lang="ts">
  import type { NomEvent } from "../types";
  import { app } from "../stores/app";

  let { event }: { event: NomEvent } = $props();

  let comment = $state("");
  let submitting = $state(false);

  async function submit() {
    if (!comment.trim() || submitting) return;
    submitting = true;
    const updated: NomEvent = {
      ...event,
      log: [
        ...event.log,
        {
          timestamp: new Date().toISOString(),
          kind: "comment" as const,
          content: comment.trim(),
        },
      ],
    };
    await app.saveEvent(updated);
    comment = "";
    submitting = false;
  }

  function fmtTime(ts: string) {
    const d = new Date(ts);
    return (
      d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
      " · " +
      d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    );
  }

  function kindColor(kind: string) {
    if (kind === "stage_complete") return "var(--success)";
    if (kind === "stage_add") return "var(--accent)";
    return "var(--text-muted)";
  }

  function kindLabel(kind: string) {
    if (kind === "stage_complete") return "stage done";
    if (kind === "stage_add") return "stage added";
    return "";
  }
</script>

<div class="log-section">
  <div class="log-header">
    <span class="log-title">Comments &amp; Activity</span>
    <span class="log-count">{event.log.length}</span>
  </div>

  <div class="log-input-row">
    <textarea
      class="log-input"
      placeholder="Add a comment… (Ctrl+Enter to submit)"
      bind:value={comment}
      rows="2"
      onkeydown={(e) => {
        if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); submit(); }
      }}
    ></textarea>
    <button
      class="btn btn-primary submit-btn"
      disabled={!comment.trim() || submitting}
      onclick={submit}
    >Add</button>
  </div>

  <div class="log-entries">
    {#if event.log.length === 0}
      <p class="log-empty">No activity yet.</p>
    {:else}
      {#each [...event.log].reverse() as entry (entry.timestamp)}
        <div class="log-entry">
          <div class="entry-dot" style="background:{kindColor(entry.kind)}"></div>
          <div class="entry-body">
            <span class="entry-text">{entry.content}</span>
            <div class="entry-meta">
              {#if kindLabel(entry.kind)}
                <span class="entry-kind" style="color:{kindColor(entry.kind)}">{kindLabel(entry.kind)}</span>
              {/if}
              <span class="entry-time">{fmtTime(entry.timestamp)}</span>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .log-section {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .log-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .log-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
  }

  .log-count {
    font-size: 11px;
    color: var(--text-muted);
    background: var(--surface-hover);
    padding: 1px 6px;
    border-radius: 99px;
  }

  .log-input-row {
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    align-items: flex-end;
  }

  .log-input {
    flex: 1;
    resize: none;
    font-size: 13px;
    padding: 6px 10px;
    line-height: 1.4;
  }

  .submit-btn {
    height: 32px;
    padding: 0 14px;
    font-size: 13px;
    flex-shrink: 0;
  }

  .submit-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .log-entries {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .log-empty {
    font-size: 12px;
    color: var(--text-muted);
    text-align: center;
    padding: 16px 0;
  }

  .log-entry {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .entry-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 4px;
  }

  .entry-body {
    flex: 1;
    min-width: 0;
  }

  .entry-text {
    font-size: 13px;
    color: var(--text-primary);
    display: block;
    line-height: 1.4;
    word-break: break-word;
  }

  .entry-meta {
    display: flex;
    gap: 8px;
    margin-top: 2px;
    align-items: center;
    flex-wrap: wrap;
  }

  .entry-kind {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .entry-time {
    font-size: 10px;
    color: var(--text-muted);
  }
</style>
