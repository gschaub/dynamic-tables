# Dynamic Tables development

This document describes the repository-local development environment. It is deliberately independent of any particular WordPress installation or workstation path.

## Requirements

- Git
- Node.js 22, as declared in `.nvmrc`
- npm
- PHP
- Composer
- A WordPress installation for runtime and integration testing

The repository does not need to reside under `wp-content`. A WordPress site can expose the checkout at `wp-content/plugins/dynamic-table-blocks` through a Windows directory junction or an equivalent link on another operating system.

## Provision a checkout

Run these commands from the checkout root:

```powershell
nvm use 22
npm ci
composer install
```

`node_modules` and `vendor` are ignored and are not shared between Git worktrees. Run both installation commands in every newly created worktree.

## JavaScript and CSS commands

```powershell
npm start
npm run build
npm run lint:js
npm run lint:css
npm run format
npm run plugin-zip
```

`npm start` is a long-running build watcher. Run it from the checkout currently connected to the WordPress site. Generated build files, including source maps, may change while it is running.

## PHP coding standards

Composer installs PHP_CodeSniffer, WordPress Coding Standards, and PHPCSUtils. This repository does not currently define Composer script aliases for linting.

On Windows, run PHPCS directly after `composer install`:

```powershell
vendor\bin\phpcs.bat --standard=phpcs.xml --extensions=php --ignore=vendor,node_modules .
```

Verify that the executable is available with:

```powershell
vendor\bin\phpcs.bat --version
```

## What works without WordPress

The following activities are checkout-local after dependencies are installed:

- Editing and Git operations
- JavaScript and CSS builds
- JavaScript and CSS linting
- Formatting
- PHP syntax and coding-standard checks
- Plugin ZIP creation

PHP coding-standard checks do not execute WordPress functions. JavaScript builds can process WordPress package imports, but WordPress supplies the corresponding runtime dependencies when the built scripts are enqueued.

## What requires WordPress

Connect the checkout to a WordPress installation before testing:

- Hooks and WordPress PHP APIs
- Block registration and the block editor
- Admin pages and Data Views
- REST API behavior
- Database reads and writes
- Permissions, capabilities, and lifecycle timing
- Frontend rendering

Running a plugin PHP file directly does not bootstrap WordPress and can produce undefined-function errors.

## Worktrees

Each worktree is a complete tracked checkout with its own current branch, working files, staging area, ignored dependencies, and generated files. Worktrees share the primary repository's Git object database and branch metadata.

Before creating worktrees, establish the primary repository at its permanent location. Do not move the primary repository afterward.

For simultaneous runtime testing, connect different Local sites to different worktrees. If one site is used for several branches, stop its build watcher and WordPress environment before changing its junction target.

## Runtime verification

After connecting a checkout to WordPress, verify at minimum:

1. WordPress recognizes the plugin at `dynamic-table-blocks/dynamic-table-blocks.php`.
2. The plugin remains activated.
3. The block editor loads without browser-console errors.
4. A table can be opened, changed, saved, and reloaded.
5. Frontend output renders correctly.
6. Relevant REST, admin, and database behavior works for the branch.

