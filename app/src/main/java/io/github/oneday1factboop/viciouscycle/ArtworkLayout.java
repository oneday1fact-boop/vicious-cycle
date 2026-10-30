package io.github.oneday1factboop.viciouscycle;

/** Fits one complete atlas frame inside its viewport without cropping or stretching. */
final class ArtworkLayout {
    static final class Bounds {
        final int sourceLeft,sourceTop,sourceRight,sourceBottom;
        final float left,top,right,bottom;
        Bounds(int sl,int st,int sr,int sb,float l,float t,float r,float b){
            sourceLeft=sl;sourceTop=st;sourceRight=sr;sourceBottom=sb;
            left=l;top=t;right=r;bottom=b;
        }
    }
    static Bounds fit(int imageWidth,int imageHeight,int cols,int rows,int col,int row,int width,int height){
        if(imageWidth<cols||imageHeight<rows||cols<1||rows<1||col<0||col>=cols||row<0||row>=rows||width<1||height<1)
            throw new IllegalArgumentException("Invalid artwork frame or viewport");
        int sl=imageWidth*col/cols,st=imageHeight*row/rows;
        int sr=imageWidth*(col+1)/cols,sb=imageHeight*(row+1)/rows;
        float scale=Math.min(width/(float)(sr-sl),height/(float)(sb-st));
        float drawnWidth=(sr-sl)*scale,drawnHeight=(sb-st)*scale;
        return new Bounds(sl,st,sr,sb,(width-drawnWidth)/2,(height-drawnHeight)/2,
                (width+drawnWidth)/2,(height+drawnHeight)/2);
    }
}
