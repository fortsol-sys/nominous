<script lang="ts">
  import type { NomEvent } from "../types";
  import { app } from "../stores/app";

  let { event }: { event: NomEvent } = $props();

  const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const catColor = $derived(
    $app.settings?.categories.find((c) => c.name === event.category)?.color ?? "#6366f1"
  );

  const startDate = $derived(new Date(event.created_at));
  const endDate = $derived(new Date(event.target_date));

  function ymd(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  const startKey = $derived(ymd(startDate));
  const endKey = $derived(ymd(endDate));

  type Annotation = { kind: "stage" | "comment"; label: string };

  const annotations = $derived.by(() => {
    const map = new Map<string, Annotation[]>();
    function add(key: string, ann: Annotation) {
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ann);
    }
    for (const s of event.stages) {
      if (s.date) add(ymd(new Date(s.date)), { kind: "stage", label: s.title });
    }
    for (const e of event.log) {
      if (e.kind === "comment") add(ymd(new Date(e.timestamp)), { kind: "comment", label: e.content });
    }
    return map;
  });

  const months = $derived.by(() => {
    const result: { year: number; month: number }[] = [];
    let y = startDate.getFullYear();
    let m = startDate.getMonth();
    const ey = endDate.getFullYear();
    const em = endDate.getMonth();
    let count = 0;
    while ((y < ey || (y === ey && m <= em)) && count < 24) {
      result.push({ year: y, month: m });
      m++;
      if (m > 11) { m = 0; y++; }
      count++;
    }
    return result;
  });

  function buildCells(year: number, month: number): (number | null)[] {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  function cellKey(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
</script>

<div class="cal-wrap">
  <div class="cal-months">
    {#each months as { year, month }}
      {@const cells = buildCells(year, month)}
      <div class="month-block">
        <div class="month-title">{MONTH_NAMES[month]} {year}</div>
        <div class="weekday-row">
          {#each WEEKDAYS as wd}<div class="wday">{wd}</div>{/each}
        </div>
        <div class="day-grid">
          {#each cells as day}
            {#if day === null}
              <div class="day-cell empty"></div>
            {:else}
              {@const key = cellKey(year, month, day)}
              {@const isStart = key === startKey}
              {@const isEnd = key === endKey}
              {@const anns = annotations.get(key) ?? []}
              {@const hasStage = anns.some((a) => a.kind === "stage")}
              {@const hasComment = anns.some((a) => a.kind === "comment")}
              {@const tipText = anns.map((a) => a.label).join(" · ")}
              <div
                class="day-cell"
                class:is-start={isStart}
                class:is-end={isEnd}
                title={tipText || undefined}
                style={isEnd
                  ? `background:${catColor}33;`
                  : isStart
                  ? "background:rgba(161,161,170,0.18);"
                  : ""}
              >
                <span
                  class="day-num"
                  style={isEnd
                    ? `color:${catColor};font-weight:700`
                    : isStart
                    ? "color:var(--text-secondary);font-weight:600"
                    : ""}
                >{day}</span>
                {#if hasStage || hasComment}
                  <div class="day-dots">
                    {#if hasStage}
                      <div class="ann-dot" style="background:{catColor}"></div>
                    {/if}
                    {#if hasComment}
                      <div class="ann-dot" style="background:var(--text-muted)"></div>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <div class="cal-legend">
    <div class="legend-item">
      <div class="legend-swatch" style="background:rgba(161,161,170,0.18);border:1px solid rgba(161,161,170,0.35)"></div>
      <span>Start</span>
    </div>
    <div class="legend-item">
      <div class="legend-swatch" style="background:{catColor}33;border:1px solid {catColor}66"></div>
      <span>Target date</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background:{catColor}"></div>
      <span>Stage</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background:var(--text-muted)"></div>
      <span>Comment</span>
    </div>
  </div>
</div>

<style>
  .cal-wrap {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .cal-months {
    display: flex;
    flex-wrap: wrap;
    gap: 32px 40px;
  }

  .month-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .month-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .weekday-row {
    display: grid;
    grid-template-columns: repeat(7, 30px);
    gap: 2px;
  }

  .wday {
    font-size: 10px;
    color: var(--text-muted);
    text-align: center;
    font-weight: 500;
    padding: 2px 0;
  }

  .day-grid {
    display: grid;
    grid-template-columns: repeat(7, 30px);
    gap: 2px;
  }

  .day-cell {
    width: 30px;
    height: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    position: relative;
    cursor: default;
  }

  .day-cell.empty {
    pointer-events: none;
  }

  .day-num {
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1;
  }

  .day-dots {
    display: flex;
    gap: 2px;
    margin-top: 2px;
  }

  .ann-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
  }

  .cal-legend {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-muted);
  }

  .legend-swatch {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>
