# MFWB Gardens WordPress Plugin

## Project status

This repository contains a new WordPress plugin for gardens. The product architecture and garden data model have not been selected yet.

- Keep the initial implementation PHP-first.
- Do not introduce React, Gutenberg block tooling, Node dependencies, custom database tables, or a release pipeline unless the user explicitly requests them.
- Do not infer product behavior from the Dynamic Tables plugin; it is a tooling reference, not an architecture template.

## Development standards

- Follow WordPress coding conventions and the repository `phpcs.xml` ruleset.
- Use the `MFWB\Gardens` namespace for future PHP code unless the user chooses another namespace.
- Use `mfwb-gardens` as the plugin slug and text domain.
- Preserve LF line endings.
- Prefer narrow, reviewable changes and avoid unrelated cleanup.
- Do not edit generated dependencies under `vendor/`.

## Patch-only workflow

- Treat all requested code changes as proposals only unless I explicitly say `APPLY CHANGES`.
- Do not create, edit, delete, rename, format, or otherwise modify repository files.
- Do not run commands that could modify repository files.
- For existing files, show proposed changes as unified diffs.
- For new files, show a diff-style header identifying the new path, followed by the complete proposed contents without leading `+` characters.

## Verification

Install development dependencies with:

```text
composer install
```

Run PHP coding-standard checks with:

```text
composer lint
```

Apply automatically fixable coding-standard changes with:

```text
composer lint:fix
```

When PHP behavior is added, supplement linting with focused functional or unit verification appropriate to the change.

## Sensitive configuration

Treat these paths as high risk and change them only when the request requires it:

- `.github/workflows/`
- `.codex/`
- `.distignore`
- `.gitattributes`
- release and WordPress.org deployment configuration

Do not run destructive, release, publishing, or deployment commands unless explicitly requested.
