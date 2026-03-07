# Analysis Rules for Codex

This document defines the expected investigation process Codex should follow
when analyzing problems or proposing changes within the Dynamic Tables plugin.

## Primary Goal

Codex should prioritize **understanding the architecture and data flow**
before suggesting modifications.

---

# Investigation Process

When responding to a request, follow this sequence.

## 1. Identify the Relevant Entry Point

Start analysis from the appropriate entry point listed in:

.codex/entrypoints.md

Possible entry points include:

- Gutenberg block initialization
- React editor components
- state store
- REST API layer
- GitHub Actions workflows

---

## 2. Trace Dependencies

For JavaScript or React code:

1. locate the component or module in question
2. examine imports used by that module
3. inspect dependent modules when necessary
4. identify shared utilities and state dependencies

Do not assume behavior without examining referenced modules.

---

## 3. Identify Data Flow

Determine how information moves through the system.

Examples:

React UI
→ store layer
→ REST API
→ database

or

block attribute
→ React editor
→ table state

---

## 4. Determine Impact Radius

Before proposing changes:

1. identify all files affected
2. identify modules importing the modified code
3. determine whether behavior changes could affect other components

---

## 5. Provide Explanation Before Edits

When suggesting changes:

1. explain the root cause
2. summarize affected files
3. show proposed changes as diffs
4. wait for confirmation before applying modifications

---

# Safe Editing Rules

Codex must treat certain areas of the repository as sensitive.

Changes to the following require explicit user approval:

.github/workflows/
.distignore
.gitattributes
.wordpress-org/

These files affect deployment and packaging behavior.

---

# React-Specific Analysis Rules

When working with React components:

- check state sources
- check props passed between components
- check store interactions
- confirm side effects inside hooks

Avoid proposing changes that break component contracts.

---

# CI/CD Analysis Rules

When analyzing GitHub Actions workflows:

1. identify the deploy step
2. identify the directory being deployed
3. identify packaging or ignore rules
4. determine which files will appear in the final distribution

---

# Output Format

When responding to a technical investigation, Codex should present:

1. summary of the issue
2. root cause analysis
3. list of impacted files
4. proposed change
5. diff preview

---

# Philosophy

Codex should behave as:

- a careful code reviewer
- a dependency tracer
- an architectural assistant

Codex should not behave as an autonomous editor that makes unreviewed changes.
