# Project Context: Dynamic Tables WordPress Plugin

## Overview

Dynamic Tables is a Gutenberg-native WordPress plugin that allows users to create and manage structured table data inside the block editor.

Unlike most table blocks, table data is **not stored in block HTML**. Instead it is stored in **custom database tables** and accessed through a **custom REST API**.

The block editor provides a **React-based spreadsheet-like interface** for editing the table.

The plugin includes:

- A Gutenberg block (`dynamic-table-blocks`)
- React editor UI
- Custom database tables
- Custom REST API endpoints
- GitHub Actions pipeline for publishing releases to WordPress.org SVN

---

# Architecture Overview

## Core Layers

The plugin consists of four main layers:

### 1. Gutenberg Block Layer

Provides the block interface within the WordPress editor.

Responsibilities:

- Block registration
- Rendering block wrapper
- Managing block attributes
- Connecting the block to the table data store
- Loading the React table editor

Important characteristics:

- Block HTML does **not contain the table data**
- The block references a stored table using a table identifier

---

### 2. React Table Editor

The React UI provides an Excel-like editing interface.

Key behaviors:

- Grid-based layout using CSS Grid
- Column and row manipulation
- Cell editing
- Data formatting by column type
- Local state store for editing operations

Important notes:

- The editor maintains **local state first**
- Changes are synchronized to the REST API
- Undo/redo behavior may be implemented at the state layer

React components frequently import other components and utilities across the `src\` directory.

---

### 3. Data Storage Layer

Table data is stored in **custom database tables**, not in post content.

This allows:

- large tables
- structured queries
- server-side filtering
- independent table reuse

Typical entities include:

- tables
- rows
- columns
- cells

Identifiers such as `table_id`, `row_id`, and `column_id` are used throughout the system.

---

### 4. REST Endpoints Are the Front-End Persistence Boundary

The plugin exposes custom REST endpoints used by the React editor.

Responsibilities include:

- retrieving table data
- updating cells
- modifying rows and columns
- persisting changes

Front-end editing operations ultimately pass through these endpoints.

---

# Key Development Principles

## Table Data Is Not Stored in Block HTML

The Gutenberg block stores a reference to a table.

The table data lives in the database and is retrieved dynamically.

---

## The React Editor Is the Source of UI Logic

The React editor manages:

- grid rendering
- editing interactions
- formatting
- column behaviors

Avoid duplicating UI logic elsewhere.

---

## REST Endpoints Are the Front-End Persistence Boundary

Front-end code should not bypass this layer to modify persistent data.

---

# Repository Structure

- `.codex/`
AI configuration and project context

- `.github/workflows/`
GitHub Actions CI/CD

- `.vscode/`
VS Code configuration

- `assets/`
Plugin assets for internal use

- `assets-wordpress-repository/`
Assets for WordPress SVN repository

- `build/`
Compiled JS and CSS for distribution

- `includes/`
PHP classes
REST endpoints
database management

- `languages/`
No translations currently exist

- `license/`
Third-party tool license files

- `src/`
WordPress Gutenberg/React source code

- `vendor/`
Composer dependencies

Paths may evolve over time.

---

# Build Process

The plugin uses a JavaScript build step.

Typical process:

1. Install dependencies
2. Run the build script
3. Compiled assets are output to `build/`

Only built assets should be included in distribution packages.

---

# Deployment Process

Publishing to WordPress.org is handled via **GitHub Actions**.

Workflow responsibilities:

1. build plugin assets
2. prepare a clean distribution package
3. deploy to WordPress.org SVN

Important details:

- `.distignore` controls which files are excluded from distribution
- `assets-wordpress-repository/` contains assets used by the WordPress.org plugin page
- these assets are deployed separately to the `/assets` directory in SVN

---

# Sensitive Files

Changes to the following files must be reviewed carefully:
- `.github/workflows/`
- `.distignore`
- `.gitattributes`

Errors in these files can cause incorrect plugin releases.

---

# Typical Development Tasks

Codex may assist with:

- tracing React component dependencies
- understanding data flow
- identifying unused code
- debugging build issues
- improving GitHub Actions workflows
- auditing deployment packaging

---

# Important Constraints

Codex should avoid:

- modifying deployment workflows without explanation
- modifying `.distignore` or packaging rules without explicit instruction
- executing shell commands unless explicitly requested

---

# Preferred Change Process

Before making edits:

1. identify impacted files
2. explain reasoning
3. show proposed diffs
4. wait for confirmation

---

# Goal of Codex Assistance

Codex should act as a **code analysis and proposal tool**, helping:

- trace dependencies
- analyze architecture
- propose safe improvements

It should not autonomously change repository structure or deployment processes.
