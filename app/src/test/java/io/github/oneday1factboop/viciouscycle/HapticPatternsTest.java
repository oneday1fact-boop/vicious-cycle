package io.github.oneday1factboop.viciouscycle;

import org.junit.Test;
import static org.junit.Assert.*;

public class HapticPatternsTest {
    @Test public void storyEffectsStayShortAndRespectTheSelectedStrength(){
        for(String effect:new String[]{"impact","coins","scream","alarm","press","trapped","halt","rush","threat","paper","wallet","phone","screen","door","preview"}){
            HapticPatterns.Pulse light=HapticPatterns.forEffect(effect,10),strong=HapticPatterns.forEffect(effect,100);assertEquals(light.timings.length,strong.timings.length);assertEquals(light.timings.length,light.amplitudes.length);long duration=0;
            for(int i=0;i<strong.timings.length;i++){duration+=strong.timings[i];assertTrue(strong.amplitudes[i]>=light.amplitudes[i]);assertTrue(strong.amplitudes[i]>=0&&strong.amplitudes[i]<=255);}
            assertTrue(effect,duration>0&&duration<350);
        }
        assertEquals(0,HapticPatterns.forEffect("ordinary dialogue",50).timings.length);
    }
}
