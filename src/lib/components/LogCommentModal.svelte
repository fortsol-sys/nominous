<script lang="ts">
  import { app } from "../stores/app";

  let comment = $state("");

  async function submit() {
    if (!$app.selectedEvent || !comment.trim()) return;
    const updated = {
      ...$app.selectedEvent,
      log: [
        ...$app.selectedEvent.log,
        {
          timestamp: new Date().toISOString(),
          kind: "comment" as const,
          content: comment.trim(),
        },
      ],
    };
    await app.saveEvent(updated);
    comment = "";
    app.closeCommentModal();
  }
</script>

<div class="overlay" role="dialog" aria-modal="true">
  <div class="modal">
    <header class="modal-header">
      <h2>Add Comment</h2>
      <button class="btn-ghost icon-btn" onclick={() => app.closeCommentModal()}>✕</button>
    </header>

    <div class="modal-body">
      <label for="comment-text">Comment</label>
      <textarea
        id="comment-text"
        bind:value={comment}
        rows="4"
        placeholder="What's on your mind about this event?"
        onkeydown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
      ></textarea>
      <p class="hint">Ctrl+Enter to submit</p>
    </div>

    <footer class="modal-footer">
      <button class="btn btn-ghost" onclick={() => app.closeCommentModal()}>Cancel</button>
      <button class="btn btn-primary" onclick={submit} disabled={!comment.trim()}>
        Add Comment
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
  }

  .modal {
    background: var(--surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    width: 440px;
    max-width: calc(100vw - 40px);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }

  .modal-header h2 { font-size: 15px; font-weight: 600; }

  .icon-btn {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-muted); font-size: 14px;
  }

  .modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  textarea { resize: vertical; min-height: 100px; }
  .hint { font-size: 11px; color: var(--text-muted); }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
  }

  button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
