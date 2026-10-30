package io.github.oneday1factboop.viciouscycle;

import org.json.*;
import java.util.*;

/** Applies translated display text only; story IDs, conditions and destinations stay intact. */
final class OfflineLanguagePack {
    static List<String> sources(JSONArray plan){
        Set<String> unique=new LinkedHashSet<>();for(int i=0;i<plan.length();i++)unique.add(plan.optJSONObject(i).optString("source"));
        return new ArrayList<>(unique);
    }
    static JSONObject assemble(JSONObject template,JSONArray plan,Map<String,String> translated){
        JSONObject result=StoryEngine.copy(template);
        for(int i=0;i<plan.length();i++){
            JSONObject item=plan.optJSONObject(i);String source=item.optString("source"),value=translated.get(source);
            if(value==null||value.trim().isEmpty())throw new IllegalArgumentException("Incomplete language pack");
            JSONArray path=item.optJSONArray("path");Object parent=result;
            for(int at=0;at<path.length()-1;at++)parent=parent instanceof JSONObject?((JSONObject)parent).opt(path.optString(at)):((JSONArray)parent).opt(Integer.parseInt(path.optString(at)));
            String last=path.optString(path.length()-1);
            try{if(parent instanceof JSONObject)((JSONObject)parent).put(last,value);else ((JSONArray)parent).put(Integer.parseInt(last),value);}catch(JSONException e){throw new IllegalStateException(e);}
        }
        return result;
    }
}
