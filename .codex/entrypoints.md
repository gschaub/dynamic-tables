# Project Entry Points

This file lists the primary entry points for code analysis.

Codex should begin dependency tracing from these locations.


## Gutenberg Block Entry

The block entry point initializes the Dynamic Table block and loads the React editor.

This is the starting point for most front-end code analysis.


## React Table Editor

The main React editor renders the spreadsheet-like interface.

It is responsible for:

- rendering the table grid
- managing editing interactions
- handling column types
- coordinating state updates


## React Component Graph

React components often import other components and utilities.

When analyzing behavior or proposing changes:

1. Start with the component being modified
2. Trace imports to dependent components
3. Identify shared utilities
4. Determine whether state flows through the store layer


## Store Layer

The store manages the table editing state.

Key responsibilities:

- local table representation
- change tracking
- synchronization with the REST API


## REST API Boundary

Persistent changes flow through REST endpoints implemented in the PHP backend.

The REST layer connects the React editor to the database.


## Deployment Entry Point

The GitHub Actions workflows define the deployment process.

When analyzing deployment behavior:

Start from:

.github/workflows/


## Important Rule for Analysis

When investigating issues, Codex should:

1. identify the relevant entry point
2. follow import chains
3. inspect dependent files
4. summarize data flow before proposing changes
