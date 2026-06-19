# Testing Guide

This project uses [Vitest](https://vitest.dev/) with a jsdom environment. No build step is required — the tests load the same vanilla JS source files that the browser does.

## Running Tests

```bash
npm install       # first time only
npm test          # run all tests once
npm run test:watch  # re-run on file save (watch mode)
```

## VS Code Integration

Install the **[Vitest extension](https://marketplace.visualstudio.com/items?itemName=vitest.explorer)** to get a Testing panel in the sidebar with inline pass/fail indicators and a one-click **Run Tests** button.

## Test Files

All tests live in the `tests/` folder.

| File | What it covers |
|---|---|
| `Constants.test.js` | Data integrity for `DEFAULTS`, `SLIDER_CONFIGS`, `STORAGE_KEYS`, `SHORTCUT_CONFIGS` |
| `PosterUtils.test.js` | All color math and string formatting utilities (`hexToRgb`, `hslToHex`, `isDark`, `deriveAccentColor`, `formatFullscreenTimer`) |
| `themes.test.js` | Per-theme validation — every theme in `THEMES` is checked for required keys, valid colors, particle weights, and swatch format |
| `ParticleEngine.physics.test.js` | Weighted particle selection, petal count management, gravity, boundary wrapping |
| `ThemeManager.syncWind.test.js` | CSS custom property values output by `syncWind` at key wind thresholds |
| `UIController.test.js` | Isolated methods: `isTextInput`, `renderAddedHosts`, `renderRemovedHosts`, `clearInactivityTimers` |
| `RemoteManager.test.js` | Code generation, session persistence, `send`, message routing, state mutations (`_applySlider`, `_applySwatch`, `_applyHostAdd`, etc.), `_sendStateSync` shape |

## How the Test Environment Works

Source files use `window.Name = class ...` globals — they're not ES modules. `tests/setup.js` loads each file using Node's `readFileSync` + `new Function` trick, which evaluates the source against the jsdom `window` object exactly as a browser `<script>` tag would. No source files are modified.

## Adding New Tests

1. Create `tests/YourModule.test.js`
2. Access your class via `window.YourClass` (loaded automatically by `setup.js`)
3. Build a minimal fake `poster` object for any method that calls `this.poster.*`
4. Run `npm test` to verify

## Adding a New Source Module

If you add a new JS file that needs to be testable, add a `loadScript()` line to `tests/setup.js` in the correct dependency order (after anything it depends on).

## Known Limitations

- **Event listener binding** (`bindSliders`, `bindToggles`, etc.) is not tested — these require a full `index.html` DOM fixture to be meaningful.
- **PeerJS / WebSocket** (RemoteManager networking) is not tested — requires a real WebSocket environment.
- **`contentEditable` detection** in `UIController.isTextInput` always returns `false` in jsdom for detached elements; this is a jsdom limitation, not a bug. It works correctly in a real browser.
