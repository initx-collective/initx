# GENERATION

## Goal

Generate a minimal plugin scaffold that can be published and recognized by initx.

## Output Structure

- package.json
- build.config.ts
- tsconfig.json
- src/index.ts
- README.md
- LICENSE

## Hard Requirements

- Package name must match: initx-plugin-<name> or @initx-plugin/<name>
- package.json must include:
  - type: module
  - main/module: dist/index.mjs
  - types: dist/index.d.ts
  - files: ["dist"]
  - peerDependencies: @initx-plugin/core, @initx-plugin/utils
- Entry must use default export class (plugin class)

## Content Policy

- Do not generate large boilerplate blocks except for package.json.
- Keep type declarations and advanced examples minimal by default.
- Prefer reference paths over duplicated implementation snippets.

## Reference Paths

- Skill main document: skills/initx-plugin/SKILL.md
- core entry: packages/core/src/index.ts
- plugin abstract class: packages/core/src/plugin/abstract.ts
- type definitions: packages/core/src/types.ts
- plugin manager: packages/core/src/plugin/manager.ts
- store: packages/core/src/store.ts
- utils entry: packages/utils/src/index.ts
- CLI entry: packages/cli/src/cli.ts

## Suggested Generation Steps

1. Define the plugin name and command matching rules.
2. Write package.json first (strictly follow the SKILL.md template).
3. Add a minimal src/index.ts (runnable baseline only).
4. Add README usage and example commands.

## Validation Checklist

- `pnpm install`
- `pnpm stub` or `pnpm build`
- `pnpm initx <command>` to verify the command can be triggered locally
