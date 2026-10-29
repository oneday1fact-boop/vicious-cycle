package io.github.oneday1factboop.viciouscycle;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import android.app.AlertDialog;
import android.content.SharedPreferences;
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
    private String screen="cover",pending="";
    private int introPart,speed=20,textSize=21,visibleCharacters;
    private boolean typing,reducedMotion,hasSave;
    private Runnable typeStep;

    @Override public void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        preferences=getSharedPreferences("vicious-cycle-native-v1",MODE_PRIVATE);
        try{
            JSONObject data=new JSONObject(assetText("game/native-data.json"));
            String language=preferences.getString("language","zh");
            JSONObject saved=parse(preferences.getString("state",null));hasSave=saved!=null;
            engine=new StoryEngine(data,language,saved);
            collection=new JSONArray(preferences.getString("collection","[]"));
            speed=preferences.getInt("speed",20);textSize=preferences.getInt("size",21);
            reducedMotion=preferences.getBoolean("reducedMotion",false);
        }catch(Exception e){new AlertDialog.Builder(this).setMessage("Unable to load the bundled story.").setPositiveButton("Close",(d,w)->finish()).show();return;}
        if(Build.VERSION.SDK_INT>=28){WindowManager.LayoutParams a=getWindow().getAttributes();a.layoutInDisplayCutoutMode=WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;getWindow().setAttributes(a);}
        if(Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
        ads=new GameAds(this);renderCover();ads.start();
        getOnBackPressedDispatcher().addCallback(this,new OnBackPressedCallback(true){@Override public void handleOnBackPressed(){back();}});
        immersive();
    }
    private String assetText(String path)throws Exception{
        try(InputStream in=getAssets().open(path);ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] buffer=new byte[8192];int count;while((count=in.read(buffer))!=-1)out.write(buffer,0,count);return out.toString("UTF-8");
        }
    }
    private static JSONObject parse(String raw){try{return raw==null?null:new JSONObject(raw);}catch(Exception e){return null;}}
    private int dp(float value){return Math.round(value*getResources().getDisplayMetrics().density);}
    private boolean english(){return engine.language.equals("en");}
    private String tr(String zh,String en){return english()?en:zh;}
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
        LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,-2);params.setMargins(0,dp(6),0,dp(3));b.setLayoutParams(params);b.setOnClickListener(v->action.run());return b;
    }
    private void base(String nextScreen,String scene){
        stopTyping();screen=nextScreen;
        root=new FrameLayout(this);root.setBackgroundColor(INK);
        artwork=new SceneView(this);paint(artwork,scene,true);root.addView(artwork,new FrameLayout.LayoutParams(-1,-1));
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
        String description=english()?engine.data.optJSONObject("artEnglish").optString(key,"Scene illustration"):frame.optString("name");target.scene(frame,description,animate&&motion());
    }
    private void header(String label){
        LinearLayout row=new LinearLayout(this);row.setGravity(Gravity.CENTER_VERTICAL);
        TextView caption=text(label,12,MUTED);caption.setMaxLines(2);row.addView(caption,new LinearLayout.LayoutParams(0,-2,1));
        Button menu=button("☰",this::openMenu,false);menu.setContentDescription(ui("gameMenu"));row.addView(menu,new LinearLayout.LayoutParams(dp(52),dp(48)));content.addView(row);
    }
    private void spacer(float weight){content.addView(new View(this),new LinearLayout.LayoutParams(1,0,weight));}
    private ScrollView scroll(LinearLayout child){ScrollView s=new ScrollView(this);s.setFillViewport(false);s.setClipToPadding(false);s.addView(child);return s;}
    private void renderCover(){
        base("cover","cover");header(tr("互動故事","INTERACTIVE FICTION"));spacer(1);
        LinearLayout panel=column();panel.addView(text(ui("kicker"),14,PAPER));
        TextView title=text(english()?"VICIOUS\nCYCLE":"惡性\n循環",english()?51:65,ORANGE);title.setTypeface(Typeface.create("sans-serif-condensed",Typeface.BOLD));title.setLetterSpacing(.08f);title.setLineSpacing(0,.86f);panel.addView(title);
        panel.addView(text(ui("tagline"),16,PAPER));panel.addView(button(ui("start"),()->{introPart=0;renderIntro();},true));
        if(hasSave)panel.addView(button(ui("resume"),this::renderGame,false));
        content.addView(panel);TextView foot=text(ui("coverFoot"),11,MUTED);content.addView(foot);
    }
    private void renderIntro(){
        base("intro","bar");header(ui("background"));spacer(1);
        LinearLayout panel=column();panel.setPadding(dp(14),dp(12),dp(14),dp(12));panel.setBackground(box(0xE8171310,0));
        panel.addView(text(ui("intro"+(introPart+1)+"Title"),28,ORANGE));panel.addView(text(ui("intro"+(introPart+1)),textSize,PAPER));panel.addView(text((introPart+1)+" / 2",12,MUTED));
        panel.addView(button(introPart==0?ui("continue"):ui("enter"),()->{if(introPart==0){introPart=1;renderIntro();}else{engine.start();save();renderGame();}},true));panel.addView(text(ui("contentNote"),12,MUTED));
        ScrollView area=scroll(panel);content.addView(area,new LinearLayout.LayoutParams(-1,0,1.25f));
    }
    private void renderGame(){
        JSONObject n=engine.node();if(n.has("ending")){renderEnding();return;}
        base("game",n.optString("scene","cover"));header(n.optString("section"));
        FrameLayout objects=new FrameLayout(this);content.addView(objects,new LinearLayout.LayoutParams(-1,0,1f));
        String cue=n.optString("cue");if(!cue.isEmpty()){TextView c=text(cue,19,ORANGE);c.setTypeface(null,Typeface.BOLD);objects.addView(c,new FrameLayout.LayoutParams(-2,-2,Gravity.TOP|Gravity.CENTER_HORIZONTAL));}
        LinearLayout hotspots=column();FrameLayout.LayoutParams hotParams=new FrameLayout.LayoutParams(-1,-2,Gravity.BOTTOM);objects.addView(hotspots,hotParams);
        if(n.has("extra")){JSONObject extra=n.optJSONObject("extra");hotspots.addView(button("◉  "+extra.optString("label"),()->openInfo(extra,false),false));}
        JSONArray spots=n.optJSONArray("hotspots");if(spots!=null)for(int i=0;i<spots.length();i++){JSONObject h=spots.optJSONObject(i);hotspots.addView(button("◉  "+h.optString("label"),()->openInfo(h,false),false));}
        if(n.has("action")){JSONObject action=n.optJSONObject("action");hotspots.addView(button("◈  "+action.optString("label"),()->openInfo(action,true),!engine.actionDone()));}
        LinearLayout panel=column();panel.setPadding(dp(14),dp(10),dp(14),dp(12));panel.setBackground(box(0xED171310,0));
        JSONObject line=engine.variant(n);String who=line.optString("who");if(!who.isEmpty())panel.addView(text(who,13,ORANGE));
        passage=text("",textSize,PAPER);passage.setFocusable(true);passage.setContentDescription(ui("reveal"));passage.setOnClickListener(v->{if(typing)reveal();});panel.addView(passage);
        if(n.has("overwrite")){JSONObject o=n.optJSONObject("overwrite");panel.addView(text(ui("chosen")+" · "+o.optString("from")+"\n"+ui("bodyResponse")+" · "+o.optString("to"),16,ORANGE));panel.addView(text(o.optString("reason"),14,MUTED));}
        controls=column();panel.addView(controls);
        ScrollView area=scroll(panel);content.addView(area,new LinearLayout.LayoutParams(-1,0,1.05f));
        pending=line.optString("text");visibleCharacters=0;
        if(speed==0||!motion())reveal();else{
            typing=true;controls.addView(button(ui("showAll"),this::reveal,false));
            typeStep=()->{if(!typing)return;visibleCharacters=pending.offsetByCodePoints(visibleCharacters,1);passage.setText(pending.substring(0,visibleCharacters));if(visibleCharacters>=pending.length())reveal();else handler.postDelayed(typeStep,speed);};
            if(pending.isEmpty())reveal();else handler.postDelayed(typeStep,speed);
        }
        save();
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
        LinearLayout panel=column();SceneView picture=new SceneView(this);paint(picture,source.optString("scene",engine.node().optString("scene","cover")),false);panel.addView(picture,new LinearLayout.LayoutParams(-1,dp(220)));
        String card=source.optString("card");if(card.isEmpty()&&mandatory){String kind=source.optString("kind");if(kind.equals("wallet")||kind.equals("paper")||kind.equals("window"))card=ui(kind);}
        panel.addView(text(card.isEmpty()?source.optString("text",source.optString("feedback")):card,textSize,PAPER));if(!card.isEmpty())panel.addView(text(source.optString("feedback"),15,MUTED));
        final String id=engine.state.optString("id");
        showDialog(source.optString("title",source.optString("label")),panel,mandatory?ui("continueStory"):ui("backStory"),()->{if(mandatory&&id.equals(engine.state.optString("id"))){engine.next();save();renderGame();}});
        if(mandatory&&controls!=null)showControls();
    }
    private void renderEnding(){
        JSONObject n=engine.node(),e=engine.variant(n.optJSONObject("ending"));String id=engine.state.optString("id");boolean known=false;for(int i=0;i<collection.length();i++)if(id.equals(collection.optString(i)))known=true;if(!known)collection.put(id);
        base("ending",e.optString("scene","cover"));header(ui("ending"));spacer(1);
        LinearLayout panel=column();panel.setPadding(dp(14),dp(12),dp(14),dp(12));panel.setBackground(box(0xE8171310,0));
        TextView stamp=text(ui("ending"),35,ORANGE);stamp.setTypeface(null,Typeface.BOLD);panel.addView(stamp);panel.addView(text(e.optString("title"),25,PAPER));
        JSONArray paragraphs=e.optJSONArray("paragraphs");int part=Math.min(engine.state.optInt("part"),paragraphs.length()-1);panel.addView(text(paragraphs.optString(part),textSize,PAPER));panel.addView(text((part+1)+" / "+paragraphs.length(),12,MUTED));
        if(part<paragraphs.length()-1)panel.addView(button(ui("then"),()->{StoryEngine.put(engine.state,"part",part+1);save();renderEnding();},true));
        else{
            if(engine.recoveryIndex()>=0){panel.addView(button(ui("returnFork"),()->{engine.recover();save();renderGame();},true));panel.addView(text(ui("returnHint"),13,MUTED));}
            if(engine.state.optJSONArray("trail").length()>0)panel.addView(button(ui("retry"),()->{engine.retry();save();renderGame();},false));
            panel.addView(button(ui("restart"),()->confirmRestart(),false));panel.addView(button(ui("backCover"),this::renderCover,false));
        }
        content.addView(scroll(panel),new LinearLayout.LayoutParams(-1,0,1.3f));save();
    }
    private void showDialog(String title,LinearLayout panel,String positive,Runnable action){
        if(activeDialog!=null)activeDialog.dismiss();panel.setPadding(dp(18),dp(8),dp(18),dp(12));
        AlertDialog dialog=new AlertDialog.Builder(this).setTitle(title).setView(scroll(panel)).setPositiveButton(positive,(d,w)->{if(action!=null)action.run();}).create();activeDialog=dialog;dialog.setOnDismissListener(d->{if(activeDialog==dialog)activeDialog=null;immersive();});dialog.show();
        if(dialog.getWindow()!=null)dialog.getWindow().setBackgroundDrawable(box(INK,0));dialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(ORANGE);
    }
    private void openMenu(){
        if(typing)reveal();LinearLayout menu=column();
        menu.addView(button(english()?"繁體中文":"English",()->{engine.language=english()?"zh":"en";preferences.edit().putString("language",engine.language).apply();dismissDialog();renderCurrent();},false));
        menu.addView(button(ui("chapters"),this::openChapters,false));menu.addView(button(ui("collection"),this::openCollection,false));menu.addView(button(ui("notes"),this::openNotes,false));menu.addView(button(ui("history"),this::openHistory,false));menu.addView(button(ui("settings"),this::openSettings,false));
        if(ads.privacyRequired())menu.addView(button(tr("廣告私隱選項","Ad privacy choices"),()->{dismissDialog();ads.privacy();},false));
        menu.addView(button(tr("私隱政策","Privacy policy"),this::openPrivacy,false));menu.addView(button(ui("home"),()->{dismissDialog();renderCover();},false));menu.addView(button(ui("restart"),this::confirmRestart,false));
        showDialog(ui("gameMenu"),menu,ui("close"),null);
    }
    private void renderCurrent(){if(screen.equals("cover"))renderCover();else if(screen.equals("intro"))renderIntro();else renderGame();}
    private void dismissDialog(){if(activeDialog!=null)activeDialog.dismiss();}
    private void confirmRestart(){
        dismissDialog();new AlertDialog.Builder(this).setTitle(ui("restart")).setMessage(tr("目前進度會被取代，結局收藏會保留。","This replaces the current run. Your ending collection is kept.")).setNegativeButton(tr("取消","Cancel"),null).setPositiveButton(ui("start"),(d,w)->{introPart=0;renderIntro();}).show();
    }
    private void openChapters(){
        LinearLayout panel=column();panel.addView(text(ui("chapterWarning"),15,MUTED));JSONObject chapters=engine.locale().optJSONObject("chapters");
        for(int i=1;i<=5;i++){final int chapter=i;boolean unlocked=hasSave&&engine.checkpoint(i)!=null;Button b=button(chapters.optString(String.valueOf(i))+(unlocked?"":" · "+ui("locked")),()->{dismissDialog();engine.replay(chapter);save();renderGame();},false);b.setEnabled(unlocked);b.setAlpha(unlocked?1:.45f);panel.addView(b);}
        showDialog(ui("chapterReplay"),panel,ui("close"),null);
    }
    private void openCollection(){
        LinearLayout panel=column();panel.addView(text(collection.length()+" / 10",16,ORANGE));
        ArrayList<JSONObject> list=new ArrayList<>();for(Iterator<String> it=engine.story().keys();it.hasNext();){String id=it.next();JSONObject n=engine.story().optJSONObject(id);if(n.has("ending")){JSONObject item=StoryEngine.copy(n.optJSONObject("ending"));StoryEngine.put(item,"id",id);list.add(item);}}
        list.sort((a,b)->Integer.compare(a.optInt("number"),b.optInt("number")));
        for(JSONObject e:list){boolean known=false;for(int i=0;i<collection.length();i++)if(e.optString("id").equals(collection.optString(i)))known=true;
            if(known){SceneView image=new SceneView(this);paint(image,e.optString("scene"),false);panel.addView(image,new LinearLayout.LayoutParams(-1,dp(150)));}
            panel.addView(text(e.optInt("number")+" · "+(known?e.optString("title"):ui("unknown")),19,known?PAPER:MUTED));}
        showDialog(ui("collection"),panel,ui("close"),null);
    }
    private void openNotes(){
        LinearLayout panel=column();panel.addView(text(ui("people"),23,ORANGE));JSONArray people=engine.locale().optJSONArray("people");
        for(int i=0;i<people.length();i++){JSONObject p=people.optJSONObject(i);if(!p.has("requiresNote")||engine.hasNote(p.optString("requiresNote"))){panel.addView(text(p.optString("name"),18,PAPER));panel.addView(text(p.optString("text"),16,MUTED));}}
        panel.addView(text(ui("clues"),23,ORANGE));JSONArray notes=engine.state.optJSONArray("notes");JSONObject all=engine.locale().optJSONObject("notes");
        if(notes.length()==0)panel.addView(text(ui("noClues"),16,MUTED));
        for(int i=0;i<notes.length();i++){JSONObject note=all.optJSONObject(notes.optString(i));if(note!=null){panel.addView(text(note.optString("title"),18,PAPER));panel.addView(text(note.optString("text"),16,MUTED));}}
        showDialog(ui("notesTitle"),panel,ui("close"),null);
    }
    private void openHistory(){
        LinearLayout panel=column();JSONArray history=engine.state.optJSONArray("history");
        for(int i=0;i<history.length();i++){JSONObject entry=history.optJSONObject(i),n=engine.story().optJSONObject(entry.optString("id"));if(n==null)continue;
            if(entry.has("choice")){JSONObject c=n.optJSONArray("choices").optJSONObject(entry.optInt("choice"));panel.addView(text(ui("choiceRole")+" · "+c.optString("label"),16,ORANGE));}
            else{JSONObject line=n;JSONArray variants=n.optJSONArray("variants");if(variants!=null)for(int j=0;j<variants.length();j++)if(StoryEngine.matches(variants.optJSONObject(j),entry.optJSONObject("flags"))){line=StoryEngine.merged(n,variants.optJSONObject(j));break;}panel.addView(text(line.optString("who",ui("narrator")),13,MUTED));panel.addView(text(line.optString("text"),17,PAPER));}}
        if(history.length()==0)panel.addView(text(ui("noHistory"),16,MUTED));showDialog(ui("historyTitle"),panel,ui("close"),null);
    }
    private void openSettings(){
        LinearLayout panel=column();panel.addView(text(ui("speed"),18,PAPER));SeekBar rate=new SeekBar(this);rate.setMax(65);rate.setProgress(speed);panel.addView(rate);panel.addView(text(ui("speedHelp"),13,MUTED));
        panel.addView(text(ui("size"),18,PAPER));SeekBar size=new SeekBar(this);size.setMax(12);size.setProgress(textSize-18);panel.addView(size);TextView preview=text(tr("文字大小預覽","Text size preview"),textSize,PAPER);panel.addView(preview);
        Switch motion=new Switch(this);motion.setText(tr("減少動態","Reduce motion"));motion.setTextColor(PAPER);motion.setChecked(reducedMotion);motion.setPadding(0,dp(14),0,dp(14));panel.addView(motion);
        SeekBar.OnSeekBarChangeListener changes=new SeekBar.OnSeekBarChangeListener(){public void onStartTrackingTouch(SeekBar s){}public void onStopTrackingTouch(SeekBar s){}public void onProgressChanged(SeekBar s,int value,boolean user){if(s==rate)speed=value;else{textSize=18+value;preview.setTextSize(textSize);}preferences.edit().putInt("speed",speed).putInt("size",textSize).apply();}};rate.setOnSeekBarChangeListener(changes);size.setOnSeekBarChangeListener(changes);
        motion.setOnCheckedChangeListener((b,on)->{reducedMotion=on;preferences.edit().putBoolean("reducedMotion",on).apply();});showDialog(ui("readSettings"),panel,ui("close"),this::renderCurrent);
    }
    private void openPrivacy(){
        LinearLayout panel=column();panel.addView(text(tr("遊戲進度、選擇、語言及閱讀設定只儲存在此裝置。清除程式資料或解除安裝會刪除此資料。","Story progress, choices, language and reading settings are stored only on this device. Clearing app data or uninstalling removes them."),17,PAPER));
        panel.addView(text(tr("本程式使用Google AdMob廣告服務。Google可能處理IP位址、廣告及裝置識別資料、診斷資料和廣告互動，以提供廣告及防止詐騙。適用地區會先顯示同意選項；你可隨時在選單更新可用的廣告私隱選項。拒絕或無法載入廣告不影響遊戲進度。","This app uses Google AdMob. Google may process IP addresses, device and advertising identifiers, diagnostics and ad interactions to serve ads and prevent fraud. Consent choices appear where required; available ad privacy choices can be reopened from the menu. Declining consent or unavailable ads never blocks the story."),17,PAPER));
        panel.addView(text("Google privacy policy: https://policies.google.com/privacy\nPrivacy questions: https://github.com/oneday1fact-boop/vicious-cycle/issues",14,MUTED));showDialog(tr("私隱政策","Privacy policy"),panel,ui("close"),null);
    }
    private void back(){
        if(activeDialog!=null){dismissDialog();return;}if(typing){reveal();return;}
        if(!screen.equals("cover")){if(hasSave)save();renderCover();return;}
        new AlertDialog.Builder(this).setTitle(tr("離開遊戲？","Leave the game?")).setNegativeButton(tr("繼續遊戲","Keep playing"),null).setPositiveButton(tr("離開","Leave"),(d,w)->finish()).show();
    }
    @Override protected void onPause(){if(engine!=null&&hasSave)save();super.onPause();}
    @Override protected void onDestroy(){stopTyping();super.onDestroy();}
}
