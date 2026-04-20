<script lang="ts">
  import type { NomEvent } from "../types";

  let { event }: { event: NomEvent } = $props();

  interface Countdown {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    passed: boolean;
    totalDays: number;
  }

  let countdown = $state<Countdown>({
    days: 0, hours: 0, minutes: 0, seconds: 0, passed: false, totalDays: 0,
  });

  function calculate() {
    const diff = new Date(event.target_date).getTime() - Date.now();
    if (diff <= 0) {
      countdown = { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true, totalDays: 0 };
      return;
    }
    const s = Math.floor(diff / 1000);
    countdown = {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
      passed: false,
      totalDays: Math.floor(s / 86400),
    };
  }

  $effect(() => {
    void event.target_date;
    calculate();
    const id = setInterval(calculate, 1000);
    return () => clearInterval(id);
  });

  function pad(n: number) {
    return String(n).padStart(2, "0");
  }

  const targetLabel = $derived(
    new Date(event.target_date).toLocaleDateString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    })
  );
</script>

<div class="countdown-wrap">
  {#if countdown.passed}
    <div class="passed">
      <span class="passed-label">Event passed</span>
      <p class="target-date">{targetLabel}</p>
    </div>
  {:else}
    <p class="target-date">{targetLabel}</p>

    <div class="units">
      <div class="unit">
        <span class="value">{countdown.days}</span>
        <span class="label">days</span>
      </div>
      <div class="sep">:</div>
      <div class="unit">
        <span class="value">{pad(countdown.hours)}</span>
        <span class="label">hours</span>
      </div>
      <div class="sep">:</div>
      <div class="unit">
        <span class="value">{pad(countdown.minutes)}</span>
        <span class="label">minutes</span>
      </div>
      <div class="sep">:</div>
      <div class="unit">
        <span class="value">{pad(countdown.seconds)}</span>
        <span class="label">seconds</span>
      </div>
    </div>

    {#if countdown.totalDays <= 7}
      <p class="urgency warning">Less than a week away</p>
    {:else if countdown.totalDays <= 30}
      <p class="urgency">~{Math.ceil(countdown.totalDays / 7)} weeks remaining</p>
    {:else}
      <p class="urgency">~{Math.ceil(countdown.totalDays / 30)} months remaining</p>
    {/if}
  {/if}
</div>

<style>
  .countdown-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    padding: 40px 0;
  }

  .target-date {
    font-size: 14px;
    color: var(--text-muted);
    letter-spacing: 0.04em;
  }

  .units {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }

  .unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .value {
    font-size: clamp(48px, 6vw, 80px);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .sep {
    font-size: 60px;
    font-weight: 200;
    color: var(--border-light);
    line-height: 1;
    padding-bottom: 24px;
  }

  .urgency {
    font-size: 13px;
    color: var(--text-secondary);
  }

  .urgency.warning {
    color: var(--warning);
    font-weight: 600;
  }

  .passed {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .passed-label {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-muted);
  }
</style>
