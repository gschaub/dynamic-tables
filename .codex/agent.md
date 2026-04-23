# Dynamic Tables WordPress Plugin

## Project context

This repository contains the Dynamic Tables WordPress plugin.

It is a Gutenberg-native block plugin with:

- a React-based editor experience
- custom REST API endpoints
- custom database tables for core table data
- deployment to WordPress.org SVN via GitHub Actions

This plugin uses spreadsheet-style interactions in the editor, but it is not a spreadsheet application. Do not design or describe it as a spreadsheet product. Favor wording such as:

- spreadsheet-style interactions
- spreadsheet-like editing
- presentation-focused table builder
- responsive table blocks

Avoid wording that implies full spreadsheet functionality, formulas, or workbook-like behavior unless explicitly requested.

## Primary architecture expectations

- Respect the Gutenberg and WordPress data flow already in place.
- Prefer extending existing core-data, entity, REST, and editor patterns instead of introducing parallel state systems.
- Preserve the distinction between editor behavior, persisted entity data, and presentation output.
- Avoid architectural drift toward generic React-app patterns that do not fit WordPress/Gutenberg conventions.
- Be cautious with changes that affect serialization, persistence, syncing, or undo/redo behavior.

## Data and storage expectations

- Do not assume table data is stored primarily in post content.
- Be careful when proposing schema or persistence changes.
- Prefer minimal, targeted changes around existing data structures.
- Flag any change that could affect migrations, backward compatibility, or saved content behavior.

## Editing policy

- Never directly write or modify files without prior approval.
- Always present proposed code changes as diffs or patches first.
- Wait for confirmation before applying file edits.
- For multi-file changes, summarize scope and expected impact before showing diffs.
- Prefer narrow, reviewable changes over broad refactors.
- Do not mix unrelated cleanups into requested work.

## Review expectations

For meaningful code changes:

- identify which files are affected
- explain why each file needs to change
- call out behavioral impact
- call out editor-state, persistence, REST, build, or release impact where relevant
- note verification steps when practical

## High-risk areas

Do not modify these paths unless explicitly requested:

- `.github/workflows/`
- `.wordpress-org/`
- `.codex/`

Do not modify these files unless explicitly requested:

- `.distignore`
- `.gitattributes`

Treat changes in these areas as high risk:

- build tooling
- packaging
- release automation
- deployment logic
- WordPress.org asset/release flow

## WordPress and Gutenberg implementation guidance

- Prefer WordPress core conventions over custom abstractions unless there is a clear need.
- Prefer compatibility with `@wordpress/*` packages and existing plugin patterns.
- Avoid unnecessary new dependencies.
- Avoid introducing tooling changes unless required for the request.
- Keep changes aligned with likely WordPress plugin review expectations.

## UX and product guidance

- Preserve the distinction between navigation mode and editing mode.
- Favor keyboard-friendly, predictable editor interactions.
- Avoid suggestions that create misleading expectations about spreadsheet capabilities.
- Prefer practical UX improvements over novelty.
- When proposing feature wording, avoid marketing language that overpromises functionality.

## Performance guidance

- Be cautious with approaches that scale poorly for large row counts.
- Prefer batching, incremental loading, or targeted retrieval where appropriate.
- Consider both editor performance and front-end rendering impact.
- Avoid premature complexity, but flag obvious performance risks.

## Communication style for this repo

- Be concise.
- Do not over-explain obvious points.
- Surface tradeoffs clearly when they matter.
- State uncertainty plainly rather than overstating confidence.
- When proposing alternatives, distinguish recommendation from possibility.

## Verification guidance

When relevant, prefer suggesting checks such as:

- `npm run build`
- targeted linting
- editor behavior verification in Gutenberg
- REST/API behavior verification
- regression checks for persistence, selection, navigation, and formatting behavior

Do not run destructive or release-related commands unless explicitly requested.
