# Google Play internal testing

Application ID: `io.github.oneday1factboop.viciouscycle` · Version: `1.1.0` / code `3` · Target SDK: `36` · Minimum Android: `8.0`.

Version 1.0.1 is already active in internal testing. Upload 1.1.0 to the same app and track as a new release; do not create another app. Keep the existing tester list selected.

## Console preparation

1. In your verified Google Play developer account, create a new **game**, using the English title **Vicious Cycle** and the Traditional Chinese title **惡性循環**. Enable Play App Signing. An existing listing must use its existing package ID and upload key instead.
2. Complete the store listing using `store/`. Supply the required phone screenshots, a 512×512 icon and 1024×500 feature graphic after reviewing them. Choose the supported countries and pricing in Console.
3. Set the privacy policy to the published `docs/privacy.html` page. The app contains ads, requires no login and offers no purchases. Local story saves are not transmitted to the publisher. Google Mobile Ads may collect/share advertising or device identifiers, approximate location from IP addresses, diagnostics and ad interactions; complete Data safety using the current SDK disclosure and actual AdMob configuration. Review the answers against the final build.
4. Complete the IARC content rating accurately: crime, intimidation and non-graphic violence are present. Select a suitable adult target audience; do not invent a rating or declare the game suitable for children.
5. Create an internal testing list and add your testers. Upload the signed `.aab` to an internal testing draft, then review and release it in Console when ready.

New personal developer accounts may have verification and closed-testing requirements before a production release. Console determines the requirements for your account. An internal draft upload does not publish a production release.

## Optional automated upload

Create a Google Cloud service account, enable the Google Play Android Developer API, and grant that service account access to **this app** in Play Console with the permission needed to manage testing releases. Store its JSON key directly in GitHub Actions **Secrets**, never in chat, source code or issues.

Configure these repository Actions secrets:

| Secret | Value |
| --- | --- |
| `VC_UPLOAD_KEYSTORE_BASE64` | Base64-encoded upload keystore |
| `VC_UPLOAD_STORE_PASSWORD` | Keystore password |
| `VC_UPLOAD_KEY_ALIAS` | Upload alias |
| `VC_UPLOAD_KEY_PASSWORD` | Key password |
| `PLAY_SERVICE_ACCOUNT_JSON` | Service-account JSON with this app's testing-release permission |

Run **Google Play internal upload** manually in Actions. Supply a new version code higher than all previously uploaded codes. The workflow verifies the story, builds a signed AAB, uploads it and commits an **internal draft** release. It does not roll out to production or choose your content declarations. Review the draft in Play Console and select testers there.

The API cannot create the initial Play app listing or complete your developer verification. For a brand-new app, Console may require an initial manual upload before API uploads become available.

## Upload key backup

Keep an encrypted offline backup of the upload keystore and its passwords. Do not commit them. With Play App Signing, Google manages the app signing key; the local key signs uploads. Restore the existing key for future builds instead of generating another one.

## Device review

Before releasing to testers, verify on a real Android phone: first launch offline; both languages; image and evidence dialogs; Back navigation; text size and reduced motion; rotation; save/resume after closing; an early ending and return to a story fork; and a full path to a final ending. Browser saves do not transfer automatically into the Android app.

## AdMob setup

Create an Android app in your AdMob account and create an interstitial ad unit. Set the repository Actions variables `VC_ADMOB_APP_ID` and `VC_ADMOB_INTERSTITIAL_ID` to these two IDs. Configure applicable consent messages in AdMob Privacy & messaging. Both variables must be supplied for live release ads; otherwise the bundle uses official test ads and earns no revenue. Debug always uses test ads.

Ads appear only at player-initiated chapter transitions, at least three minutes apart. There are no banners over artwork and no ads on launch, decisions, ending recovery or exit. Story access never depends on an ad succeeding.

Official integration references: https://developers.google.com/admob/android/quick-start · https://developers.google.com/admob/android/privacy · https://developers.google.com/admob/android/interstitial · https://developers.google.com/admob/android/privacy/play-data-disclosure

The connected GitHub integration could push source but could not write Actions secrets or enable Pages. Add credentials in repository Settings → Secrets and variables → Actions. Publish `docs/privacy.html` through GitHub Pages (Settings → Pages, branch `main`, folder `/docs`) or your own public host before using its URL in Console.

Version 1.1.0 includes Google ML Kit on-device translation. Model downloads may send network/device information and diagnostics to Google; story translation runs locally. Review the current ML Kit SDK disclosure alongside the Ads disclosure when completing Data safety. Japanese, Spanish and French story packs are automatically prepared on first use and cached.
