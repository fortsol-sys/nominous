<script lang="ts">
  import { app } from "../stores/app";
  import EventCard from "./EventCard.svelte";

  let collapsed = $state(false);
  let search = $state("");

  const filtered = $derived(
    $app.events.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase())
    )
  );
</script>

<aside class="sidebar" class:collapsed>
  <!-- Collapse toggle — always visible -->
  <button
    class="collapse-btn"
    onclick={() => (collapsed = !collapsed)}
    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
  >
    <span class="collapse-icon" class:rotated={collapsed}>‹</span>
  </button>

  <div class="sidebar-inner">
    <div class="sidebar-header">
      <span class="app-title">Nominous</span>
      <div class="header-actions">
        <button
          class="btn-ghost icon-btn"
          title={$app.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onclick={() => app.toggleTheme()}
        >
          {$app.theme === "dark" ? "☀" : "☾"}
        </button>
        <button
          class="btn-ghost icon-btn"
          title="Settings"
          onclick={() => app.openSettings()}
        >
          ⚙
        </button>
      </div>
    </div>

    <div class="search-wrap">
      <input
        type="search"
        placeholder="Search events…"
        bind:value={search}
      />
    </div>

    <div class="event-list">
      {#each filtered as event (event.id)}
        <EventCard
          {event}
          selected={$app.selectedEvent?.id === event.id}
          onclick={() => app.selectEvent(event)}
        />
      {:else}
        <p class="empty">No events yet.</p>
      {/each}
    </div>

    <div class="sidebar-footer">
      <button class="btn btn-primary add-btn" onclick={() => app.openAdd()}>
        + New Event
      </button>
    </div>
  </div>
</aside>

<style>
  .sidebar {
    position: relative;
    width: 280px;
    min-width: 280px;
    display: flex;
    flex-direction: row;
    background: var(--surface);
    border-right: 1px solid var(--border);
    transition: width 0.22s ease, min-width 0.22s ease;
    overflow: hidden;
  }

  .sidebar.collapsed {
    width: 28px;
    min-width: 28px;
  }

  /* The narrow strip housing the toggle button */
  .collapse-btn {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-hover);
    color: var(--text-secondary);
    border-left: 2px solid var(--border-light);
    border-radius: 0;
    z-index: 2;
    flex-shrink: 0;
    transition: color 0.15s, background 0.15s, border-color 0.15s;
  }

  .collapse-btn:hover {
    color: var(--text-primary);
    background: var(--surface-active);
    border-left-color: var(--accent);
  }

  .collapse-icon {
    font-size: 18px;
    line-height: 1;
    font-weight: 700;
    transition: transform 0.22s ease;
    display: block;
  }

  .collapse-icon.rotated {
    transform: rotate(180deg);
  }

  /* All sidebar content sits to the left of the toggle strip */
  .sidebar-inner {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    /* leave 28px on the right for the toggle button */
    margin-right: 28px;
    overflow: hidden;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 12px 10px;
    border-bottom: 1px solid var(--border);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .app-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .icon-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    border-radius: var(--radius-sm);
  }

  .search-wrap {
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
  }

  .search-wrap input {
    font-size: 13px;
  }

  .event-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .empty {
    color: var(--text-muted);
    font-size: 13px;
    text-align: center;
    padding: 32px 0;
  }

  .sidebar-footer {
    padding: 12px;
    border-top: 1px solid var(--border);
  }

  .add-btn {
    width: 100%;
    justify-content: center;
    padding: 8px 14px;
    font-size: 13px;
  }
</style>
