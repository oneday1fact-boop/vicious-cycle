# Vicious Cycle / 惡性循環

An illustrated, branching psychological crime story for Android, with complete English and written Traditional Chinese editions. Five chapters, ten endings, 167 narrative scenes and 64 illustrated scene frames, plus the cover. Short passages appear progressively; choices, image hotspots and evidence cards move the story forward. Early endings offer a return to an earlier story fork without revealing future chapters.

## Play on Android

Install the APK from this repository's Releases page. The debug APK installs alongside the release app. Android 8.0 or later and an up-to-date Android System WebView are required. The whole game runs offline. Progress, reading preferences and collected endings remain on the device; uninstalling or clearing app data removes them.

The native Android shell loads bundled assets over AndroidX WebKit's secure local origin. It requests no Internet or sensitive permissions, includes no advertising or analytics, and exposes no native JavaScript bridge. Android Back closes an open information panel before offering to exit.

## Build

Open this folder in Android Studio, install Android SDK 36, and use JDK 17 or newer (JDK 21 is used in CI). The Gradle 8.13 wrapper verifies its downloaded distribution.

```sh
node game/verify.cjs
./gradlew lintDebug assembleDebug bundleRelease
```

Outputs are under `app/build/outputs/`. `bundleRelease` is unsigned unless all four signing variables below are supplied. A release upload requires the same upload key on subsequent builds.

| Variable | Purpose |
| --- | --- |
| `VC_UPLOAD_KEYSTORE` | Absolute path to the upload keystore |
| `VC_UPLOAD_STORE_PASSWORD` | Keystore password |
| `VC_UPLOAD_KEY_ALIAS` | Upload key alias |
| `VC_UPLOAD_KEY_PASSWORD` | Key password |
| `VC_VERSION_CODE` | Increasing Play version code, default `1` |
| `VC_VERSION_NAME` | Display version, default `1.0.0` |

Keep signing material outside the repository. The production application ID is `io.github.oneday1factboop.viciouscycle`; debug uses `.debug`. An existing Play listing requires its original package ID and authorized upload key.

## Google Play

[Release preparation](docs/google-play.md) covers the internal testing upload, listing and required Console declarations. [Privacy policy](docs/privacy.html). The `Android build` workflow creates an installable debug APK and a release bundle. The manual `Google Play internal upload` workflow signs and uploads a draft internal release after the repository's signing and Play secrets have been configured.

The automated story checks cover 4,446 opening route combinations, 4,320 later continuation routes, all ten endings, English coverage, language switching, legacy saves, evidence and ending recovery. Native build and lint checks complement these checks; they do not replace Android device testing.

## Source

- `game/`: bilingual story, reader, interactions and artwork
- `app/`: offline Android container
- `scripts/upload_play.py`: Android Publisher API internal draft upload
- `store/`: English and Traditional Chinese listing drafts and release notes
- `docs/`: privacy policy and release instructions

This fictional game is not affiliated with or endorsed by any film studio. Content includes crime, intimidation and non-graphic violence involving adult characters. Complete the Play content rating questionnaire against the actual game.

The bundled poster font is a Noto Sans CJK subset; its license is in `game/assets/fonts/LICENSE.txt`. No general open-source license has been granted for the remaining game code, story or art.
