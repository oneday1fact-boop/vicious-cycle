package io.github.oneday1factboop.viciouscycle;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.*;
import android.util.LruCache;
import android.view.View;
import org.json.JSONObject;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Renders a cropped illustration directly on an Android Canvas. */
public final class SceneView extends View {
    private static final ExecutorService DECODER=Executors.newSingleThreadExecutor();
    private static final LruCache<String,Bitmap> CACHE=new LruCache<String,Bitmap>(24*1024*1024){
        @Override protected int sizeOf(String key,Bitmap value){return value.getAllocationByteCount();}
    };
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);
    private JSONObject frame;
    private Bitmap bitmap;
    private String file="";
    private float zoom=1;
    private ValueAnimator animation;
    public SceneView(Context context){super(context);setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_YES);}
    public void scene(JSONObject source,String description,boolean motion){
        frame=source;setContentDescription(description);String next=source.optString("file");file=next;
        if(animation!=null)animation.cancel();zoom=motion?1.035f:1;
        Bitmap cached=CACHE.get(next);
        if(cached!=null){bitmap=cached;invalidate();}
        else DECODER.execute(()->{
            Bitmap decoded=null;
            try(InputStream stream=getContext().getAssets().open("game/"+next)){
                BitmapFactory.Options options=new BitmapFactory.Options();options.inPreferredConfig=Bitmap.Config.RGB_565;
                decoded=BitmapFactory.decodeStream(stream,null,options);
            }catch(Exception ignored){}
            final Bitmap result=decoded;if(result!=null)CACHE.put(next,result);
            post(()->{if(file.equals(next)){bitmap=result;invalidate();}});
        });
        if(motion){animation=ValueAnimator.ofFloat(1.035f,1f);animation.setDuration(1100);animation.addUpdateListener(a->{zoom=(float)a.getAnimatedValue();invalidate();});animation.start();}
    }
    @Override protected void onDraw(Canvas canvas){
        super.onDraw(canvas);canvas.drawColor(Color.rgb(23,19,16));
        if(bitmap==null||frame==null)return;
        int cellW=bitmap.getWidth()/frame.optInt("cols",1),cellH=bitmap.getHeight()/frame.optInt("rows",1);
        int left=frame.optInt("col")*cellW,top=frame.optInt("row")*cellH;
        float ratio=Math.max(getWidth()/(float)cellW,getHeight()/(float)cellH)*zoom;
        float width=cellW*ratio,height=cellH*ratio;
        RectF dest=new RectF((getWidth()-width)/2,(getHeight()-height)/2,(getWidth()+width)/2,(getHeight()+height)/2);
        paint.setShader(null);canvas.drawBitmap(bitmap,new Rect(left,top,left+cellW,top+cellH),dest,paint);
        paint.setShader(new LinearGradient(0,0,0,getHeight(),new int[]{0x99000000,0x08000000,0xE8171310},new float[]{0,.4f,1},Shader.TileMode.CLAMP));
        canvas.drawRect(0,0,getWidth(),getHeight(),paint);paint.setShader(null);
    }
    @Override protected void onDetachedFromWindow(){if(animation!=null)animation.cancel();super.onDetachedFromWindow();}
}
