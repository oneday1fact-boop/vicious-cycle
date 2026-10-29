# 連接Google Play並上傳遊戲

遊戲名稱：**惡性循環 / Vicious Cycle**  
Android套件名稱：`io.github.oneday1factboop.viciouscycle`

目前GitHub已連接，但Google Play及AdMob尚未授權。GitHub連接可推送原始碼，無權代你新增Actions secrets。帳戶首次授權需要由你在Google及GitHub的登入頁面完成，毋須在聊天提供密碼或私密金鑰。

## 最快開始內部試玩

1. 登入[Google Play Console](https://play.google.com/console)，建立名為「Vicious Cycle」的新遊戲。
2. 到儲存庫的[Releases](https://github.com/oneday1fact-boop/vicious-cycle/releases)，下載已簽署的`.aab`。
3. 在Console建立「內部測試」版本，啟用Play App Signing，上傳該AAB，加入測試者並完成必要的帳戶及內容資料。

APK供Android手機直接安裝；AAB供Google Play使用。試玩版包含Google官方測試廣告，不會產生廣告收入。

## 讓自動上傳流程取得授權

1. 在[Google Cloud Console](https://console.cloud.google.com)建立或選擇專案，啟用[Google Play Android Developer API](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com)。
2. 在[服務帳戶](https://console.cloud.google.com/iam-admin/serviceaccounts)建立帳戶。發佈本遊戲不需要給予Google Cloud Owner角色。
3. 在Play Console「使用者與權限」邀請該服務帳戶的電郵，僅授予本遊戲所需的測試版本管理權限。
4. 建立該服務帳戶的JSON金鑰，直接存入[GitHub Actions secrets](https://github.com/oneday1fact-boop/vicious-cycle/settings/secrets/actions)，名稱填寫`PLAY_SERVICE_ACCOUNT_JSON`。不要把JSON加入儲存庫、公開issue或聊天。
5. 執行[Upload prepared bundle to Play](https://github.com/oneday1fact-boop/vicious-cycle/actions/workflows/play-prebuilt.yml)。它會下載Releases中的已簽署AAB、核對檔案校驗碼，並上傳至Google Play的內部測試草稿，毋須把上傳簽署金鑰交給這個流程。

新應用程式首次上傳可能必須先在Console手動完成。API不會代辦開發者身分驗證、建立最初的商店應用程式或填寫你的帳戶資料。上傳內部草稿亦不等於公開發佈。

## 正式廣告

在[AdMob](https://admob.google.com)建立Android應用程式及插頁廣告單元，把兩個ID分別存入儲存庫Actions **Variables**：

- `VC_ADMOB_APP_ID`
- `VC_ADMOB_INTERSTITIAL_ID`

這兩個ID不是密碼。正式廣告版本亦須在AdMob設定適用的私隱同意訊息，並在Play Console申報包含廣告及Google廣告SDK的資料處理。

重新編譯並簽署正式版本需用回同一個upload key，詳見[完整發佈說明](google-play.md)。簽署金鑰及密碼並未提交到公開原始碼。

[Google官方API授權說明](https://developers.google.com/android-publisher/getting_started) · [Google廣告SDK資料披露](https://developers.google.com/admob/android/privacy/play-data-disclosure)
