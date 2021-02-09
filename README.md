# Rive Workspace Example
This repository is an example of how could a rive monorepo looks like.

| Name                                     | Version       
| -----------------------------------------| :------------------:
| [rive-canvas](./packages/canvas/README.md) | [![badge](https://img.shields.io/npm/v/rive-canvas/latest.svg?style=flat-square)](https://www.npmjs.com/package/rive-canvas)
| [rive-js](./packages/js/README.md)       | [![badge](https://img.shields.io/npm/v/rive-js/latest.svg?style=flat-square)](https://www.npmjs.com/package/rive-js)

## Setup

1. Scaffold the app: 
```
npx create-nx-workspace rive
> oss
> no
cd rive
```

2. Add `@nrwl/node` plugin for generating libs: 
```
npm install -D @nrwl/node
```

3. Generate both libs: 
```
npx nx generate @nrwl/node:library --name=canvas --importPath=rive-canvas --buildable --publishable --strict
npx nx generate @nrwl/node:library --name=js --importPath=rive-js --buildable --publishable --strict
```

4. Export ES6 modules: 

In both [`packages/${lib}/tsconfig.lib.json`](./packages/canvas/tsconfig.lib.json#L4) change `"module": "commonjs"` to `"module": "ES6"`.

To understand why, checkout the article [commonjs larger bundles](https://web.dev/commonjs-larger-bundles/).

5. Build: 
```
npm run affected:build
```
Affected build will only build libs that have been changed since last run (works also for test & lint).

Output is on the `dist/packages` folder.

## Dependency
The advantage of this workspace is the dependancy graph.
To demonstrate that let's import `rive-canvas` inside `rive-js`. In `packages/js/src/lib/js.ts` import `rive-canvas`: 
```typescript
import { canvas } from 'rive-canvas';
export function js(): string {
  return canvas();
}
```

Run `npm affected:build` and check `dist/packages/js/package.json`: `rive-canvas` is now automatically dependency of `rive-js`. No duplication of code ;).

To see dependency graph run : 
```
npm run dep-graph
```

## Customize config
If you want to customize the config (build, test) or add new command, you can modify the `workspace.json` file.

For example let's add a `publish` script that would deploy both lib at the same time to `npm`

`workspace.json`: Under `projects/canvas/target` add:
```json
"publish": {
  "builder": "@nrwl/workspace:run-commands",
  "options": {
    "commands": ["npm publish --tag={tag}"],
    "cwd": "dist/packages/canvas"
  }
}
```
Do the same for [`projects/js/target`](./workspace.json#L9) (modify "cwd" accordingly).


And in package.json add [the scripts](./package.json#L12): 
```
"publish:latest": "nx run-many --target=publish --access=public --all --tag=latest",
"publish:next": "nx run-many --target=publish --access=public --all --tag=next"
```

Now you can run `npm run publish:latest` and it'll publish both libs on npm.
