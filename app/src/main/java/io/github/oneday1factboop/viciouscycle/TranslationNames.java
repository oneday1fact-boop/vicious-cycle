package io.github.oneday1factboop.viciouscycle;

import java.util.*;
import java.util.regex.*;

/** Keep character names stable even when a translation model treats Long as an adjective. */
final class TranslationNames {
    private static final String[] NAMES={"Dr Lam","Dr Lui","Mr Ho","Ms Ho","Ching","Long","Kin","Tung","Ming"};
    private static final String[] JAPANESE={"ラム医師","ルイ医師","ホーさん","ホー弁護士","チン","ロン","キン","トン","ミン"};
    private static final Pattern PATTERN=Pattern.compile("\\b(Dr Lam|Dr Lui|Mr Ho|Ms Ho|Ching|Long|Kin|Tung|Ming)\\b");
    static String name(int index,String language){return language.equals("ja")?JAPANESE[index]:NAMES[index];}
    static final class Request {
        final List<String> pieces=new ArrayList<>();final List<Integer> names=new ArrayList<>();
        final String protectedText;
        Request(String source){
            Matcher matcher=PATTERN.matcher(source);int at=0;StringBuilder text=new StringBuilder();
            while(matcher.find()){
                String piece=source.substring(at,matcher.start());pieces.add(piece);text.append(piece);
                int index=Arrays.asList(NAMES).indexOf(matcher.group());names.add(index);text.append("ZXQPERSON").append(index).append("QXZ");at=matcher.end();
            }
            pieces.add(source.substring(at));text.append(source.substring(at));protectedText=text.toString();
        }
        String restore(String translation,String language){
            for(int index:new LinkedHashSet<>(names)){String token="ZXQPERSON"+index+"QXZ";if(!translation.contains(token))return null;translation=translation.replace(token,name(index,language));}
            return translation.contains("ZXQPERSON")?null:translation;
        }
        String exact(String language){return names.size()==1&&pieces.get(0).isEmpty()&&pieces.get(1).isEmpty()?name(names.get(0),language):null;}
    }
}
