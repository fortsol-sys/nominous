# Nominous

A minimalist desktop app for counting down to the goals and events that matter. Built with Tauri 2 + Svelte 5.

![Dark mode](Meta/screenshots/dark.png)

## Features

- **Countdown timers** — live days/hours/minutes/seconds view for each event
- **Timeline view** — visual progress bar from event creation to target date with stage and comment markers
- **Stages** — add milestones to any event and mark them complete
- **Activity log** — searchable, filterable history of all comments and stage updates across every event
- **Quick comments** — log a note against any event in one keystroke
- **Notifications** — configurable OS notifications (7d / 3d / 1d / 12h / 1h before, and on stage completion)
- **Categories & Priorities** — fully configurable, each with a custom colour
- **Dark / Light mode** — toggle in the sidebar header, persisted across sessions
- **Collapsible sidebar** — collapse the event list to keep just the countdown on screen
- **Data stored locally** — events saved as Markdown files with YAML front-matter; nothing leaves your machine

---

## Prerequisites

| Dependency | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18 + | LTS recommended |
| [Rust](https://rustup.rs/) | stable | via `rustup` |
| [Tauri system deps](https://tauri.app/start/prerequisites/) | — | platform-specific, see below |

### Linux (Debian / Ubuntu)

```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

For other distros, consult the [Tauri prerequisites page](https://tauri.app/start/prerequisites/).

### macOS

Install Xcode Command Line Tools:

```bash
xcode-select --install
```

### Windows

Install the [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (select the "Desktop development with C++" workload), then install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) if it isn't already present (it ships with Windows 11 by default).

---

## Install & Run

```bash
# 1. Clone
git clone https://github.com/fortsol-sys/nominous.git
cd nominous

# 2. Install JS dependencies
npm install

# 3. Development (hot-reload)
npm run tauri dev

# 4. Production build
npm run tauri build
```

The production binary and installer are placed in `src-tauri/target/release/bundle/`.

| Platform | Output formats |
|---|---|
| Linux | `.deb`, `.rpm`, `AppImage` |
| macOS | `.dmg`, `.app` |
| Windows | `.msi`, NSIS installer |

---

## Project Structure

```
nominous/
├── src/                        # Svelte frontend
│   ├── App.svelte              # Root layout, theme, modals
│   ├── app.css                 # Global CSS variables (dark + light themes)
│   └── lib/
│       ├── components/
│       │   ├── EventList.svelte        # Collapsible sidebar
│       │   ├── EventCard.svelte        # Sidebar event row
│       │   ├── RightPanel.svelte       # Main area (countdown / timeline)
│       │   ├── CountdownView.svelte    # Live ticking countdown
│       │   ├── TimelineView.svelte     # Visual timeline with stages
│       │   ├── AddEventModal.svelte    # Create / edit event
│       │   ├── LogCommentModal.svelte  # Quick comment entry
│       │   ├── SettingsPanel.svelte    # Categories, priorities, activity log link
│       │   └── LogsPanel.svelte        # Aggregated activity log
│       ├── stores/
│       │   └── app.ts          # Svelte writable store — global app state
│       └── types.ts            # Shared TypeScript types
├── src-tauri/                  # Rust / Tauri backend
│   ├── src/
│   │   ├── lib.rs              # Plugin registration, command handler list
│   │   ├── commands.rs         # IPC commands (CRUD events, settings, notifications)
│   │   └── models.rs           # Serde structs (Event, Stage, LogEntry, Settings…)
│   ├── capabilities/
│   │   └── default.json        # Tauri 2 capability grants
│   └── tauri.conf.json         # App metadata, window config, CSP
├── Meta/
│   └── Spec.md                 # Original product specification
├── package.json
└── vite.config.ts
```

---

## Data Storage

Events are stored as individual Markdown files under the platform app-data directory:

| Platform | Path |
|---|---|
| Linux | `~/.local/share/com.nominous.app/events/` |
| macOS | `~/Library/Application Support/com.nominous.app/events/` |
| Windows | `%APPDATA%\com.nominous.app\events\` |

Each file uses YAML front-matter:

```markdown
---
id: "uuid-v4"
name: "Launch v1.0"
target_date: "2025-12-31T09:00:00"
category: "Work"
priority: "High"
stages:
  - id: "..."
    title: "Write tests"
    completed: false
log:
  - timestamp: "2025-06-01T10:30:00Z"
    kind: "comment"
    content: "Kicked off the sprint."
---

Optional freeform notes go here.
```

Settings (categories, priorities, notification defaults) are stored in `settings.json` in the same app-data directory.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | [Svelte 5](https://svelte.dev/) + TypeScript |
| Build tool | [Vite 6](https://vitejs.dev/) |
| Desktop shell | [Tauri 2](https://tauri.app/) |
| Backend language | Rust (stable) |
| Serialisation | `serde` + `serde_yaml` + `serde_json` |
| IDs | `uuid v4` |
| Date/time | `chrono` |
| Notifications | `tauri-plugin-notification` |

---

## Contributing

Pull requests are welcome. Please open an issue first for anything beyond a small bug fix.

---

## License

MIT
