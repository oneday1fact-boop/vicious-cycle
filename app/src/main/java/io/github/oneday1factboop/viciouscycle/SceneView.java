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

/** Displays a complete illustration on an Android Canvas, with optional fade-in. */
public final class SceneView extends View {
    private static final ExecutorService DECODER=Executors.newSingleThreadExecutor();
    private static final LruCache<String,Bitmap> CACHE=new LruCache<String,Bitmap>(24*1024*1024){
        @Override protected int sizeOf(String key,Bitmap value){return value.getAllocationByteCount();}
    };
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);
    private final Rect sourceRect=new Rect();
    private final RectF destination=new RectF();
    private JSONObject frame;
    private Bitmap bitmap;
    private String file="";
    private float opacity=1;
    private ValueAnimator animation;
    private boolean fullScreenCover;
    public SceneView(Context context){super(context);setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_YES);}
    public void fullScreenCover(){fullScreenCover=true;invalidate();}
    public void scene(JSONObject source,String description,boolean motion){
        frame=source;setContentDescription(description);String next=source.optString("file");file=next;
        if(animation!=null)animation.cancel();opacity=motion?.7f:1;
        bitmap=null;
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
        if(motion){animation=ValueAnimator.ofFloat(.7f,1f);animation.setDuration(450);animation.addUpdateListener(a->{opacity=(float)a.getAnimatedValue();invalidate();});animation.start();}
    }
    @Override protected void onDraw(Canvas canvas){
        super.onDraw(canvas);canvas.drawColor(Color.rgb(23,19,16));
        if(bitmap==null||frame==null||getWidth()<1||getHeight()<1)return;
        ArtworkLayout.Bounds bounds=fullScreenCover?ArtworkLayout.cover(bitmap.getWidth(),bitmap.getHeight(),getWidth(),getHeight()):ArtworkLayout.fit(bitmap.getWidth(),bitmap.getHeight(),
                frame.optInt("cols",1),frame.optInt("rows",1),frame.optInt("col"),frame.optInt("row"),getWidth(),getHeight());
        destination.set(bounds.left,bounds.top,bounds.right,bounds.bottom);
        sourceRect.set(bounds.sourceLeft,bounds.sourceTop,bounds.sourceRight,bounds.sourceBottom);
        paint.setAlpha(Math.round(255*opacity));canvas.drawBitmap(bitmap,sourceRect,destination,paint);
    }
    @Override protected void onDetachedFromWindow(){if(animation!=null)animation.cancel();super.onDetachedFromWindow();}
}
