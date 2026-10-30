# Vicious Cycle / 惡性循環

An illustrated, branching psychological crime story for Android, with English, written Traditional Chinese and Simplified Chinese editions, plus on-device Japanese, Spanish and French story packs. Five chapters, ten endings, 167 narrative scenes and 64 illustrated scene frames, plus the cover. Short passages appear progressively; choices, image hotspots and evidence cards move the story forward. Early endings offer a return to an earlier story fork without revealing future chapters.

## Native Android game

[Download the signed ARM64 APK](https://github.com/oneday1fact-boop/vicious-cycle/raw/refs/heads/android-builds/vicious-cycle-1.1.0-arm64.apk) and install it on your phone. [Google Play AAB](https://github.com/oneday1fact-boop/vicious-cycle/raw/refs/heads/android-builds/vicious-cycle-1.1.0.aab). The debug APK installs alongside the release app. Android 8.0 or later is required. The story, artwork, music and button sounds run offline. Japanese, Spanish and French need a one-time model download and full-story preparation; their menus are bundled and their prepared stories are cached for offline use. If preparation fails or is cancelled, the current language and progress remain in place. Google Translate powers automatic story translations: https://cloud.google.com/translate. Play-installed copies should update through Google Play, using the existing internal test track. Ads use a network connection when available. Progress, reading preferences and collected endings remain on the device; uninstalling or clearing app data removes them.

The game is rendered by native Android Views and Canvas, with a full-screen cover and overlaid controls, complete uncropped story artwork, progressive dialogue and native evidence dialogs. No WebView, HTML page or browser is used for the game interface. Swipe from the screen edge to reveal system bars. Android Back dismisses panels or returns to the cover without discarding progress.

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
| `VC_VERSION_CODE` | Increasing Play version code, default `3` |
| `VC_VERSION_NAME` | Display version, default `1.1.0` |

For live ads, set `VC_ADMOB_APP_ID` and `VC_ADMOB_INTERSTITIAL_ID` from your own AdMob account. Set both or neither. Debug builds always use Google's official test IDs. Live IDs are not supplied by this repository.

Keep signing material outside the repository. The production application ID is `io.github.oneday1factboop.viciouscycle`; debug uses `.debug`. An existing Play listing requires its original package ID and authorized upload key.

## Google Play

[中文連接與上架指南](docs/connect-play-zh.md) · [Release preparation](docs/google-play.md) covers the internal testing upload, listing and required Console declarations. [Privacy policy](docs/privacy.html). The `Android build` workflow creates an installable debug APK and a release bundle. The manual `Google Play internal upload` workflow signs and uploads a draft internal release after the repository's signing and Play secrets have been configured.

Story artwork is fitted in full without stretching, zooming or cropping. The cover alone fills the screen, keeping the face visible with overlaid title and buttons. Portrait mode separates the illustration and scrollable dialogue; landscape mode places them side by side. Fade-in replaces the zoom animation. Evidence dialogs and the ending gallery use the same complete-frame renderer. The artwork audit exercises all 65 illustrations in ten viewport sizes (650 cases); `python scripts/audit-artwork.py` generates inspection sheets from the tested native geometry after the unit tests run. These sheets are artwork-fit previews, not device screenshots.

Music, button sounds and story haptics have independent, persistent controls and level sliders. Music pauses in the background, during full-screen ads and on audio-focus loss. Haptics follow Android’s system setting, use short bounded pulses and never repeat just because a passage is re-rendered. The original ambient loop and soft click are generated by `scripts/generate-audio.py`; the audio is bundled, with no streaming service.

The native engine tests drive all ten endings across all six language templates, serialize and restore saves, verify mandatory inspections and replay, and prove early-ending recovery reaches a later chapter. The source story checks cover 4,446 opening route combinations, 4,320 later continuation routes, all ten endings, English coverage, language switching, legacy saves, evidence and ending recovery. Language-pack tests verify all displayed narrative fields can be translated while preserving routes, flags, choices and saves, and reject partial packs. Native build and lint checks complement these checks; they do not replace Android device testing. Language-model download/translation, physical haptics, audio focus and ad transitions still need device review for this release.

## Source

- `game/`: canonical story, reader, artwork, six-language UI and Simplified Chinese story
- `game/locales/`: bundled locale data and hand-authored Japanese, Spanish and French interface translations
- `app/`: native full-screen Android reader, branching engine and AdMob consent/ads
- `game/native-data.json`: exported language templates, display-text translation plan and scene atlas metadata
- `scripts/export-native.cjs`: deterministic native export, including translation cache fingerprint
- `scripts/generate-simplified.py`: optional ICU-based Simplified Chinese regeneration; its output is committed
- `scripts/upload_play.py`: Android Publisher API internal draft upload
- `store/`: English and Traditional Chinese listing drafts and release notes
- `docs/`: privacy policy and release instructions

This fictional game is not affiliated with or endorsed by any film studio. Content includes crime, intimidation and non-graphic violence involving adult characters. Complete the Play content rating questionnaire against the actual game.

The bundled poster font is a Noto Sans CJK subset; its license is in `game/assets/fonts/LICENSE.txt`. No general open-source license has been granted for the remaining game code, story or art.

## Release status

Version 1.1.0 / code 3 is released and available on the Google Play internal testing track. [Join the internal test](https://play.google.com/apps/internaltest/4699937056777486793) with an eligible Google account. It adds the full-screen cover, audio/haptic controls and additional languages. The build uses test ads. Nine native test cases, source story checks, Android lint, signing and 16 KB alignment checks passed; GitHub Actions also passed. Physical audio/haptic/model-preparation review remains part of internal testing. Automated Android Publisher credentials and real AdMob IDs are not configured. [Audio and language implementation notes](docs/audio-languages.md).
