const displayKeys=new Set(['section','who','text','label','cue','feedback','title','card','reason','name']);
function visible(path){
 if(path[0]==='ui'||path[0]==='nativeUi')return false;
 if(path[0]==='art')return true;
 const key=path.at(-1);
 return displayKeys.has(key)||path.at(-2)==='overwrite'||path[0]==='chapters'||path.at(-2)==='paragraphs';
}
function mapLocale(value,translate,path=[]){
 if(typeof value==='string')return visible(path)?translate(value):value;
 if(Array.isArray(value))return value.map((item,i)=>mapLocale(item,translate,[...path,String(i)]));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,mapLocale(v,translate,[...path,k])]));
 return value;
}
function sourceStrings(data,nativeUi){
 const result=new Set();mapLocale(data.languages.en,s=>{result.add(s);return s;});
 for(const pair of Object.values(data.ui))result.add(pair[1]);
 for(const value of Object.values(data.artEnglish))result.add(value);
 for(const value of Object.values(nativeUi.en))result.add(value);
 result.delete('');return [...result];
}
module.exports={visible,mapLocale,sourceStrings};
