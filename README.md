<div align="center">

# Claude Run

A native desktop app for browsing your Claude Code conversation history

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

<img src=".github/claude-run.gif" alt="Claude Run Demo" width="800" />

</div>

<br />

## Features

- **Real-time streaming** - Watch conversations update live as Claude responds
- **Search** - Find sessions by prompt text or project name
- **Filter by project** - Focus on specific projects
- **Export conversations** - HTML (with themes), Markdown, JSON, and plain text
- **Resume sessions** - Copy the resume command to continue any conversation in your terminal
- **Hide/show tools** - Toggle tool call visibility for cleaner reading
- **Collapsible sidebar** - Maximize your viewing area
- **Dark mode** - Easy on the eyes
- **Clean UI** - Familiar chat interface with collapsible tool calls

## Install

Download the latest release from the [Releases](https://github.com/mdeloughry/claude-run/releases) page.

## How It Works

Claude Code stores conversation history in `~/.claude/`. Claude Run reads that data and presents it in a native desktop interface with:

- **Session list** - All your conversations, sorted by recency
- **Project filter** - Focus on a specific project
- **Conversation view** - Full message history with tool calls
- **Live updates** - File watcher detects changes and updates the UI automatically
- **Export** - Save conversations in multiple formats with theme options

## Requirements

- macOS (Apple Silicon or Intel)
- Claude Code installed and used at least once

## Development

Built with [Tauri v2](https://v2.tauri.app/) (Rust backend + React frontend).

```bash
# Clone the repo
git clone https://github.com/mdeloughry/claude-run.git
cd claude-run

# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build
```

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- Node.js 20+

## License

MIT
