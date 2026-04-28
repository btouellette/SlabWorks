# SlabWorks

A web app for woodworkers to upload images of wood slabs, set their dimensions, simulate cuts against a target area, and save projects — before making any physical cuts.

## Features

- Upload slab images and store them in a shelf (persisted locally via IndexedDB)
- Place slabs on a canvas, drag and rotate them freely
- Define a target area by width/height and shape (rectangle or ellipse)
- Cut a slab to the target area intersection — result saves as a new shelf item
- Undo/redo moves and rotations (Ctrl+Z / Ctrl+Y)
- Save and load named projects

## Tech Stack

- TypeScript + Webpack
- Konva.js (canvas manipulation)
- localforage (IndexedDB persistence)
- Tailwind CSS

## Dev Setup

```
yarn install
yarn start    # webpack-dev-server at http://localhost:8080
yarn build    # production build to docs/
```

## Deployment

`yarn build` outputs to `docs/`. GitHub Pages is configured to serve from `docs/` on the `main` branch.
