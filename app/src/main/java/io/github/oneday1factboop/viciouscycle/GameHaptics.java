package io.github.oneday1factboop.viciouscycle;

import android.content.Context;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.provider.Settings;
import org.json.JSONObject;

/** Short story cues, gated by both the player's preference and Android's setting. */
final class GameHaptics {
    private final Context context;
    private final SharedPreferences prefs;
    private final Vibrator vibrator;
    private String lastScene="";
    GameHaptics(Context context,SharedPreferences prefs){
        this.context=context;this.prefs=prefs;
        if(Build.VERSION.SDK_INT>=31){VibratorManager manager=context.getSystemService(VibratorManager.class);vibrator=manager==null?null:manager.getDefaultVibrator();}
        else vibrator=(Vibrator)context.getSystemService(Context.VIBRATOR_SERVICE);
    }
    boolean enabled(){return prefs.getBoolean("hapticsEnabled",true);}
    int strength(){return Math.max(1,Math.min(100,prefs.getInt("hapticStrength",50)));}
    void enabled(boolean value){prefs.edit().putBoolean("hapticsEnabled",value).apply();if(!value)cancel();}
    void strength(int value){prefs.edit().putInt("hapticStrength",Math.max(1,Math.min(100,value))).apply();}
    void reset(){lastScene="";}
    void scene(String id,JSONObject node){
        if(lastScene.equals(id))return;lastScene=id;
        play(node.optString("fx",node.optString("mood")));
    }
    void play(String effect){
        if(!enabled()||vibrator==null||!vibrator.hasVibrator()||Settings.System.getInt(context.getContentResolver(),Settings.System.HAPTIC_FEEDBACK_ENABLED,1)==0)return;
        HapticPatterns.Pulse pulse=HapticPatterns.forEffect(effect,strength());if(pulse.timings.length==0)return;
        try{
            int[] levels=pulse.amplitudes.clone();
            if(!vibrator.hasAmplitudeControl())for(int i=0;i<levels.length;i++)if(levels[i]>0)levels[i]=VibrationEffect.DEFAULT_AMPLITUDE;
            vibrator.vibrate(VibrationEffect.createWaveform(pulse.timings,levels,-1),new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION).build());
        }catch(RuntimeException ignored){/* Unsupported haptics must never interrupt a choice. */}
    }
    void cancel(){if(vibrator!=null)try{vibrator.cancel();}catch(RuntimeException ignored){}}
}
