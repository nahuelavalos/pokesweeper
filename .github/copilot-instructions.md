<!-- .github/copilot-instructions.md for pokesweeper -->
# PokeSweeper — Copilot Instructions

Purpose: short, actionable guidance so an AI coding agent can be immediately productive in this repo.

- Project type: Single-page, client-side JavaScript game (no build step). Key files:
  - `index.html` — Loads UI and `app.js` (Bootstrap-based layout).
  - `app.js` — All game logic, DOM wiring, and state (large ~1.5k lines).
  - `db.json` — Static dataset of Pokémon used by `app.js` via `fetch('./db.json')`.
  - `img/` — Image assets referenced like `./img/${name}_mini.png` and `Oro.png`.

- Big picture / architecture:
  - Entire app runs in the browser. `index.html` includes Bootstrap and then `app.js`.
  - `app.js` performs data loading (reads `db.json`), transforms the data through helper functions
    (`buscarPokemon`, `agruparPorCP`, `generarPokemonesRandom`, `crearArrayCompleto`, `asignarPokemonesAGrid`) and then renders a grid of buttons inside the DOM node with id `buttonGrid`.
  - Game state is kept in global variables inside `app.js`: notably `tableroPartida`, `player`, and DOM references like `buttonGrid`.
  - Cell state is stored on DOM elements using `dataset` attributes (e.g. `button.dataset.pokemonName`, `button.dataset.cp`, `button.dataset.x`, `button.dataset.y`). Many functions assume these dataset fields exist.

- Important domain concepts and names (use these when editing / adding features):
  - Special item names used in code: `Mewtwo`, `destello`, `pocion`, `bomba`, `mochila`, `Unown_A`, `Unown_B`, `blue`, `lance`, `Mew`, `tabla`, `Ditto`.
  - Coordinates: buttons have `data-x` and `data-y`. Mewtwo is intentionally placed at (4,6) by `ubicarMewtwo`.
  - Image naming: many places expect `./img/{name}_mini.png`.

- Coding conventions and patterns specific to this repo:
  - Variable/function names are mostly Spanish; preserve Spanish names where possible to stay consistent.
  - The DOM is frequently mutated directly and styled inline — changing structure/IDs requires updating many places in `app.js`.
  - State flows: load `db.json` → map into simplified objects in `buscarPokemon` → group by `cp` → select/generate array → `asignarPokemonesAGrid` which writes dataset attributes and event listeners on buttons.
  - Event handlers are attached directly on button elements (e.g. `button.addEventListener('click', () => manejarClickButton(button))`).

- Quick examples (use these to locate code to change):
  - Data load and start: `fetch('./db.json')` then `buscarPokemon(db)` and `asignarPokemonesAGrid(...)` in `app.js`.
  - Cell click handling: `function manejarClickButton(button)` — central place for battle/collect logic and HP/xp updates.
  - Grid assignment: `asignarPokemonesAGrid(arrayCompleto)` builds grid and returns the `tableroPartida` matrix.

- Developer workflows (how to run & test locally):
  - No build tools. Serve files from a static server and open `http://localhost:PORT`.
  - Two easy options (PowerShell):
    - With Python: `python -m http.server 8000` (run from repo root). Then open `http://localhost:8000`.
    - With npm http-server (if Node installed): `npx http-server -c-1 -p 8000`.
  - There are no automated tests or linters in the repo.

- Safe edit checklist for contributors / agents:
  - If you rename an ID/element in `index.html`, update every reference in `app.js` (`document.getElementById(...)`, `querySelector`, `buttonGrid` lookups).
  - If you add/remove dataset fields on buttons, update all places that read/write `button.dataset.*` and any serialization helpers.
  - Keep naming consistent with Spanish identifiers used across `app.js` (e.g. `buscarPokemon`, `manejarClickButton`).
  - When changing placement logic (rows/cols), update functions that loop `rows`/`cols`, image placement, and any hardcoded coordinates (e.g. (4,6)).
  - Large refactors: prefer extracting small helper functions and preserving the existing flow (load → transform → assign → render → handlers).

- What not to change without coordination:
  - The `db.json` schema (objects with `cp` and `name.english`) — `buscarPokemon` depends on `pokemon.name.english` and `pokemon.cp`.
  - The `button.dataset` keys and the `data-x`/`data-y` coordinate scheme.

- If anything in these instructions is unclear or you want more examples from `app.js` (specific functions or line ranges), ask which area and the agent will expand or add examples.
