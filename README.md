# Shadowfall: 100 Floors

A no-external-assets HTML Canvas action-platformer prototype, packaged for Android with Capacitor.

## Run locally
Open `index.html` in a modern browser. For reliable localStorage and module-free asset loading, serve the folder with a local static server, for example `python -m http.server 8080`.

## Android APK via GitHub Actions
1. Upload the repository contents to GitHub, keeping `.github/workflows/build.yml`.
2. Ensure the default branch is `main` or `master`.
3. Push a commit or use **Actions → Build Android APK → Run workflow**.
4. Open the completed workflow run and download the `shadowfall-debug-apk` artifact.
5. Extract the ZIP artifact; it contains `app-debug.apk`. Android may require enabling installation from your chosen file manager.

The workflow produces a **debug APK** for testing, not a Play Store release. A release build needs a signing key and secure GitHub Actions secrets.

## Controls
- Move: arrows / A,D
- Jump / double-jump: Space
- Dash: Shift or K
- Attack: J, X, or Enter
- Switch owned weapon: Q
- Crouch/drop: Down / S
- Pause: Escape or on-screen pause

Touch controls are included for mobile. Landscape is recommended.

## Prototype scope
- 100-level campaign progression and 10 biome palettes, changing every 10 levels
- Boss encounters on every fifth campaign level, with two attack phases
- Infinite wave mode, scaling enemies, four enemy archetypes
- Procedural visuals, particles, weapon variants, armor stats, coins/diamonds, local save
- Shop/armory, HUD, pause/game-over and clear screens

This is a playable foundation, not a finished commercial game. Test balance, browser performance, device-specific touch behavior, and Android packaging before release. Current enemy/boss behavior is deliberately lightweight and can be expanded into a fuller platforming AI system.
