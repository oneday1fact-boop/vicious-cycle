# Vicious Cycle Android test builds

Latest prepared build: **1.0.1 / version code 2**. Fixes cropping for all 65 illustrations, removes image zoom, separates art from controls and adapts landscape layout. Signed with the original upload key.

- `vicious-cycle-1.0.1.aab`: upload to the existing Google Play internal test track as the next release.
- `vicious-cycle-1.0.1.apk`: direct Android installation; Play-installed copies should update through Google Play to retain their existing signing/install path.
- `artwork-audit-1.0.1/`: all 65 illustrations checked in portrait, landscape, evidence and gallery viewports; generated from the geometry exercised by native tests. These are fit previews, not device screenshots.
- `SHA256SUMS.txt`: checksums for current and original builds.

Android 8.0 or newer. Official Google test ads. Version 1.0.0 was released to internal testers; 1.0.1 still requires its AAB to be uploaded and released in Play Console. Source code is on `main`.
