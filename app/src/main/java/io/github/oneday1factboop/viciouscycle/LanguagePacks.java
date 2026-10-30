package io.github.oneday1factboop.viciouscycle;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.AtomicFile;
import com.google.mlkit.common.model.DownloadConditions;
import com.google.mlkit.nl.translate.*;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.Consumer;

/** Download once, prepare every branch, save atomically, then read the whole story offline. */
final class LanguagePacks {
    interface Listener {void progress(int done,int total);void ready();void failed();}
    private final Context context;
    private final JSONObject data;
    private final Set<String> ready=new HashSet<>(Arrays.asList("zh","zh-Hans","en"));
    private final Handler handler=new Handler(Looper.getMainLooper());
    private Translator translator;
    private int generation;
    LanguagePacks(Context context,JSONObject data){this.context=context;this.data=data;load();}
    boolean ready(String code){return ready.contains(code);}
    boolean busy(){return translator!=null;}
    private AtomicFile cache(String code){File dir=new File(context.getFilesDir(),"language-packs");if(!dir.exists())dir.mkdirs();return new AtomicFile(new File(dir,code+".json"));}
    private void load(){
        for(String code:new String[]{"ja","es","fr"})try{
            JSONObject saved=new JSONObject(new String(cache(code).readFully(),StandardCharsets.UTF_8));
            JSONObject locale=saved.optJSONObject("locale");
            if(saved.optString("fingerprint").equals(data.optString("translationFingerprint"))&&locale!=null&&locale.optJSONObject("story").length()==data.optJSONObject("languages").optJSONObject("en").optJSONObject("story").length()){
                JSONObject current=data.optJSONObject("languages").optJSONObject(code);
                StoryEngine.put(locale,"ui",current.optJSONObject("ui"));StoryEngine.put(locale,"nativeUi",current.optJSONObject("nativeUi"));
                StoryEngine.put(data.optJSONObject("languages"),code,locale);ready.add(code);
            }
        }catch(Exception ignored){/* A missing or stale pack is prepared again on demand. */}
    }
    void cancel(){generation++;if(translator!=null){translator.close();translator=null;}}
    void prepare(String code,Listener listener){
        if(ready(code)){listener.ready();return;}
        if(!Arrays.asList("ja","es","fr").contains(code)){listener.failed();return;}
        cancel();final int run=generation;
        Translator client=Translation.getClient(new TranslatorOptions.Builder().setSourceLanguage(TranslateLanguage.ENGLISH).setTargetLanguage(code).build());translator=client;
        List<String> strings=OfflineLanguagePack.sources(data.optJSONArray("translationPlan"));Map<String,String> translated=new LinkedHashMap<>();
        client.downloadModelIfNeeded(new DownloadConditions.Builder().build()).addOnSuccessListener(v->{if(run==generation)next(run,client,code,strings,0,translated,listener);}).addOnFailureListener(e->fail(run,listener));
    }
    private void next(int run,Translator client,String code,List<String> strings,int index,Map<String,String> words,Listener listener){
        if(run!=generation)return;
        listener.progress(index,strings.size());
        if(index==strings.size()){
            try{
                JSONObject pack=OfflineLanguagePack.assemble(data.optJSONObject("languages").optJSONObject(code),data.optJSONArray("translationPlan"),words);
                JSONObject saved=new JSONObject();saved.put("fingerprint",data.optString("translationFingerprint"));saved.put("locale",pack);
                AtomicFile file=cache(code);FileOutputStream out=null;
                try{out=file.startWrite();out.write(saved.toString().getBytes(StandardCharsets.UTF_8));file.finishWrite(out);}catch(Exception e){if(out!=null)file.failWrite(out);throw e;}
                StoryEngine.put(data.optJSONObject("languages"),code,pack);ready.add(code);cancel();listener.ready();
            }catch(Exception e){fail(run,listener);}return;
        }
        String source=strings.get(index);TranslationNames.Request request=new TranslationNames.Request(source);
        Consumer<String> done=value->{if(run!=generation)return;if(value==null||value.trim().isEmpty()){fail(run,listener);return;}words.put(source,value);handler.post(()->next(run,client,code,strings,index+1,words,listener));};
        String exact=request.exact(code);if(exact!=null){done.accept(exact);return;}
        client.translate(request.protectedText).addOnSuccessListener(value->{
            if(run!=generation)return;String restored=request.restore(value,code);
            if(restored!=null)done.accept(restored);else pieces(run,client,code,request,0,new StringBuilder(),done,listener);
        }).addOnFailureListener(e->fail(run,listener));
    }
    private void pieces(int run,Translator client,String code,TranslationNames.Request request,int index,StringBuilder result,Consumer<String> done,Listener listener){
        if(run!=generation)return;
        if(index==request.pieces.size()){done.accept(result.toString());return;}
        String source=request.pieces.get(index);
        Consumer<String> append=value->{if(run!=generation)return;result.append(value);if(index<request.names.size())result.append(TranslationNames.name(request.names.get(index),code));pieces(run,client,code,request,index+1,result,done,listener);};
        if(source.trim().isEmpty())append.accept(source);
        else client.translate(source).addOnSuccessListener(value->{String before=source.startsWith(" ")?" ":"",after=source.endsWith(" ")?" ":"";append.accept(before+value+after);}).addOnFailureListener(e->fail(run,listener));
    }
    private void fail(int run,Listener listener){if(run!=generation)return;cancel();listener.failed();}
}
