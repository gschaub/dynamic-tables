# React Patterns: Dynamic Tables Editor

This document explains the key React design patterns used in the
Dynamic Tables editor.

Codex should use this information when analyzing or modifying
the React codebase.

---

# Table Editor Overview

The React editor provides an Excel-like interface for editing
structured table data.

Major responsibilities include:

- rendering a grid layout
- editing cell content
- managing column types
- handling row/column operations
- synchronizing edits with the backend

The editor is designed to behave like a spreadsheet.

---

# Grid Rendering

The table grid is rendered using CSS Grid.

Characteristics:

- rows and columns are dynamically generated
- cell components are positioned via grid coordinates
- column widths and row heights may be calculated dynamically

The grid renderer should focus only on layout.

Business logic should remain outside layout components.

---

# Cell Component Pattern

Each cell is typically rendered by a React component that receives:

- table identifiers
- row identifier
- column identifier
- column data type
- current value

Cell components should be responsible for:

- rendering display value
- entering edit mode
- committing edits

---

# Editing Behavior

Editing follows a controlled workflow:

1. cell receives focus
2. editing component is activated
3. user modifies value
4. change is written to local state
5. state synchronizes with backend

Cells should not directly write to persistent storage.

---

# Column Data Types

Columns define how cell data behaves.

Typical types may include:

- general text
- numeric
- date
- time
- datetime
- select options

Column data types influence:

- editor UI
- validation
- formatting

Column configuration should be centralized.

---

# Local State Store

The editor maintains a local table representation.

Responsibilities:

- track rows and columns
- track cell values
- track editing state
- track dirty changes

Local state exists to support fast editing interactions.

Persistence occurs through API synchronization.

---

# Synchronization Pattern

Changes typically follow this flow:

React UI
→ local state store
→ REST API request
→ database update

The React layer should not access the database directly.

---

# Undo / Redo

Undo behavior may rely on the editor state layer.

Codex should inspect state update logic before proposing changes
that could affect undo/redo behavior.

---

# Component Responsibilities

Components should follow clear roles:

Layout components
Responsible for rendering structure.

Cell components
Responsible for displaying and editing values.

State/store modules
Responsible for managing table data.

Utility modules
Responsible for formatting, validation, and helpers.

---

# Avoid These Mistakes

When suggesting modifications, Codex should avoid:

- placing business logic in layout components
- bypassing the state store
- writing directly to the REST API from UI components
- duplicating formatting logic across components

---

# Debugging Guidelines

When investigating a UI issue:

1. identify the component rendering the element
2. inspect props passed to that component
3. inspect the state store interaction
4. confirm the data source

---

# Goal

Codex should use this document to reason about:

- component relationships
- editing workflow
- data flow between UI and backend

This helps ensure changes preserve the intended architecture.
