package io.github.oneday1factboop.viciouscycle;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.*;
import android.widget.*;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Locale;

/** Full-screen native Android visual novel. No WebView or hosted page is used. */
public final class MainActivity extends ComponentActivity {
    private static final int INK=0xFF171310, PAPER=0xFFF3E8D8, ORANGE=0xFFFF7A26, MUTED=0xFFC3AE99;
    private final Handler handler=new Handler(Looper.getMainLooper());
    private SharedPreferences preferences;
    private StoryEngine engine;
    private JSONArray collection;
    private FrameLayout root;
    private LinearLayout content,controls;
    private SceneView artwork;
    private TextView passage;
    private AlertDialog activeDialog;
    private GameAds ads;
    private GameAudio audio;
    private GameHaptics haptics;
    private LanguagePacks languagePacks;
    private String preferredLanguage="";
    private String screen="cover",pending="";
    private int introPart,speed=20,textSize=21,visibleCharacters;
    private boolean typing,reducedMotion,hasSave;
    private Runnable typeStep;

    @Override public void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        preferences=getSharedPreferences("vicious-cycle-native-v1",MODE_PRIVATE);
        try{
            JSONObject data=new JSONObject(assetText("game/native-data.json"));
            String language=preferences.getString("language",GameLanguage.deviceLanguage(Locale.getDefault()));
            languagePacks=new LanguagePacks(this,data);language=GameLanguage.normalize(language);
            if(!languagePacks.ready(language)){preferredLanguage=language;language="en";}
            JSONObject saved=parse(preferences.getString("state",null));hasSave=saved!=null;
            engine=new StoryEngine(data,language,saved);
            collection=new JSONArray(preferences.getString("collection","[]"));
            speed=preferences.getInt("speed",20);textSize=preferences.getInt("size",21);
            reducedMotion=preferences.getBoolean("reducedMotion",false);
        }catch(Exception e){new AlertDialog.Builder(this).setMessage("Unable to load the bundled story.").setPositiveButton("Close",(d,w)->finish()).show();return;}
        if(Build.VERSION.SDK_INT>=28){WindowManager.LayoutParams a=getWindow().getAttributes();a.layoutInDisplayCutoutMode=WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;getWindow().setAttributes(a);}
        if(Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
        audio=new GameAudio(this,preferences);haptics=new GameHaptics(this,preferences);
        ads=new GameAds(this,audio::suspendForAd,audio::resumeAfterAd);renderCover();ads.start();
        getOnBackPressedDispatcher().addCallback(this,new OnBackPressedCallback(true){@Override public void handleOnBackPressed(){back();}});
        immersive();
        if(!preferredLanguage.isEmpty())root.post(()->{String code=preferredLanguage;preferredLanguage="";requestLanguage(code);});
    }
    private String assetText(String path)throws Exception{
        try(InputStream in=getAssets().open(path);ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] buffer=new byte[8192];int count;while((count=in.read(buffer))!=-1)out.write(buffer,0,count);return out.toString("UTF-8");
        }
    }
    private static JSONObject parse(String raw){try{return raw==null?null:new JSONObject(raw);}catch(Exception e){return null;}}
    private int dp(float value){return Math.round(value*getResources().getDisplayMetrics().density);}
    private String tr(String zh,String en){return engine.translated(zh,en);}
    private String label(String english){return engine.label(english);}
    private String ui(String key){return engine.ui(key);}
    private void save(){hasSave=true;preferences.edit().putString("state",engine.state.toString()).putString("collection",collection.toString()).apply();}
    private void stopTyping(){typing=false;if(typeStep!=null)handler.removeCallbacks(typeStep);}
    private boolean motion(){return !reducedMotion&&Settings.Global.getFloat(getContentResolver(),Settings.Global.ANIMATOR_DURATION_SCALE,1f)!=0f;}
    private void immersive(){
        if(Build.VERSION.SDK_INT>=30){WindowInsetsController c=getWindow().getInsetsController();if(c!=null){c.hide(WindowInsets.Type.systemBars());c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);}}
        else getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }
    @Override public void onWindowFocusChanged(boolean focus){super.onWindowFocusChanged(focus);if(focus)immersive();}
    private TextView text(String value,float size,int color){TextView t=new TextView(this);t.setText(value);t.setTextColor(color);t.setTextSize(size);t.setLineSpacing(dp(5),1.08f);t.setPadding(0,dp(5),0,dp(5));return t;}
    private LinearLayout column(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}
    private GradientDrawable box(int color,int stroke){GradientDrawable b=new GradientDrawable();b.setColor(color);b.setCornerRadius(dp(9));if(stroke!=0)b.setStroke(dp(1),stroke);return b;}
    private Button button(String title,Runnable action,boolean primary){
        Button b=new Button(this);b.setText(title);b.setAllCaps(false);b.setTextSize(16);b.setTextColor(primary?INK:PAPER);b.setGravity(Gravity.CENTER);b.setMinHeight(dp(50));b.setPadding(dp(16),dp(9),dp(16),dp(9));b.setBackground(box(primary?ORANGE:0xDE241C17,primary?0:0xFF6F4B32));
        LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,-2);params.setMargins(0,dp(6),0,dp(3));b.setLayoutParams(params);b.setSoundEffectsEnabled(false);b.setOnClickListener(v->{if(audio!=null)audio.click();action.run();});return b;
    }
    private void base(String nextScreen,String scene){
        stopTyping();screen=nextScreen;
        root=new FrameLayout(this);root.setBackgroundColor(INK);
        artwork=new SceneView(this);paint(artwork,scene,true);
        content=column();content.setPadding(dp(20),dp(12),dp(20),dp(12));root.addView(content,new FrameLayout.LayoutParams(-1,-1));
        content.setOnApplyWindowInsetsListener((view,insets)->{
            int left=0,top=0,right=0,bottom=0;
            if(Build.VERSION.SDK_INT>=30){android.graphics.Insets safe=insets.getInsets(WindowInsets.Type.displayCutout());left=safe.left;top=safe.top;right=safe.right;bottom=safe.bottom;}
            else if(Build.VERSION.SDK_INT>=28&&insets.getDisplayCutout()!=null){android.view.DisplayCutout c=insets.getDisplayCutout();left=c.getSafeInsetLeft();top=c.getSafeInsetTop();right=c.getSafeInsetRight();bottom=c.getSafeInsetBottom();}
            view.setPadding(dp(20)+left,dp(12)+top,dp(20)+right,dp(12)+bottom);return insets;
        });
        setContentView(root);content.requestApplyInsets();immersive();
    }
    private void paint(SceneView target,String key,boolean animate){
        JSONObject frame=engine.data.optJSONObject("art").optJSONObject(key);if(frame==null)frame=engine.data.optJSONObject("art").optJSONObject("cover");
        target.scene(frame,engine.artDescription(key),animate&&motion());
    }
    private void header(String label){
        LinearLayout row=new LinearLayout(this);row.setGravity(Gravity.CENTER_VERTICAL);
        TextView caption=text(label,12,MUTED);caption.setMaxLines(2);row.addView(caption,new LinearLayout.LayoutParams(0,-2,1));
        Button menu=button("☰",this::openMenu,false);menu.setContentDescription(ui("gameMenu"));row.addView(menu,new LinearLayout.LayoutParams(dp(52),dp(48)));content.addView(row);
        if(screen.equals("game")||screen.equals("ending"))attribution(content);
    }
    private ScrollView scroll(LinearLayout child){ScrollView s=new ScrollView(this);s.setFillViewport(false);s.setClipToPadding(false);s.addView(child);return s;}
    private void present(LinearLayout panel){
        // Artwork has its own unobscured viewport; dialogue and controls never cover it.
        boolean wide=getResources().getConfiguration().orientation==Configuration.ORIENTATION_LANDSCAPE;
        LinearLayout body=new LinearLayout(this);body.setOrientation(wide?LinearLayout.HORIZONTAL:LinearLayout.VERTICAL);
        body.addView(artwork,new LinearLayout.LayoutParams(wide?0:-1,wide?-1:0,1f));
        ScrollView reading=scroll(panel);
        LinearLayout.LayoutParams readingParams=new LinearLayout.LayoutParams(wide?0:-1,wide?-1:0,1.05f);
        if(wide)readingParams.setMargins(dp(12),0,0,0);else readingParams.setMargins(0,dp(10),0,0);
        body.addView(reading,readingParams);content.addView(body,new LinearLayout.LayoutParams(-1,0,1));
    }
    private void renderCover(){
        base("cover","cover");header(tr("互動故事","INTERACTIVE FICTION"));
        artwork.fullScreenCover();root.addView(artwork,0,new FrameLayout.LayoutParams(-1,-1));
        View shade=new View(this);shade.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        shade.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,new int[]{0x44000000,0x05000000,0xEF171310}));root.addView(shade,1,new FrameLayout.LayoutParams(-1,-1));
        boolean wide=getResources().getConfiguration().orientation==Configuration.ORIENTATION_LANDSCAPE;
        LinearLayout panel=column();panel.setPadding(0,dp(12),0,dp(8));if(!wide)panel.addView(text(ui("kicker"),14,PAPER));
        TextView title=text(wide?ui("title"):ui("title1")+"\n"+ui("title2"),wide?34:GameLanguage.cjk(engine.language)?65:49,ORANGE);title.setTypeface(Typeface.create("sans-serif-condensed",Typeface.BOLD));title.setLetterSpacing(.04f);title.setLineSpacing(0,.9f);panel.addView(title);
        if(!wide)panel.addView(text(ui("tagline"),16,PAPER));panel.addView(button(ui("start"),()->{introPart=0;renderIntro();},true));
        if(hasSave)panel.addView(button(ui("resume"),this::renderGame,false));
        panel.addView(text(ui("coverFoot"),11,MUTED));
        FrameLayout bottom=new FrameLayout(this);content.addView(bottom,new LinearLayout.LayoutParams(-1,0,1));bottom.addView(scroll(panel),new FrameLayout.LayoutParams(-1,-2,Gravity.BOTTOM));
    }
    private void renderIntro(){
        base("intro","bar");header(ui("background"));
        LinearLayout panel=column();panel.setPadding(dp(14),dp(12),dp(14),dp(12));panel.setBackground(box(0xE8171310,0));
        panel.addView(text(ui("intro"+(introPart+1)+"Title"),28,ORANGE));panel.addView(text(ui("intro"+(introPart+1)),textSize,PAPER));panel.addView(text((introPart+1)+" / 2",12,MUTED));
        panel.addView(button(introPart==0?ui("continue"):ui("enter"),()->{if(introPart==0){introPart=1;renderIntro();}else{engine.start();haptics.reset();save();renderGame();}},true));panel.addView(text(ui("contentNote"),12,MUTED));
        present(panel);
    }
    private void renderGame(){
        JSONObject n=engine.node();if(n.has("ending")){renderEnding();return;}
        base("game",n.optString("scene","cover"));header(n.optString("section"));
        LinearLayout hotspots=column();
        if(n.has("extra")){JSONObject extra=n.optJSONObject("extra");hotspots.addView(button("◉  "+extra.optString("label"),()->openInfo(extra,false),false));}
        JSONArray spots=n.optJSONArray("hotspots");if(spots!=null)for(int i=0;i<spots.length();i++){JSONObject h=spots.optJSONObject(i);hotspots.addView(button("◉  "+h.optString("label"),()->openInfo(h,false),false));}
        if(n.has("action")){JSONObject action=n.optJSONObject("action");hotspots.addView(button("◈  "+action.optString("label"),()->openInfo(action,true),!engine.actionDone()));}
        LinearLayout panel=column();panel.setPadding(dp(14),dp(10),dp(14),dp(12));panel.setBackground(box(0xED171310,0));
        String cue=n.optString("cue");if(!cue.isEmpty()){TextView c=text(cue,19,ORANGE);c.setTypeface(null,Typeface.BOLD);panel.addView(c);}
        panel.addView(hotspots);
        JSONObject line=engine.variant(n);String who=line.optString("who");if(!who.isEmpty())panel.addView(text(who,13,ORANGE));
        passage=text("",textSize,PAPER);passage.setFocusable(true);passage.setSoundEffectsEnabled(false);passage.setContentDescription(ui("reveal"));passage.setOnClickListener(v->{if(typing){audio.click();reveal();}});panel.addView(passage);
        if(n.has("overwrite")){JSONObject o=n.optJSONObject("overwrite");panel.addView(text(ui("chosen")+" · "+o.optString("from")+"\n"+ui("bodyResponse")+" · "+o.optString("to"),16,ORANGE));panel.addView(text(o.optString("reason"),14,MUTED));}
        controls=column();panel.addView(controls);
        present(panel);
        pending=line.optString("text");visibleCharacters=0;
        if(speed==0||!motion())reveal();else{
            typing=true;controls.addView(button(ui("showAll"),this::reveal,false));
            typeStep=()->{if(!typing)return;visibleCharacters=pending.offsetByCodePoints(visibleCharacters,1);passage.setText(pending.substring(0,visibleCharacters));if(visibleCharacters>=pending.length())reveal();else handler.postDelayed(typeStep,speed);};
            if(pending.isEmpty())reveal();else handler.postDelayed(typeStep,speed);
        }
        save();haptics.scene(engine.state.optString("id"),n);
    }
    private void reveal(){stopTyping();if(passage==null)return;passage.setText(pending);showControls();}
    private void showControls(){
        if(controls==null)return;controls.removeAllViews();JSONObject n=engine.node();final String renderedId=engine.state.optString("id");
        if(n.has("action")&&!engine.actionDone()){controls.addView(text(ui("inspectHint"),14,ORANGE));return;}
        JSONArray choices=n.optJSONArray("choices");
        if(choices!=null){for(int i=0;i<choices.length();i++){final int index=i;controls.addView(button(choices.optJSONObject(i).optString("label"),()->{if(!renderedId.equals(engine.state.optString("id")))return;engine.choose(index);save();renderGame();},false));}return;}
        if(n.has("continue")){controls.addView(text(tr("章節完","CHAPTER COMPLETE"),22,ORANGE));controls.addView(button(ui("continue"),()->{if(!renderedId.equals(engine.state.optString("id")))return;ads.chapterBreak(()->{if(!renderedId.equals(engine.state.optString("id")))return;engine.continueChapter();save();renderGame();});},true));}
        else if(n.has("next"))controls.addView(button(ui("next"),()->{if(!renderedId.equals(engine.state.optString("id")))return;engine.next();save();renderGame();},true));
    }
    private void openInfo(JSONObject original,boolean mandatory){
        boolean wasTyping=typing;if(wasTyping)reveal();JSONObject source=engine.variant(original);engine.inspect(source,mandatory);save();
        haptics.play(source.optString("kind","document"));
        LinearLayout panel=column();attribution(panel);SceneView picture=new SceneView(this);paint(picture,source.optString("scene",engine.node().optString("scene","cover")),false);panel.addView(picture,new LinearLayout.LayoutParams(-1,dp(220)));
        String card=source.optString("card");if(card.isEmpty()&&mandatory){String kind=source.optString("kind");if(kind.equals("wallet")||kind.equals("paper")||kind.equals("window"))card=ui(kind);}
        panel.addView(text(card.isEmpty()?source.optString("text",source.optString("feedback")):card,textSize,PAPER));if(!card.isEmpty())panel.addView(text(source.optString("feedback"),15,MUTED));
        final String id=engine.state.optString("id");
        showDialog(source.optString("title",source.optString("label")),panel,mandatory?ui("continueStory"):ui("backStory"),()->{if(mandatory&&id.equals(engine.state.optString("id"))){engine.next();save();renderGame();}});
        if(mandatory&&controls!=null)showControls();
    }
    private void renderEnding(){
        JSONObject n=engine.node(),e=engine.variant(n.optJSONObject("ending"));String id=engine.state.optString("id");boolean known=false;for(int i=0;i<collection.length();i++)if(id.equals(collection.optString(i)))known=true;if(!known)collection.put(id);
        base("ending",e.optString("scene","cover"));header(ui("ending"));
        LinearLayout panel=column();panel.setPadding(dp(14),dp(12),dp(14),dp(12));panel.setBackground(box(0xE8171310,0));
        TextView stamp=text(ui("ending"),35,ORANGE);stamp.setTypeface(null,Typeface.BOLD);panel.addView(stamp);panel.addView(text(e.optString("title"),25,PAPER));
        JSONArray paragraphs=e.optJSONArray("paragraphs");int part=Math.min(engine.state.optInt("part"),paragraphs.length()-1);panel.addView(text(paragraphs.optString(part),textSize,PAPER));panel.addView(text((part+1)+" / "+paragraphs.length(),12,MUTED));
        if(part<paragraphs.length()-1)panel.addView(button(ui("then"),()->{StoryEngine.put(engine.state,"part",part+1);save();renderEnding();},true));
        else{
            if(engine.recoveryIndex()>=0){panel.addView(button(ui("returnFork"),()->{engine.recover();save();renderGame();},true));panel.addView(text(ui("returnHint"),13,MUTED));}
            if(engine.state.optJSONArray("trail").length()>0)panel.addView(button(ui("retry"),()->{engine.retry();save();renderGame();},false));
            panel.addView(button(ui("restart"),()->confirmRestart(),false));panel.addView(button(ui("backCover"),this::renderCover,false));
        }
        present(panel);save();
    }
    private void showDialog(String title,LinearLayout panel,String positive,Runnable action){
        if(activeDialog!=null)activeDialog.dismiss();panel.setPadding(dp(18),dp(8),dp(18),dp(12));
        AlertDialog dialog=new AlertDialog.Builder(this).setTitle(title).setView(scroll(panel)).setPositiveButton(positive,(d,w)->{audio.click();if(action!=null)action.run();}).create();activeDialog=dialog;dialog.setOnDismissListener(d->{if(activeDialog==dialog)activeDialog=null;immersive();});dialog.show();styleDialog(dialog);
    }
    private void styleDialog(AlertDialog dialog){
        if(dialog.getWindow()!=null)dialog.getWindow().setBackgroundDrawable(box(INK,0));
        for(int which:new int[]{AlertDialog.BUTTON_POSITIVE,AlertDialog.BUTTON_NEGATIVE,AlertDialog.BUTTON_NEUTRAL}){Button b=dialog.getButton(which);if(b!=null){b.setTextColor(ORANGE);b.setSoundEffectsEnabled(false);}}
        if(dialog.getListView()!=null)dialog.getListView().setSoundEffectsEnabled(false);
    }
    private void attribution(LinearLayout panel){
        if(!engine.locale().optString("translationMode").equals("on-device"))return;
        ImageView badge=new ImageView(this);badge.setImageResource(R.drawable.google_translate_attribution);badge.setScaleType(ImageView.ScaleType.FIT_CENTER);badge.setContentDescription(label("Powered by Google Translate"));
        LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(dp(176),dp(16));params.setMargins(0,dp(5),0,dp(8));panel.addView(badge,params);
    }
    private void openMenu(){
        if(typing)reveal();LinearLayout menu=column();
        menu.addView(button(label("Language")+" · "+GameLanguage.NAMES[GameLanguage.index(engine.language)],this::openLanguage,false));
        menu.addView(button(ui("chapters"),this::openChapters,false));menu.addView(button(ui("collection"),this::openCollection,false));menu.addView(button(ui("notes"),this::openNotes,false));menu.addView(button(ui("history"),this::openHistory,false));menu.addView(button(ui("settings"),this::openSettings,false));
        if(ads.privacyRequired())menu.addView(button(tr("廣告私隱選項","Ad privacy choices"),()->{dismissDialog();ads.privacy();},false));
        menu.addView(button(tr("私隱政策","Privacy policy"),this::openPrivacy,false));menu.addView(button(ui("home"),()->{dismissDialog();renderCover();},false));menu.addView(button(ui("restart"),this::confirmRestart,false));
        showDialog(ui("gameMenu"),menu,ui("close"),null);
    }
    private void renderCurrent(){if(screen.equals("cover"))renderCover();else if(screen.equals("intro"))renderIntro();else renderGame();}
    private void openLanguage(){
        dismissDialog();AlertDialog dialog=new AlertDialog.Builder(this).setTitle(label("Language"))
            .setSingleChoiceItems(GameLanguage.NAMES,GameLanguage.index(engine.language),(d,which)->{audio.click();d.dismiss();requestLanguage(GameLanguage.CODES[which]);})
            .setNegativeButton(ui("close"),(d,w)->audio.click()).create();activeDialog=dialog;
        dialog.setOnDismissListener(d->{if(activeDialog==dialog)activeDialog=null;immersive();});dialog.show();
        styleDialog(dialog);
    }
    private String targetLabel(String code,String key){return engine.data.optJSONObject("languages").optJSONObject(code).optJSONObject("nativeUi").optString(key,key);}
    private void useLanguage(String code){engine.language=code;preferences.edit().putString("language",code).apply();renderCurrent();}
    private void requestLanguage(String code){
        if(languagePacks.ready(code)){useLanguage(code);return;}
        AlertDialog dialog=new AlertDialog.Builder(this).setTitle(GameLanguage.NAMES[GameLanguage.index(code)])
            .setMessage(targetLabel(code,"This language needs a one-time download. The full story will then be available offline."))
            .setPositiveButton(targetLabel(code,"Translate with Google"),(d,w)->{audio.click();prepareLanguage(code);})
            .setNegativeButton(targetLabel(code,"Cancel"),(d,w)->audio.click()).create();activeDialog=dialog;
        dialog.setOnDismissListener(d->{if(activeDialog==dialog)activeDialog=null;immersive();});dialog.show();styleDialog(dialog);
    }
    private void prepareLanguage(String code){
        LinearLayout panel=column();panel.setPadding(dp(20),dp(14),dp(20),dp(14));
        TextView status=text(targetLabel(code,"Downloading language…"),17,PAPER);panel.addView(status);
        ProgressBar progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);progress.setIndeterminate(true);panel.addView(progress);
        AlertDialog dialog=new AlertDialog.Builder(this).setTitle(GameLanguage.NAMES[GameLanguage.index(code)]).setView(panel)
            .setNegativeButton(targetLabel(code,"Cancel"),(d,w)->{audio.click();languagePacks.cancel();}).create();activeDialog=dialog;
        dialog.setCanceledOnTouchOutside(false);dialog.setOnCancelListener(d->languagePacks.cancel());
        dialog.setOnDismissListener(d->{if(activeDialog==dialog)activeDialog=null;immersive();});dialog.show();styleDialog(dialog);
        languagePacks.prepare(code,new LanguagePacks.Listener(){
            public void progress(int done,int total){if(isDestroyed())return;progress.setIndeterminate(false);progress.setMax(total);progress.setProgress(done);status.setText(targetLabel(code,"Preparing story")+" · "+done+" / "+total);}
            public void ready(){if(isDestroyed())return;dialog.dismiss();useLanguage(code);}
            public void failed(){if(isDestroyed())return;dialog.dismiss();AlertDialog error=new AlertDialog.Builder(MainActivity.this).setTitle(GameLanguage.NAMES[GameLanguage.index(code)]).setMessage(targetLabel(code,"Language preparation failed. Check your connection and try again.")).setPositiveButton(targetLabel(code,"Close"),(d,w)->audio.click()).create();error.show();styleDialog(error);}
        });
    }
    private void dismissDialog(){if(activeDialog!=null)activeDialog.dismiss();}
    private void confirmRestart(){
        dismissDialog();AlertDialog dialog=new AlertDialog.Builder(this).setTitle(ui("restart")).setMessage(tr("目前進度會被取代，結局收藏會保留。","This replaces the current run. Your ending collection is kept.")).setNegativeButton(tr("取消","Cancel"),(d,w)->audio.click()).setPositiveButton(ui("start"),(d,w)->{audio.click();introPart=0;renderIntro();}).create();dialog.show();styleDialog(dialog);
    }
    private void openChapters(){
        LinearLayout panel=column();attribution(panel);panel.addView(text(ui("chapterWarning"),15,MUTED));JSONObject chapters=engine.locale().optJSONObject("chapters");
        for(int i=1;i<=5;i++){final int chapter=i;boolean unlocked=hasSave&&engine.checkpoint(i)!=null;Button b=button(chapters.optString(String.valueOf(i))+(unlocked?"":" · "+ui("locked")),()->{dismissDialog();engine.replay(chapter);save();renderGame();},false);b.setEnabled(unlocked);b.setAlpha(unlocked?1:.45f);panel.addView(b);}
        showDialog(ui("chapterReplay"),panel,ui("close"),null);
    }
    private void openCollection(){
        LinearLayout panel=column();attribution(panel);panel.addView(text(collection.length()+" / 10",16,ORANGE));
        ArrayList<JSONObject> list=new ArrayList<>();for(Iterator<String> it=engine.story().keys();it.hasNext();){String id=it.next();JSONObject n=engine.story().optJSONObject(id);if(n.has("ending")){JSONObject item=StoryEngine.copy(n.optJSONObject("ending"));StoryEngine.put(item,"id",id);list.add(item);}}
        list.sort((a,b)->Integer.compare(a.optInt("number"),b.optInt("number")));
        for(JSONObject e:list){boolean known=false;for(int i=0;i<collection.length();i++)if(e.optString("id").equals(collection.optString(i)))known=true;
            if(known){SceneView image=new SceneView(this);paint(image,e.optString("scene"),false);panel.addView(image,new LinearLayout.LayoutParams(-1,dp(150)));}
            panel.addView(text(e.optInt("number")+" · "+(known?e.optString("title"):ui("unknown")),19,known?PAPER:MUTED));}
        showDialog(ui("collection"),panel,ui("close"),null);
    }
    private void openNotes(){
        LinearLayout panel=column();attribution(panel);panel.addView(text(ui("people"),23,ORANGE));JSONArray people=engine.locale().optJSONArray("people");
        for(int i=0;i<people.length();i++){JSONObject p=people.optJSONObject(i);if(!p.has("requiresNote")||engine.hasNote(p.optString("requiresNote"))){panel.addView(text(p.optString("name"),18,PAPER));panel.addView(text(p.optString("text"),16,MUTED));}}
        panel.addView(text(ui("clues"),23,ORANGE));JSONArray notes=engine.state.optJSONArray("notes");JSONObject all=engine.locale().optJSONObject("notes");
        if(notes.length()==0)panel.addView(text(ui("noClues"),16,MUTED));
        for(int i=0;i<notes.length();i++){JSONObject note=all.optJSONObject(notes.optString(i));if(note!=null){panel.addView(text(note.optString("title"),18,PAPER));panel.addView(text(note.optString("text"),16,MUTED));}}
        showDialog(ui("notesTitle"),panel,ui("close"),null);
    }
    private void openHistory(){
        LinearLayout panel=column();attribution(panel);JSONArray history=engine.state.optJSONArray("history");
        for(int i=0;i<history.length();i++){JSONObject entry=history.optJSONObject(i),n=engine.story().optJSONObject(entry.optString("id"));if(n==null)continue;
            if(entry.has("choice")){JSONObject c=n.optJSONArray("choices").optJSONObject(entry.optInt("choice"));panel.addView(text(ui("choiceRole")+" · "+c.optString("label"),16,ORANGE));}
            else{JSONObject line=n;JSONArray variants=n.optJSONArray("variants");if(variants!=null)for(int j=0;j<variants.length();j++)if(StoryEngine.matches(variants.optJSONObject(j),entry.optJSONObject("flags"))){line=StoryEngine.merged(n,variants.optJSONObject(j));break;}panel.addView(text(line.optString("who",ui("narrator")),13,MUTED));panel.addView(text(line.optString("text"),17,PAPER));}}
        if(history.length()==0)panel.addView(text(ui("noHistory"),16,MUTED));showDialog(ui("historyTitle"),panel,ui("close"),null);
    }
    private void openSettings(){
        LinearLayout panel=column();panel.addView(button(label("Language")+" · "+GameLanguage.NAMES[GameLanguage.index(engine.language)],this::openLanguage,false));
        panel.addView(text(label("Reading"),23,ORANGE));panel.addView(text(ui("speed"),18,PAPER));SeekBar rate=new SeekBar(this);rate.setContentDescription(ui("speed"));rate.setMax(65);rate.setProgress(speed);panel.addView(rate);panel.addView(text(ui("speedHelp"),13,MUTED));
        panel.addView(text(ui("size"),18,PAPER));SeekBar size=new SeekBar(this);size.setMax(12);size.setProgress(textSize-18);panel.addView(size);TextView preview=text(tr("文字大小預覽","Text size preview"),textSize,PAPER);panel.addView(preview);
        Switch motion=new Switch(this);motion.setText(tr("減少動態","Reduce motion"));motion.setTextColor(PAPER);motion.setChecked(reducedMotion);motion.setPadding(0,dp(14),0,dp(14));panel.addView(motion);
        SeekBar.OnSeekBarChangeListener changes=new SeekBar.OnSeekBarChangeListener(){public void onStartTrackingTouch(SeekBar s){}public void onStopTrackingTouch(SeekBar s){}public void onProgressChanged(SeekBar s,int value,boolean user){if(s==rate)speed=value;else{textSize=18+value;preview.setTextSize(textSize);}preferences.edit().putInt("speed",speed).putInt("size",textSize).apply();}};rate.setOnSeekBarChangeListener(changes);size.setOnSeekBarChangeListener(changes);
        motion.setSoundEffectsEnabled(false);motion.setOnCheckedChangeListener((b,on)->{reducedMotion=on;preferences.edit().putBoolean("reducedMotion",on).apply();audio.click();});
        panel.addView(text(label("Audio"),23,ORANGE));
        addToggle(panel,"Background music",audio.musicEnabled(),audio::musicEnabled);
        addVolume(panel,"Music volume",audio.musicVolume(),0,audio::musicVolume);
        panel.addView(text(label("Music pauses when you leave the app or an advert opens."),13,MUTED));
        addToggle(panel,"Button sounds",audio.soundsEnabled(),audio::soundsEnabled);
        addVolume(panel,"Button sound volume",audio.soundVolume(),0,audio::soundVolume);
        panel.addView(button(label("Test button sound"),()->{},false));
        panel.addView(text(label("Story haptics"),23,ORANGE));
        addToggle(panel,"Story haptics",haptics.enabled(),haptics::enabled);
        addVolume(panel,"Haptic strength",haptics.strength(),1,haptics::strength);
        panel.addView(button(label("Test vibration"),()->haptics.play("preview"),false));
        panel.addView(text(label("Your device controls whether vibration is available."),13,MUTED));
        panel.addView(text(label("Sound and vibration settings are saved on this device."),13,MUTED));
        panel.addView(text(label("Language models are downloaded from Google. Story text is translated on this device."),13,MUTED));
        panel.addView(text(label("Version")+" "+BuildConfig.VERSION_NAME,12,MUTED));
        showDialog(ui("readSettings"),panel,ui("close"),this::renderCurrent);
    }
    private interface ToggleChange{void changed(boolean value);}
    private interface VolumeChange{void changed(int value);}
    private void addToggle(LinearLayout panel,String name,boolean checked,ToggleChange change){
        Switch toggle=new Switch(this);toggle.setText(label(name));toggle.setTextColor(PAPER);toggle.setChecked(checked);toggle.setSoundEffectsEnabled(false);toggle.setPadding(0,dp(12),0,dp(12));toggle.setOnCheckedChangeListener((b,value)->{change.changed(value);audio.click();});panel.addView(toggle);
    }
    private void addVolume(LinearLayout panel,String name,int value,int minimum,VolumeChange change){
        TextView caption=text(label(name)+" · "+value+"%",16,PAPER);panel.addView(caption);
        SeekBar seek=new SeekBar(this);seek.setSoundEffectsEnabled(false);seek.setMin(minimum);seek.setMax(100);seek.setProgress(value);seek.setContentDescription(label(name));panel.addView(seek);
        seek.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener(){public void onStartTrackingTouch(SeekBar s){}public void onStopTrackingTouch(SeekBar s){}public void onProgressChanged(SeekBar s,int v,boolean user){caption.setText(label(name)+" · "+v+"%");if(user)change.changed(v);}});
    }
    private void openPrivacy(){
        LinearLayout panel=column();panel.addView(text(tr("遊戲進度、選擇、語言及閱讀設定只儲存在此裝置。清除程式資料或解除安裝會刪除此資料。","Story progress, choices, language and reading settings are stored only on this device. Clearing app data or uninstalling removes them."),17,PAPER));
        panel.addView(text(tr("本程式使用Google AdMob廣告服務。Google可能處理IP位址、廣告及裝置識別資料、診斷資料和廣告互動，以提供廣告及防止詐騙。適用地區會先顯示同意選項；你可隨時在選單更新可用的廣告私隱選項。拒絕或無法載入廣告不影響遊戲進度。","This app uses Google AdMob. Google may process IP addresses, device and advertising identifiers, diagnostics and ad interactions to serve ads and prevent fraud. Consent choices appear where required; available ad privacy choices can be reopened from the menu. Declining consent or unavailable ads never blocks the story."),17,PAPER));
        panel.addView(text(label("Language models are downloaded from Google. Story text is translated on this device."),15,MUTED));
        panel.addView(text("Translations powered by Google Translate. https://cloud.google.com/translate\nTHIS SERVICE MAY CONTAIN TRANSLATIONS POWERED BY GOOGLE. GOOGLE DISCLAIMS ALL WARRANTIES RELATED TO THE TRANSLATIONS, EXPRESS OR IMPLIED, INCLUDING ANY WARRANTIES OF ACCURACY, RELIABILITY, AND ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.",12,MUTED));
        panel.addView(text(label("Google privacy policy")+": https://policies.google.com/privacy\n"+label("Privacy questions")+": https://github.com/oneday1fact-boop/vicious-cycle/issues",14,MUTED));showDialog(tr("私隱政策","Privacy policy"),panel,ui("close"),null);
    }
    private void back(){
        if(activeDialog!=null){dismissDialog();return;}if(typing){reveal();return;}
        if(!screen.equals("cover")){if(hasSave)save();renderCover();return;}
        AlertDialog dialog=new AlertDialog.Builder(this).setTitle(tr("離開遊戲？","Leave the game?")).setNegativeButton(tr("繼續遊戲","Keep playing"),(d,w)->audio.click()).setPositiveButton(tr("離開","Leave"),(d,w)->{audio.click();finish();}).create();dialog.show();styleDialog(dialog);
    }
    @Override protected void onResume(){super.onResume();if(audio!=null)audio.resume();}
    @Override protected void onPause(){if(engine!=null&&hasSave)save();if(audio!=null)audio.pause();if(haptics!=null)haptics.cancel();super.onPause();}
    @Override public void onConfigurationChanged(Configuration configuration){super.onConfigurationChanged(configuration);if(engine!=null){if(languagePacks!=null&&languagePacks.busy()){immersive();return;}dismissDialog();renderCurrent();}}
    @Override protected void onDestroy(){stopTyping();if(languagePacks!=null)languagePacks.cancel();if(audio!=null)audio.release();if(haptics!=null)haptics.cancel();super.onDestroy();}
}
