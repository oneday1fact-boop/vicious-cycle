package io.github.oneday1factboop.viciouscycle;

import org.junit.Test;
import org.json.*;
import java.nio.file.*;
import java.util.*;
import static org.junit.Assert.*;

public class StoryEngineTest {
    private JSONObject data()throws Exception{return new JSONObject(Files.readString(Path.of(System.getProperty("vc.data"))));}
    private JSONObject redirect(JSONObject n,JSONObject flags){JSONArray rules=n.optJSONArray("resolve");if(rules!=null)for(int i=0;i<rules.length();i++)if(StoryEngine.matches(rules.optJSONObject(i),flags))return rules.optJSONObject(i);return null;}
    private List<Integer> path(JSONObject story,String id,JSONObject flags,String target,Set<String> visited){
        if(id.equals(target))return new ArrayList<>();
        JSONObject n=story.optJSONObject(id);String key=id+flags.toString();if(n==null||!visited.add(key))return null;
        JSONObject r=redirect(n,flags);if(r!=null)return path(story,r.optString("to"),flags,target,visited);
        JSONObject updated=StoryEngine.merged(flags,n.optJSONObject("onEnter"));JSONArray choices=n.optJSONArray("choices");
        if(choices!=null){for(int i=0;i<choices.length();i++){JSONObject c=choices.optJSONObject(i);List<Integer> rest=path(story,c.optString("to"),StoryEngine.merged(updated,c.optJSONObject("set")),target,visited);if(rest!=null){rest.add(0,i);return rest;}}}
        else if(n.has("continue")){if(n.optInt("chapter",1)==1)StoryEngine.put(updated,"chapterOneResult",n.opt("result"));return path(story,n.optString("continue"),updated,target,visited);}
        else if(n.has("next"))return path(story,n.optString("next"),updated,target,visited);
        return null;
    }
    private void drive(StoryEngine engine,String target,List<Integer> choices){
        int at=0;
        for(int guard=0;guard<300;guard++){
            if(engine.state.optString("id").equals(target))return;
            JSONObject n=engine.node();if(n.has("action"))engine.inspect(n.optJSONObject("action"),true);
            if(n.has("choices")){assertTrue(at<choices.size());engine.choose(choices.get(at++));}
            else if(n.has("continue"))engine.continueChapter();else assertTrue("Unexpected dead end "+engine.state.optString("id"),engine.next());
        }
        fail("Route did not terminate");
    }
    @Test public void allTenEndingsRunInBothLanguagesAndRecoverAcrossChapters()throws Exception{
        JSONObject data=data();int endingCount=0;
        for(String language:new String[]{"zh","en"}){
            StoryEngine source=new StoryEngine(data,language,null);
            for(Iterator<String> it=source.story().keys();it.hasNext();){String id=it.next();if(!source.story().optJSONObject(id).has("ending"))continue;
                endingCount++;StoryEngine engine=new StoryEngine(data,language,null);engine.start();
                List<Integer> route=path(engine.story(),engine.state.optString("id"),engine.state.optJSONObject("flags"),id,new HashSet<>());assertNotNull("Unreachable ending "+id,route);drive(engine,id,route);assertTrue(engine.node().has("ending"));
                StoryEngine restored=new StoryEngine(data,language,engine.state);assertEquals(engine.state.toString(),restored.state.toString());
                if(engine.chapter()<5){int target=engine.chapter()+1;int recovery=engine.recoveryIndex();assertTrue("No continuation after "+id,recovery>=0);JSONObject expected=StoryEngine.copy(engine.state.optJSONArray("trail").optJSONObject(recovery));assertTrue(restored.recover());assertEquals(expected.optString("id"),restored.state.optString("id"));assertEquals(expected.optJSONObject("flags").toString(),restored.state.optJSONObject("flags").toString());
                    for(int guard=0;guard<300&&restored.chapter()<target;guard++){
                        JSONObject n=restored.node();if(n.has("action"))restored.inspect(n.optJSONObject("action"),true);
                        JSONArray options=n.optJSONArray("choices");if(options!=null){boolean selected=false;for(int i=0;i<options.length();i++){JSONObject c=options.optJSONObject(i);if(restored.canReach(c.optString("to"),StoryEngine.merged(restored.state.optJSONObject("flags"),c.optJSONObject("set")),target)){restored.choose(i);selected=true;break;}}assertTrue(selected);}
                        else if(n.has("continue"))restored.continueChapter();else assertTrue(restored.next());
                    }
                    assertTrue("Recovery loop after "+id,restored.chapter()>=target);
                }
                assertTrue(engine.retry());assertTrue(engine.node().has("choices"));
            }
        }
        assertEquals(20,endingCount);
    }
    @Test public void nativeDataIsCompleteAndLanguageDoesNotChangeProgress()throws Exception{
        StoryEngine e=new StoryEngine(data(),"zh",null);e.start();assertEquals(167,e.story().length());String state=e.state.toString();e.language="en";assertEquals(state,e.state.toString());assertEquals("Vicious Cycle",e.ui("title"));assertFalse(e.node().optString("text").matches(".*[\\u4e00-\\u9fff].*"));assertEquals(65,e.data.optJSONObject("art").length());
        for(Iterator<String> it=e.story().keys();it.hasNext();){String id=it.next();JSONObject n=e.story().optJSONObject(id);assertTrue(e.data.optJSONObject("art").has(n.optString("scene")));if(n.has("ending"))assertEquals(3,n.optJSONObject("ending").optJSONArray("paragraphs").length());}
    }
    @Test public void mandatoryInspectionAndCheckpointReplayPreserveMeaning()throws Exception{
        StoryEngine e=new StoryEngine(data(),"en",null);e.start();List<Integer> route=path(e.story(),e.state.optString("id"),e.state.optJSONObject("flags"),"c3_wait",new HashSet<>());assertNotNull(route);drive(e,"c3_wait",route);assertNotNull(e.checkpoint(2));assertNotNull(e.checkpoint(3));e.replay(2);assertEquals(2,e.chapter());assertNull(e.checkpoint(3));
        e.go("coldWallet");assertTrue(e.node().has("action"));assertFalse(e.next());e.inspect(e.node().optJSONObject("action"),true);assertTrue(e.actionDone());assertTrue(e.next());
    }
}
