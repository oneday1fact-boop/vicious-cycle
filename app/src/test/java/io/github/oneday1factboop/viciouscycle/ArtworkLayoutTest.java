package io.github.oneday1factboop.viciouscycle;

import org.junit.Test;
import org.json.*;
import java.io.DataInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import static org.junit.Assert.*;

public class ArtworkLayoutTest {
    @Test public void everyIllustrationRemainsEntirelyVisibleAcrossAllViewports()throws Exception{
        Path dataPath=Paths.get(System.getProperty("vc.data"));
        JSONObject art=new JSONObject(new String(Files.readAllBytes(dataPath),StandardCharsets.UTF_8)).getJSONObject("art");
        Map<String,int[]> images=new HashMap<>();JSONArray report=new JSONArray();
        // Phone portrait/landscape, tall phone, tablet, evidence dialog and ending gallery.
        int[][] viewports={{320,210},{360,360},{392,420},{824,310},{280,220},{600,150},{1080,2400},{2400,1080},{800,1024},{1024,600}};
        for(Iterator<String> it=art.keys();it.hasNext();){String key=it.next();
            JSONObject frame=art.getJSONObject(key);String file=frame.getString("file");
            int[] image=images.get(file);
            if(image==null){
                try(DataInputStream in=new DataInputStream(Files.newInputStream(dataPath.getParent().resolve(file)))){
                    assertEquals("PNG header: "+file,0x89504e470d0a1a0aL,in.readLong());
                    assertEquals(13,in.readInt());assertEquals(0x49484452,in.readInt());image=new int[]{in.readInt(),in.readInt()};
                }
                images.put(file,image);
            }
            for(int[] size:viewports){
                ArtworkLayout.Bounds b=ArtworkLayout.fit(image[0],image[1],frame.getInt("cols"),frame.getInt("rows"),frame.getInt("col"),frame.getInt("row"),size[0],size[1]);
                String message=key+" in "+size[0]+"x"+size[1];
                assertTrue(message,b.left>=-.001f&&b.top>=-.001f&&b.right<=size[0]+.001f&&b.bottom<=size[1]+.001f);
                assertTrue(message,b.right>b.left&&b.bottom>b.top);
                assertTrue("Use the available space: "+message,Math.abs(b.right-b.left-size[0])<.001f||Math.abs(b.bottom-b.top-size[1])<.001f);
                assertEquals("Keep the composition's aspect ratio: "+message,(b.sourceRight-b.sourceLeft)/(double)(b.sourceBottom-b.sourceTop),(b.right-b.left)/(double)(b.bottom-b.top),.00001);
                assertEquals(message,size[0],b.left+b.right,.001f);assertEquals(message,size[1],b.top+b.bottom,.001f);
                assertEquals(message,image[0]*frame.getInt("col")/frame.getInt("cols"),b.sourceLeft);
                assertEquals(message,image[1]*frame.getInt("row")/frame.getInt("rows"),b.sourceTop);
                assertEquals(message,image[0]*(frame.getInt("col")+1)/frame.getInt("cols"),b.sourceRight);
                assertEquals(message,image[1]*(frame.getInt("row")+1)/frame.getInt("rows"),b.sourceBottom);
                JSONObject entry=new JSONObject();entry.put("key",key);entry.put("file",file);entry.put("viewport",new JSONArray(size));
                entry.put("source",new JSONArray(new int[]{b.sourceLeft,b.sourceTop,b.sourceRight,b.sourceBottom}));
                entry.put("destination",new JSONArray(new float[]{b.left,b.top,b.right,b.bottom}));report.put(entry);
            }
        }
        assertEquals(65,art.length());assertEquals(650,report.length());
        String reportPath=System.getProperty("vc.art.report");
        if(reportPath!=null){Path path=Paths.get(reportPath);Files.createDirectories(path.getParent());Files.write(path,report.toString(2).getBytes(StandardCharsets.UTF_8));}
    }

    @Test public void atlasRemainderPixelsAreNotLostOrTakenFromANeighbour(){
        ArtworkLayout.Bounds b=ArtworkLayout.fit(1001,701,3,2,2,1,300,600);
        assertEquals(1001,b.sourceRight);assertEquals(701,b.sourceBottom);
        ArtworkLayout.Bounds previous=ArtworkLayout.fit(1001,701,3,2,1,1,300,600);
        assertEquals(previous.sourceRight,b.sourceLeft);
    }
    @Test public void fullScreenCoverAlwaysFillsTheScreenWithoutAffectingStoryFit()throws Exception{
        JSONArray report=new JSONArray();
        for(int[] viewport:new int[][]{{320,480},{360,800},{1080,2400},{800,360},{800,1280}}){
            ArtworkLayout.Bounds cover=ArtworkLayout.cover(1672,941,viewport[0],viewport[1]);
            assertTrue(cover.left<=.001&&cover.top<=.001&&cover.right>=viewport[0]-.001&&cover.bottom>=viewport[1]-.001);
            assertEquals(1672d/941,(cover.right-cover.left)/(cover.bottom-cover.top),.00001);
            float eye=cover.left+.84f*(cover.right-cover.left);assertTrue("Keep the cover's eye visible",eye>=0&&eye<=viewport[0]);
            JSONObject entry=new JSONObject();entry.put("file","assets/creepy-cover.png");entry.put("viewport",new JSONArray(viewport));entry.put("source",new JSONArray(new int[]{0,0,1672,941}));entry.put("destination",new JSONArray(new float[]{cover.left,cover.top,cover.right,cover.bottom}));report.put(entry);
            ArtworkLayout.Bounds story=ArtworkLayout.fit(1536,1024,3,2,0,0,viewport[0],viewport[1]);
            assertTrue(story.left>=-.001&&story.top>=-.001&&story.right<=viewport[0]+.001&&story.bottom<=viewport[1]+.001);
        }
        String path=System.getProperty("vc.art.report");if(path!=null){Path output=Paths.get(path).getParent().resolve("cover-layout.json");Files.createDirectories(output.getParent());Files.write(output,report.toString(2).getBytes(StandardCharsets.UTF_8));}
    }
}
