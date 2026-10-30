package io.github.oneday1factboop.viciouscycle;

import android.content.Context;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.SoundPool;
import android.os.Handler;
import android.os.Looper;

/** Local, separately controlled music and UI audio. Nothing plays in the background. */
final class GameAudio {
    private final Context context;
    private final SharedPreferences prefs;
    private final AudioManager manager;
    private final AudioFocusRequest focusRequest;
    private final SoundPool sounds;
    private final int clickSound;
    private MediaPlayer music;
    private boolean resumed,adShowing,hasFocus,focusRequested,focusBlocked,loaded,released;
    private float duck=1f;
    private int lastClick;
    GameAudio(Context context,SharedPreferences prefs){
        this.context=context;this.prefs=prefs;manager=context.getSystemService(AudioManager.class);
        AudioAttributes attributes=new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_GAME).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build();
        focusRequest=new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN).setAudioAttributes(attributes)
                .setOnAudioFocusChangeListener(change->{
                    if(released)return;
                    if(change==AudioManager.AUDIOFOCUS_GAIN){hasFocus=true;focusBlocked=false;duck=1f;updateMusic();}
                    else if(change==AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK){duck=.18f;volume();}
                    else{hasFocus=false;focusBlocked=true;pauseMusic();}
                },new Handler(Looper.getMainLooper())).build();
        sounds=new SoundPool.Builder().setMaxStreams(2).setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_GAME).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()).build();
        sounds.setOnLoadCompleteListener((pool,id,status)->{if(status==0)loaded=true;});
        clickSound=sounds.load(context,R.raw.button_click,1);
    }
    boolean musicEnabled(){return prefs.getBoolean("musicEnabled",true);}
    boolean soundsEnabled(){return prefs.getBoolean("buttonSoundsEnabled",true);}
    int musicVolume(){return clamp(prefs.getInt("musicVolume",25));}
    int soundVolume(){return clamp(prefs.getInt("buttonSoundVolume",50));}
    private static int clamp(int value){return Math.max(0,Math.min(100,value));}
    void musicEnabled(boolean value){prefs.edit().putBoolean("musicEnabled",value).apply();if(value)focusBlocked=false;updateMusic();}
    void soundsEnabled(boolean value){prefs.edit().putBoolean("buttonSoundsEnabled",value).apply();if(!value)sounds.stop(lastClick);}
    void musicVolume(int value){prefs.edit().putInt("musicVolume",clamp(value)).apply();volume();}
    void soundVolume(int value){prefs.edit().putInt("buttonSoundVolume",clamp(value)).apply();}
    void click(){
        if(released||!resumed||adShowing||focusBlocked||!loaded||!soundsEnabled())return;
        float v=soundVolume()/100f;lastClick=sounds.play(clickSound,v,v,1,0,1f);
    }
    void resume(){if(released)return;resumed=true;focusBlocked=false;updateMusic();}
    void pause(){resumed=false;pauseMusic();sounds.stop(lastClick);abandonFocus();}
    void suspendForAd(){adShowing=true;pauseMusic();sounds.stop(lastClick);abandonFocus();}
    void resumeAfterAd(){adShowing=false;focusBlocked=false;updateMusic();}
    private void updateMusic(){
        if(released)return;
        if(!resumed||adShowing||!musicEnabled()){pauseMusic();abandonFocus();return;}
        if(focusBlocked)return;
        if(!hasFocus){try{focusRequested=manager!=null;hasFocus=manager!=null&&manager.requestAudioFocus(focusRequest)==AudioManager.AUDIOFOCUS_REQUEST_GRANTED;}catch(RuntimeException ignored){hasFocus=false;}if(!hasFocus){focusBlocked=true;return;}}
        try{
            if(music==null){music=MediaPlayer.create(context,R.raw.night_loop,new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_GAME).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build(),0);if(music==null){abandonFocus();return;}music.setLooping(true);}
            volume();if(!music.isPlaying())music.start();
        }catch(RuntimeException ignored){pauseMusic();}
    }
    private void volume(){if(music!=null)try{float v=musicVolume()/100f*duck;music.setVolume(v,v);}catch(RuntimeException ignored){}}
    private void pauseMusic(){if(music!=null)try{if(music.isPlaying())music.pause();}catch(RuntimeException ignored){}}
    private void abandonFocus(){if(manager!=null&&focusRequested)try{manager.abandonAudioFocusRequest(focusRequest);}catch(RuntimeException ignored){}focusRequested=false;hasFocus=false;duck=1f;}
    void release(){if(released)return;pause();released=true;sounds.release();if(music!=null){music.release();music=null;}}
}
