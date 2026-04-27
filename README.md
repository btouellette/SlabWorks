# SlabWorks

## Overview
SlabWorks is a web application for woodworkers to upload images of wood slabs, specify their dimensions, and simulate cuts against a target area before making physical cuts.

## Tech Stack
- TypeScript + Webpack
- Konva.js (canvas manipulation)
- localforage (IndexedDB persistence)
- Tailwind CSS

## Dev Setup
```
yarn install
yarn start    # webpack-dev-server at http://localhost:8080
yarn build    # production build to dist/
```

## Current State
- Image upload reads file, creates a `Slab`, saves to IndexedDB shelf via localforage
- Shelf thumbnails render in the right sidebar
- Konva stage + layer initialized; canvas is otherwise empty
- All types defined in `src/scripts/types.ts`

---

## Execution Slices

Each slice is a self-contained unit of work. Slices are ordered by dependency — complete them in order. The primary verification for every slice is `yarn build` with zero TypeScript errors. Functional acceptance criteria are listed per slice.

Slices do not add comments explaining what the code does. Comments are only added when the *why* is non-obvious.

**Environment note:** The dev server is served over plain HTTP on a LAN address (not localhost), so `crypto.randomUUID()` is unavailable (requires secure context). Use `generateId()` from `src/scripts/utils.ts` instead, which uses `crypto.getRandomValues()` — available in all contexts.

---

### Slice 1: Place Slab on Canvas from Shelf

**Goal:** Clicking a shelf thumbnail loads that slab as a draggable `Konva.Image` centered on the canvas.

**Files to touch:** `src/scripts/types.ts`, `src/scripts/imageUpload.ts`, `src/scripts/app.ts`

**Tasks:**
- Add `id: string` to `ShelvedSlab`; generate it with `crypto.randomUUID()` in `handleImageUpload` before calling `saveSlab`
- In `displayShelf` in `app.ts`, make each thumbnail `<img>` clickable
- On thumbnail click: create a `Konva.Image` from the slab's `dataUrl`, set `draggable: true`, center it on the stage (x = stageWidth/2 - imageWidth/2, y = stageHeight/2 - imageHeight/2), add to layer
- Track placed slabs in a `Map<string, Konva.Image>` keyed by slab id; prevent placing the same slab twice
- Add a CSS class to thumbnail `<img>` when its slab is on canvas (e.g. `ring-2 ring-indigo-500`); remove it when the slab is removed

**Acceptance:** Upload an image → click its thumbnail → it appears centered on the canvas → drag it around freely.

---

### Slice 2: Target Area Definition

**Goal:** A dashed target rectangle is always visible on the canvas. Users set its dimensions in the sidebar.

**Files to touch:** `src/scripts/targetArea.ts` (new), `src/scripts/app.ts`, `src/index.html`

**Tasks:**
- Create `src/scripts/targetArea.ts` exporting `drawTargetArea(layer: Konva.Layer, width: number, height: number, shape: 'rectangle' | 'ellipse'): Konva.Rect | Konva.Ellipse`
  - For rectangle: `Konva.Rect` with dashed stroke (`dash: [10, 5]`), no fill, centered on stage, `listening: false`, `id: 'target-area'`
  - For ellipse: `Konva.Ellipse` with same styling, `radiusX: width/2`, `radiusY: height/2`
  - Destroy any existing node with `id: 'target-area'` before drawing
- In `index.html`, add two `<input type="number">` fields (`target-width`, `target-height`, defaults 24 and 48) and a `<select>` (`target-shape`: rectangle/ellipse) in the sidebar above the shelf thumbnails
- In `app.ts`, call `drawTargetArea` on `DOMContentLoaded` and on any input change; store the current `TargetArea` value in app state
- Target area node must always render above slab nodes — add it to a separate `Konva.Layer` on top, or call `targetNode.moveToTop()` after every draw

**Acceptance:** A dashed rectangle appears on load. Changing width/height inputs resizes it in real time. Switching to ellipse changes the shape.

---

### Slice 3: Slab Rotation via Mouse Wheel

**Goal:** Scrolling over a placed slab rotates it in place. Holding Shift snaps to 45° increments.

**Files to touch:** `src/scripts/slabControls.ts` (new), `src/scripts/app.ts`

**Tasks:**
- Create `src/scripts/slabControls.ts` exporting `attachRotationHandler(image: Konva.Image, layer: Konva.Layer): void`
  - Listen for the `wheel` event on the node
  - Rotate by `evt.evt.deltaY * 0.3` degrees about the node's center
  - When `evt.evt.shiftKey`, snap resulting rotation to nearest 45°
  - Call `layer.batchDraw()` after each rotation
- In `app.ts`, call `attachRotationHandler(konvaImage, layer)` immediately after placing each slab on canvas

**Acceptance:** Place a slab → scroll over it → it rotates. Hold Shift while scrolling → rotation snaps to 45° steps.

---

### Slice 4: Slab Selection and Deletion

**Goal:** Clicking a slab selects it (shows `Konva.Transformer` handles). Delete/Backspace removes it from canvas.

**Files to touch:** `src/scripts/app.ts`

**Tasks:**
- Instantiate a single `Konva.Transformer` on the layer at startup; keep a `selectedSlabId: string | null` in app state
- On slab `click` event: set `selectedSlabId` to the slab's id, attach transformer to the node (`transformer.nodes([node])`)
- On stage background `click` (when `evt.target === stage`): clear selection, detach transformer (`transformer.nodes([])`)
- On `document` `keydown` for `Delete` or `Backspace`: if `selectedSlabId` is set, destroy the canvas node, remove from the placed-slabs map, remove the "on canvas" indicator from the shelf thumbnail, clear selection

**Acceptance:** Click a slab → transformer handles appear. Delete → slab disappears from canvas and shelf thumbnail indicator clears. Click background → handles disappear.

---

### Slice 5: Undo/Redo for Move and Rotate

**Goal:** Ctrl+Z undoes the last move or rotate. Ctrl+Y / Ctrl+Shift+Z redoes it.

**Files to touch:** `src/scripts/history.ts` (new), `src/scripts/app.ts`

**Tasks:**
- Create `src/scripts/history.ts` exporting a `History` class:
  - Internal stack of `{ node: Konva.Image; before: { x: number; y: number; rotation: number }; after: { x: number; y: number; rotation: number } }[]`
  - A separate redo stack that is cleared on every new `push`
  - `push(entry)`, `undo(): entry | undefined`, `redo(): entry | undefined`
- In `app.ts`, instantiate one `History`
- After drag end (`dragend` event): push an entry with the node's position before drag (snapshot on `dragstart`) and after
- After each wheel rotation in `slabControls.ts`, accept an optional `onRotate` callback from `app.ts` and call it with before/after; push to history
- Bind `document` `keydown`: Ctrl+Z calls `history.undo()` and restores `before` state; Ctrl+Y / Ctrl+Shift+Z calls `history.redo()` and applies `after` state

**Acceptance:** Move a slab, rotate it, Ctrl+Z twice — each step reverses cleanly. Ctrl+Y re-applies each step.

---

### Slice 6: Cut Slab to Target Area

**Goal:** A "Cut" button clips the selected slab to its intersection with the target area and saves the clipped image as a new shelf item.

**Files to touch:** `src/scripts/cutSlab.ts` (new), `src/scripts/app.ts`, `src/index.html`

**Tasks:**
- Create `src/scripts/cutSlab.ts` exporting `cutSlabToTarget(slabImage: Konva.Image, targetNode: Konva.Rect | Konva.Ellipse): string | null`:
  - Create an offscreen `<canvas>` sized to the target area's bounding box
  - Translate and rotate the 2D context to match the slab's current transform relative to the target area center
  - Draw the slab's image
  - For rect targets, use `ctx.rect` clip; for ellipse targets, use `ctx.ellipse` clip
  - Return `canvas.toDataURL()`, or `null` if the bounding boxes don't intersect at all
- In `index.html`, add a "Cut" button in the toolbar (disabled when nothing is selected)
- In `app.ts`, on Cut click: call `cutSlabToTarget` with the selected slab node and the current target node; if non-null, call `saveSlab` with the result (use target area width/height as the new slab dimensions), remove the original node from canvas and placed-slabs map, call `displayShelf`

**Acceptance:** Place a slab overlapping the target area → click Cut → a new thumbnail appears on the shelf containing only the overlapping portion.

---

### Slice 7: Save and Load Projects

**Goal:** "Save" serializes canvas state to a named project in localforage. "Load" restores a saved project.

**Files to touch:** `src/scripts/persistence.ts` (new), `src/scripts/app.ts`, `src/index.html`

**Tasks:**
- Create `src/scripts/persistence.ts` exporting:
  - `saveProject(name: string, project: Project): Promise<void>` — upserts into the `ProjectList` stored under key `'projects'`
  - `loadProject(name: string): Promise<Project | null>`
  - `listProjects(): Promise<string[]>`
- A `Project` snapshot stores: `targetArea: TargetArea` and `slabs: Array<ShelvedSlab & { x: number; y: number; rotation: number }>`
- In `index.html`, add to the sidebar: a text `<input>` for project name, a "Save" button, a `<select>` listing saved project names (refreshed on load and after save), and a "Load" button
- In `app.ts`, "Save" collects `{x, y, rotation}` from each placed `Konva.Image` node plus the current `TargetArea` and calls `saveProject`; "Load" destroys all current canvas nodes, restores the target area, and places each slab at its saved position/rotation (re-using the placement logic from Slice 1 but bypassing the centering step)

**Acceptance:** Arrange slabs → save as "test" → refresh page → load "test" → slabs reappear at exact saved positions with the correct target area.

---

### Slice 8: GitHub Pages Deployment

**Goal:** `yarn build` produces a `docs/` folder that GitHub Pages can serve directly.

**Files to touch:** `webpack.config.js`

**Tasks:**
- Change `output.path` to `path.resolve(__dirname, 'docs')`
- Ensure `HtmlWebpackPlugin` emits `index.html` into `docs/`
- Verify all asset references in the emitted HTML use relative paths (no leading `/`)
- Add a `docs/` build step note here: the `docs/` folder should be committed and GitHub Pages should be configured to serve from `docs/` on the `main` branch

**Acceptance:** `yarn build` exits 0; `docs/index.html` and `docs/main.bundle.js` (or equivalent hash-named file) exist; opening `docs/index.html` via a local HTTP server (`python3 -m http.server` in `docs/`) shows the working app.
