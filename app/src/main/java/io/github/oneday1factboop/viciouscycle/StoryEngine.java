package io.github.oneday1factboop.viciouscycle;

import org.json.JSONArray;
import org.json.JSONObject;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

/** Platform-independent branching engine shared by the native reader and route checks. */
public final class StoryEngine {
    public final JSONObject data;
    public JSONObject state;
    public String language;
    public StoryEngine(JSONObject data, String language, JSONObject saved) {
        this.data = data; this.language = language;
        state = saved != null && story().has(saved.optString("id")) ? copy(saved) : fresh();
    }
    public JSONObject story() { return data.optJSONObject("languages").optJSONObject(language).optJSONObject("story"); }
    public JSONObject locale() { return data.optJSONObject("languages").optJSONObject(language); }
    public String ui(String key) {
        JSONArray pair = data.optJSONObject("ui").optJSONArray(key);
        return pair == null ? key : pair.optString(language.equals("en") ? 1 : 0, key);
    }
    public JSONObject fresh() {
        JSONObject s = new JSONObject();
        put(s,"id", data.optString("start"));
        for(String key:new String[]{"flags","actions","checkpoints"}) put(s,key,new JSONObject());
        for(String key:new String[]{"notes","history","trail"}) put(s,key,new JSONArray());
        put(s,"part",0); return s;
    }
    public void start() { state=fresh(); go(data.optString("start")); }
    public JSONObject node() { return story().optJSONObject(state.optString("id")); }
    public int chapter() { return node().optInt("chapter",1); }
    public static JSONObject copy(JSONObject source) {
        try { return new JSONObject(source.toString()); } catch(Exception e) { throw new IllegalStateException(e); }
    }
    public static void put(JSONObject o,String k,Object v) {
        try { o.put(k,v); } catch(Exception e) { throw new IllegalStateException(e); }
    }
    public static JSONObject merged(JSONObject a,JSONObject b) {
        JSONObject result=copy(a); if(b!=null) for(Iterator<String> it=b.keys();it.hasNext();) {String k=it.next();put(result,k,b.opt(k));}
        return result;
    }
    public static boolean matches(JSONObject rule,JSONObject flags) {
        Object value=flags.opt(rule.optString("flag"));
        if(rule.has("value")) return rule.opt("value").equals(value);
        return value!=null && value!=JSONObject.NULL && !Boolean.FALSE.equals(value) && !"".equals(value) && !Integer.valueOf(0).equals(value);
    }
    private static JSONObject match(JSONArray variants,JSONObject flags) {
        if(variants!=null) for(int i=0;i<variants.length();i++) if(matches(variants.optJSONObject(i),flags))return variants.optJSONObject(i);
        return null;
    }
    public JSONObject variant(JSONObject source) { return merged(source,match(source.optJSONArray("variants"),state.optJSONObject("flags"))); }
    public void go(String id) {
        JSONObject n=null;
        for(int guard=0;guard<64;guard++) {
            n=story().optJSONObject(id);
            if(n==null) throw new IllegalStateException("Missing scene "+id);
            JSONObject redirect=match(n.optJSONArray("resolve"),state.optJSONObject("flags"));
            if(redirect==null)break;
            id=redirect.optString("to");
            if(guard==63)throw new IllegalStateException("Story redirect cycle");
        }
        put(state,"id",id);put(state,"part",0);
        put(state,"flags",merged(state.optJSONObject("flags"),n.optJSONObject("onEnter")));
        learn(n.optJSONArray("learn"));
        JSONObject event=new JSONObject();put(event,"id",id);put(event,"flags",copy(state.optJSONObject("flags")));
        state.optJSONArray("history").put(event);
    }
    public void learn(JSONArray keys) {
        if(keys!=null) for(int i=0;i<keys.length();i++) if(!hasNote(keys.optString(i)))state.optJSONArray("notes").put(keys.optString(i));
    }
    public boolean hasNote(String key) {
        JSONArray notes=state.optJSONArray("notes");for(int i=0;i<notes.length();i++)if(key.equals(notes.optString(i)))return true;return false;
    }
    public boolean actionDone() { return state.optJSONObject("actions").optBoolean(state.optString("id")); }
    public void inspect(JSONObject source,boolean mandatory) {
        learn(source.optJSONArray("learn"));
        if(mandatory)put(state.optJSONObject("actions"),state.optString("id"),true);
    }
    public JSONObject snapshot() { JSONObject s=copy(state);s.remove("trail");return s; }
    public void choose(int index) {
        JSONObject c=node().optJSONArray("choices").optJSONObject(index);
        if(c==null)throw new IllegalArgumentException("Missing choice");
        state.optJSONArray("trail").put(snapshot());
        JSONObject event=new JSONObject();put(event,"id",state.optString("id"));put(event,"choice",index);state.optJSONArray("history").put(event);
        put(state,"flags",merged(state.optJSONObject("flags"),c.optJSONObject("set")));go(c.optString("to"));
    }
    public boolean next() {
        if(node().has("action")&&!actionDone())return false;
        String next=node().optString("next");if(next.isEmpty())return false;go(next);return true;
    }
    public void continueChapter() {
        JSONObject n=node();if(!n.has("continue"))return;
        if(chapter()==1)put(state.optJSONObject("flags"),"chapterOneResult",n.opt("result"));
        JSONObject base=snapshot();put(base,"id",n.optString("continue"));
        put(state.optJSONObject("checkpoints"),String.valueOf(n.optInt("nextChapter",chapter()+1)),base);
        go(n.optString("continue"));
    }
    public JSONObject checkpoint(int chapter) { return chapter==1?fresh():state.optJSONObject("checkpoints").optJSONObject(String.valueOf(chapter)); }
    public void replay(int chapter) {
        JSONObject base=checkpoint(chapter);if(base==null)return;
        JSONObject checkpoints=copy(state.optJSONObject("checkpoints"));
        for(Iterator<String> it=checkpoints.keys();it.hasNext();)if(Integer.parseInt(it.next())>chapter)it.remove();
        JSONArray trail=new JSONArray(),old=state.optJSONArray("trail");
        for(int i=0;i<old.length();i++)if(story().optJSONObject(old.optJSONObject(i).optString("id")).optInt("chapter",1)<chapter)trail.put(copy(old.optJSONObject(i)));
        state=copy(base);put(state,"checkpoints",checkpoints);put(state,"trail",trail);go(state.optString("id"));
    }
    private void restore(int index) {
        JSONArray old=state.optJSONArray("trail"),trail=new JSONArray();
        for(int i=0;i<index;i++)trail.put(copy(old.optJSONObject(i)));
        state=copy(old.optJSONObject(index));put(state,"trail",trail);
    }
    public boolean retry() { int count=state.optJSONArray("trail").length();if(count==0)return false;restore(count-1);return true; }
    public boolean canReach(String id,JSONObject flags,int target) { return canReach(id,flags,target,new HashMap<>(),new HashSet<>()); }
    private boolean canReach(String id,JSONObject flags,int target,Map<String,Boolean> memo,Set<String> visiting) {
        JSONObject n=story().optJSONObject(id);if(n==null)return false;
        String key=id+"|"+target+"|"+flags.toString();
        if(memo.containsKey(key))return memo.get(key);if(!visiting.add(key))return false;
        JSONObject redirect=match(n.optJSONArray("resolve"),flags);boolean result=false;
        if(redirect!=null)result=canReach(redirect.optString("to"),flags,target,memo,visiting);
        else if(n.optInt("chapter",1)>=target)result=true;
        else {
            JSONObject updated=merged(flags,n.optJSONObject("onEnter"));JSONArray choices=n.optJSONArray("choices");
            if(choices!=null)for(int i=0;i<choices.length();i++){JSONObject c=choices.optJSONObject(i);if(canReach(c.optString("to"),merged(updated,c.optJSONObject("set")),target,memo,visiting)){result=true;break;}}
            else if(n.has("continue")){if(n.optInt("chapter",1)==1)put(updated,"chapterOneResult",n.opt("result"));result=canReach(n.optString("continue"),updated,target,memo,visiting);}
            else if(n.has("next"))result=canReach(n.optString("next"),updated,target,memo,visiting);
        }
        visiting.remove(key);memo.put(key,result);return result;
    }
    public int recoveryIndex() {
        int target=chapter()+1;if(target>5)return -1;
        JSONArray trail=state.optJSONArray("trail");
        for(int i=trail.length()-1;i>=0;i--){JSONObject s=trail.optJSONObject(i),n=story().optJSONObject(s.optString("id"));JSONArray choices=n.optJSONArray("choices");
            if(choices!=null)for(int j=0;j<choices.length();j++){JSONObject c=choices.optJSONObject(j);if(canReach(c.optString("to"),merged(s.optJSONObject("flags"),c.optJSONObject("set")),target))return i;}}
        return -1;
    }
    public boolean recover() {int at=recoveryIndex();if(at<0)return false;restore(at);return true;}
}
