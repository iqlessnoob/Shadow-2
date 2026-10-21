# Shadowfall: 100 Floors — fixed Android build setup

The game files are stored in `www/`, matching `webDir: "www"` in `capacitor.config.json`.

## Build APK
1. Replace the old repository files with this package, keeping `www/` and `.github/workflows/build.yml`.
2. Commit and push to `main` or `master`.
3. Open GitHub → Actions → Build Android APK.
4. Download `shadowfall-debug-apk` from a successful run and extract `app-debug.apk`.

This workflow creates a debug APK for testing, not a signed Play Store release.
