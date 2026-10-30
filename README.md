# Vicious Cycle Android test builds

Latest prepared build: **1.1.0 / version code 3**. Source: `09d101333676615153973aba1e071f85983cc6e8`.

- `vicious-cycle-1.1.0.aab`: signed update for the existing Google Play internal test track. Contains all four supported ABIs.
- `vicious-cycle-1.1.0-arm64.apk`: signed direct install for ARM64 Android phones. Play-installed copies should update through Google Play to retain the Play signing path and local saves.
- `artwork-audit-1.1.0/`: geometry previews from native tests, including the full-screen cover. These are not Android device screenshots.
- `SHA256SUMS.txt`: checksums for prepared and original builds.

1.1.0 adds a full-screen cover with overlaid controls, original bundled ambient music and button sounds, and separately saved audio/haptic controls. Traditional Chinese, Simplified Chinese and English stories are bundled. Japanese, Spanish and French menus are bundled; automatic story packs use Google Translate on device after a one-time language-model download, then work offline.

Android 8.0 or newer. Official Google test ads. Version 1.0.1 is active in internal testing; 1.1.0 still needs its AAB uploaded and released in Play Console. Nine native tests, story regression checks, Android lint, signatures and 16 KB alignment checks passed. Physical audio/haptic/model preparation review remains part of testing. Source code is on `main`.
