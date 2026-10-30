package io.github.oneday1factboop.viciouscycle;

import org.json.*;
import org.junit.Test;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import static org.junit.Assert.*;

public class LanguagePackTest {
    private JSONObject data()throws Exception{return new JSONObject(new String(Files.readAllBytes(Paths.get(System.getProperty("vc.data"))),StandardCharsets.UTF_8));}
    @Test public void fullLanguagePacksChangeDisplayTextWithoutChangingAnyRoutesOrSaves()throws Exception{
        JSONObject data=data();JSONArray plan=data.getJSONArray("translationPlan");assertTrue(plan.length()>700);
        for(String language:new String[]{"ja","es","fr"}){
            JSONObject template=data.getJSONObject("languages").getJSONObject(language);
            Map<String,String> translated=new HashMap<>();for(String text:OfflineLanguagePack.sources(plan))translated.put(text,"["+language+"] "+text);
            JSONObject pack=OfflineLanguagePack.assemble(template,plan,translated);
            assertEquals(template.getJSONObject("ui").toString(),pack.getJSONObject("ui").toString());
            assertEquals(template.getJSONObject("nativeUi").toString(),pack.getJSONObject("nativeUi").toString());
            JSONObject source=template.getJSONObject("story"),story=pack.getJSONObject("story");assertEquals(167,story.length());
            for(Iterator<String> it=source.keys();it.hasNext();){String id=it.next();JSONObject a=source.getJSONObject(id),b=story.getJSONObject(id);
                for(String key:new String[]{"scene","next","continue","result","resolve","onEnter","learn","chapter","nextChapter"})assertEquals(id+"/"+key,String.valueOf(a.opt(key)),String.valueOf(b.opt(key)));
                if(a.has("text")&&!a.optString("text").isEmpty())assertEquals("["+language+"] "+a.optString("text"),b.optString("text"));
                if(a.has("choices")){JSONArray ac=a.getJSONArray("choices"),bc=b.getJSONArray("choices");assertEquals(ac.length(),bc.length());for(int i=0;i<ac.length();i++){assertEquals(ac.getJSONObject(i).getString("to"),bc.getJSONObject(i).getString("to"));assertEquals(String.valueOf(ac.getJSONObject(i).opt("set")),String.valueOf(bc.getJSONObject(i).opt("set")));assertTrue(bc.getJSONObject(i).getString("label").startsWith("["+language+"]"));}}
                if(a.has("ending"))assertEquals(3,b.getJSONObject("ending").getJSONArray("paragraphs").length());
            }
            StoryEngine e=new StoryEngine(data,"en",null);e.start();e.go("coldWallet");e.inspect(e.node().getJSONObject("action"),true);String saved=e.state.toString();
            StoryEngine.put(data.getJSONObject("languages"),language,pack);e.language=language;assertEquals(saved,e.state.toString());assertTrue(e.actionDone());assertTrue(e.node().getString("text").startsWith("["+language+"]"));
            assertEquals(65,pack.getJSONObject("art").length());
            translated.remove(OfflineLanguagePack.sources(plan).get(0));
            try{OfflineLanguagePack.assemble(template,plan,translated);fail("Partial packs must never replace a working language");}catch(IllegalArgumentException expected){}
        }
    }
    @Test public void allLanguagesHaveCompleteMenusAndNamesAreStable()throws Exception{
        JSONObject data=data();for(String language:GameLanguage.CODES){StoryEngine e=new StoryEngine(data,language,null);for(Iterator<String> it=data.getJSONObject("ui").keys();it.hasNext();){String key=it.next();assertFalse(language+":"+key,e.ui(key).isEmpty());}assertFalse(e.label("Music volume").isEmpty());assertFalse(e.label("Story haptics").isEmpty());}
        TranslationNames.Request repeated=new TranslationNames.Request("Long tells Kin that Long will return.");
        String restored=repeated.restore(repeated.protectedText,"ja");assertNotNull(restored);assertTrue(restored.contains("ロン"));assertTrue(restored.contains("キン"));assertFalse(restored.contains("ZXQPERSON"));
        assertNull(repeated.restore("A model dropped the name token.","ja"));assertEquals("ロン",new TranslationNames.Request("Long").exact("ja"));
        assertEquals("zh-Hans",GameLanguage.deviceLanguage(Locale.SIMPLIFIED_CHINESE));assertEquals("zh",GameLanguage.deviceLanguage(Locale.TRADITIONAL_CHINESE));assertEquals("fr",GameLanguage.deviceLanguage(Locale.CANADA_FRENCH));assertEquals("en",GameLanguage.normalize("unsupported"));
    }
}
