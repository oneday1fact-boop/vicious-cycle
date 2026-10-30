package io.github.oneday1factboop.viciouscycle;

final class HapticPatterns {
    static final class Pulse {
        final long[] timings;
        final int[] amplitudes;
        Pulse(long[] t,int[] a){timings=t;amplitudes=a;}
    }
    static Pulse forEffect(String effect,int strength){
        long[] times;int[] levels;
        switch(effect){
            case "impact":case "coins":case "scream":
                times=new long[]{0,24,55,38};levels=new int[]{0,180,0,130};break;
            case "alarm":
                times=new long[]{0,22,70,22,70,22};levels=new int[]{0,150,0,150,0,150};break;
            case "press":case "trapped":
                times=new long[]{0,28,85,18};levels=new int[]{0,150,0,100};break;
            case "halt":case "rush":case "threat":case "preview":
                times=new long[]{0,20};levels=new int[]{0,125};break;
            case "paper":case "wallet":case "document":case "phone":case "screen":case "window":case "door":case "signature":
                times=new long[]{0,12};levels=new int[]{0,100};break;
            default:return new Pulse(new long[0],new int[0]);
        }
        float amount=Math.max(1,Math.min(100,strength))/100f;
        for(int i=0;i<levels.length;i++)if(levels[i]>0)levels[i]=Math.max(1,Math.round(levels[i]*amount));
        return new Pulse(times,levels);
    }
}
