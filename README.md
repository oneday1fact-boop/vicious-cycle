# Vicious Cycle / 惡性循環

An illustrated, branching psychological crime story for Android, with complete English and written Traditional Chinese editions. Five chapters, ten endings, 167 narrative scenes and 64 illustrated scene frames, plus the cover. Short passages appear progressively; choices, image hotspots and evidence cards move the story forward. Early endings offer a return to an earlier story fork without revealing future chapters.

## Native Android game

Install the APK from this repository's Releases page. The debug APK installs alongside the release app. Android 8.0 or later and an up-to-date Android System WebView are required. The story and artwork run offline. Ads use a network connection when available. Progress, reading preferences and collected endings remain on the device; uninstalling or clearing app data removes them.

The game is rendered by native Android Views and Canvas, with immersive full-screen artwork, progressive dialogue and native evidence dialogs. No WebView, HTML page or browser is used for the game interface. Swipe from the screen edge to reveal system bars. Android Back dismisses panels or returns to the cover without discarding progress.

Google AdMob interstitials can appear only after the player taps Continue at a chapter break, with a minimum three-minute interval. Missing ads never block the story. Live ads use Google's UMP consent flow and expose privacy choices when required. Builds use official Google test ads until both publisher IDs are configured.

## Build

Open this folder in Android Studio, install Android SDK 36, and use JDK 17 or newer (JDK 21 is used in CI). The Gradle 8.13 wrapper verifies its downloaded distribution.

```sh
node game/verify.cjs
node scripts/export-native.cjs
./gradlew testDebugUnitTest lintDebug assembleDebug bundleRelease
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

For live ads, set `VC_ADMOB_APP_ID` and `VC_ADMOB_INTERSTITIAL_ID` from your own AdMob account. Set both or neither. Debug builds always use Google's official test IDs. Live IDs are not supplied by this repository.

Keep signing material outside the repository. The production application ID is `io.github.oneday1factboop.viciouscycle`; debug uses `.debug`. An existing Play listing requires its original package ID and authorized upload key.

## Google Play

[Release preparation](docs/google-play.md) covers the internal testing upload, listing and required Console declarations. [Privacy policy](docs/privacy.html). The `Android build` workflow creates an installable debug APK and a release bundle. The manual `Google Play internal upload` workflow signs and uploads a draft internal release after the repository's signing and Play secrets have been configured.

The native engine tests drive all ten endings in both languages, serialize and restore saves, verify mandatory inspections and replay, and prove early-ending recovery reaches a later chapter. The source story checks cover 4,446 opening route combinations, 4,320 later continuation routes, all ten endings, English coverage, language switching, legacy saves, evidence and ending recovery. Native build and lint checks complement these checks; they do not replace Android device testing.

## Source

- `game/`: bilingual story, reader, interactions and artwork
- `app/`: native full-screen Android reader, branching engine and AdMob consent/ads
- `game/native-data.json`: exported bilingual narrative and scene atlas metadata
- `scripts/upload_play.py`: Android Publisher API internal draft upload
- `store/`: English and Traditional Chinese listing drafts and release notes
- `docs/`: privacy policy and release instructions

This fictional game is not affiliated with or endorsed by any film studio. Content includes crime, intimidation and non-graphic violence involving adult characters. Complete the Play content rating questionnaire against the actual game.

The bundled poster font is a Noto Sans CJK subset; its license is in `game/assets/fonts/LICENSE.txt`. No general open-source license has been granted for the remaining game code, story or art.

## Release status

The first Android build uses test ads. Google Play publisher credentials and real AdMob IDs have not been connected. The source repository is public; that does not imply a Google Play release has been uploaded or approved.
