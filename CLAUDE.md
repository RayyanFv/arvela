# Arvela Project Rules

This document outlines the development guidelines, commands, and architecture map for the Arvela project.

## Development Commands

- Run development server: `pnpm dev` or `npm run dev`
- Build production package: `pnpm build` or `npm run build`
- Run migrations: `node scripts/execute_migrations.js`
- Reset and seed database: `node scripts/reset_and_seed.js`

> [!CAUTION]
> **Supabase MCP Production Environment**:
> The workspace is connected directly to the **production database** via Supabase MCP.
> 1. **DO NOT** run destructive commands (like database resets or seed resets) without explicit confirmation, as it will wipe production data.
> 2. **Migrations must be applied at the very end** of the feature implementation cycle after total verification has been conducted.
> 3. Verify all RLS (Row Level Security) and constraint changes thoroughly before merging or executing.

## Graphify Architecture & Navigation

To avoid reading all code files from scratch and to keep the codebase architecture clear, always follow these rules:

1. **Read the Knowledge Graph First**: Refer to `graphify-out/GRAPH_REPORT.md` to understand community structures, core modules (God Nodes), and relationships between components.
2. **Perform Graph Queries**: Use the pre-built graph database `graphify-out/graph.json` or use `graphify` query commands in the terminal (e.g., `graphify query "<your question>"` or `graphify explain "<module_name>"`) to trace data flow instead of performing recursive grep searches.
3. **Keep the Graph Up to Date**: Whenever you write or modify core code components, run the local Python automation script to regenerate the graph:
   ```bash
   python scripts/run_graphify.py
   ```
4. **Interactive Visualization**: Open `public/trace.html` in a web browser to view the interactive node link representation of the codebase.
