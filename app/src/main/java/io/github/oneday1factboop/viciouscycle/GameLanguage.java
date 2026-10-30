package io.github.oneday1factboop.viciouscycle;

import java.util.Locale;

final class GameLanguage {
    static final String[] CODES={"zh","zh-Hans","en","ja","es","fr"};
    static final String[] NAMES={"繁體中文","简体中文","English","日本語","Español","Français"};
    static String normalize(String code){
        for(String supported:CODES)if(supported.equals(code))return supported;
        return "en";
    }
    static String deviceLanguage(Locale locale){
        String language=locale.getLanguage();
        if(language.equals("zh"))return locale.getScript().equals("Hans")||locale.getCountry().equals("CN")||locale.getCountry().equals("SG")?"zh-Hans":"zh";
        return normalize(language);
    }
    static int index(String code){for(int i=0;i<CODES.length;i++)if(CODES[i].equals(code))return i;return 2;}
    static boolean cjk(String code){return code.equals("zh")||code.equals("zh-Hans")||code.equals("ja");}
}
