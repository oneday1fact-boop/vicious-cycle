package io.github.oneday1factboop.viciouscycle;

import android.app.Activity;
import android.os.SystemClock;
import com.google.android.gms.ads.*;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.ump.*;

/** Ads appear only after a player taps Continue at a chapter break. */
public final class GameAds {
    private final Activity activity;
    private final Runnable onAdStart,onAdEnd;
    private ConsentInformation consent;
    private InterstitialAd interstitial;
    private boolean initialized,loading;
    private long lastShown=SystemClock.elapsedRealtime();
    public GameAds(Activity activity,Runnable onAdStart,Runnable onAdEnd){this.activity=activity;this.onAdStart=onAdStart;this.onAdEnd=onAdEnd;}
    public void start(){
        if(BuildConfig.TEST_ADS){initialize();return;}
        consent=UserMessagingPlatform.getConsentInformation(activity);
        consent.requestConsentInfoUpdate(activity,new ConsentRequestParameters.Builder().build(),
            ()->UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity,error->{if(consent.canRequestAds())initialize();}),
            error->{if(consent.canRequestAds())initialize();});
    }
    private void initialize(){
        if(initialized||activity.isFinishing()||activity.isDestroyed())return;initialized=true;
        MobileAds.initialize(activity,status->activity.runOnUiThread(this::load));
    }
    private void load(){
        if(loading||activity.isFinishing()||activity.isDestroyed())return;loading=true;
        InterstitialAd.load(activity,BuildConfig.ADMOB_INTERSTITIAL_ID,new AdRequest.Builder().build(),new InterstitialAdLoadCallback(){
            @Override public void onAdLoaded(InterstitialAd ad){loading=false;interstitial=ad;}
            @Override public void onAdFailedToLoad(LoadAdError error){loading=false;interstitial=null;}
        });
    }
    public boolean privacyRequired(){return consent!=null&&consent.getPrivacyOptionsRequirementStatus()==ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED;}
    public void privacy(){
        if(!privacyRequired())return;
        // Discard the cached ad; reload only after checking the updated consent state.
        interstitial=null;
        UserMessagingPlatform.showPrivacyOptionsForm(activity,error->{if(consent.canRequestAds()){if(!initialized)initialize();else load();}});
    }
    public void chapterBreak(Runnable next){
        InterstitialAd ad=interstitial;
        if(ad==null||SystemClock.elapsedRealtime()-lastShown<180000){next.run();if(initialized&&ad==null)load();return;}
        if(!BuildConfig.TEST_ADS&&(consent==null||!consent.canRequestAds())){interstitial=null;next.run();return;}
        interstitial=null;
        ad.setFullScreenContentCallback(new FullScreenContentCallback(){
            private boolean completed;
            private void finish(){if(completed)return;completed=true;onAdEnd.run();next.run();load();}
            @Override public void onAdDismissedFullScreenContent(){finish();}
            @Override public void onAdFailedToShowFullScreenContent(AdError error){finish();}
            @Override public void onAdShowedFullScreenContent(){lastShown=SystemClock.elapsedRealtime();onAdStart.run();}
        });
        ad.show(activity);
    }
}
