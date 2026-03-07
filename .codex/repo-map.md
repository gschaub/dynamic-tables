# Repository Map

This document helps Codex navigate the Dynamic Tables repository efficiently.

Only the most important directories and entry points are listed here.


## Primary Source Code

src/

Contains the JavaScript and React code used in the Gutenberg editor.

Important areas include:

- components/
  Reusable React components used by the table editor.

- edit/
  The main block editor interface.

- store/
  Local state management used by the table editor.

- utilities/
  Helper functions and shared logic.


## Build Output

build/

Compiled JavaScript and CSS produced by the build process.

These files are included in plugin distribution but should not be edited directly.


## PHP Backend

includes/

Contains server-side logic for the plugin.

Important responsibilities include:

- registering REST endpoints
- database access
- plugin initialization
- admin integration


## WordPress Block Registration

The Gutenberg block is registered in the plugin bootstrap code.

The block loads the React editor that renders the table UI.


## CI/CD

.github/workflows/

Contains GitHub Actions workflows used for:

- building plugin assets
- packaging the plugin
- publishing releases to WordPress.org SVN


## WordPress.org Assets

.wordpress-org/

Contains plugin directory assets such as:

- banner images
- icons
- screenshots

These are deployed to the SVN `/assets` directory and should not be included in the plugin package.


## Distribution Controls

.distignore

Controls which files are excluded from WordPress.org plugin packages.


## Codex Configuration

.codex/

Contains configuration and project context used by Codex.
