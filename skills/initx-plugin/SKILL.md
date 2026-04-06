---
name: initx-plugin
description: 'Use when: creating or maintaining initx plugins, checking the standard package.json template, and locating core/store/cli/utils capabilities through source paths.'
metadata:
  author: initx
  version: "1.0.0"
---

# initx Plugin Development Skill

## Overview

initx is a script engine extended via plugins. Plugin package names must match:
- initx-plugin-<name>
- @initx-plugin/<name>

core automatically scans and loads packages that match these naming rules.

---

## Plugin Package Setup

### Standard package.json template

```json
{
  "name": "initx-plugin-<name>",
  "type": "module",
  "version": "0.0.1",
  "description": "...",
  "main": "dist/index.mjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "keywords": ["initx", "initx-plugin"],
  "peerDependencies": {
    "@initx-plugin/core": "*",
    "@initx-plugin/utils": "*"
  },
  "devDependencies": {
    "@initx-plugin/core": "^0.x.x",
    "@initx-plugin/utils": "^0.x.x",
    "unbuild": "^3.x.x",
    "typescript": "^5.x.x"
  },
  "scripts": {
    "stub": "unbuild --stub",
    "build": "unbuild",
    "release": "bumpp"
  }
}
```

Key points:
- @initx-plugin/core and @initx-plugin/utils must be in peerDependencies.
- main/module must point to dist/index.mjs.
- type must be module.

---

## Minimal References

### Build and config

- build config reference: packages/core/build.config.ts
- tsconfig reference: tsconfig.json
- monorepo/pnpm config reference: pnpm-workspace.yaml

### Core API references

- public exports entry: packages/core/src/index.ts
- core type definitions: packages/core/src/types.ts
- plugin abstract base class: packages/core/src/plugin/abstract.ts
- plugin loading and matching: packages/core/src/plugin/manager.ts
- plugin system capabilities: packages/core/src/plugin/system.ts
- rule utility functions: packages/core/src/plugin/utils.ts

### Store references

- store implementation: packages/core/src/store.ts
- default directory constants: packages/core/src/constants.ts

### CLI flow references

- CLI entry: packages/cli/src/cli.ts
- CLI executable: packages/cli/bin/initx.mjs

### Utils API references

- utils exports entry: packages/utils/src/index.ts
- logger: packages/utils/src/log.ts
- command execution: packages/utils/src/executor.ts
- terminal prompts: packages/utils/src/inquirer.ts
- gpg support: packages/utils/src/gpg/index.ts
- type definitions: packages/utils/src/types.ts

---

## Conventions

- Use default export class for the plugin entry.
- Prefer shared dependencies from @initx-plugin/core and @initx-plugin/utils.
- Split complex logic into separate handler files and dispatch from the entry.

---

## Development Workflow

- Install dependencies: pnpm install
- Dev build: pnpm stub
- Production build: pnpm build
- Local CLI debug: pnpm initx <command>
- Release version: pnpm release
