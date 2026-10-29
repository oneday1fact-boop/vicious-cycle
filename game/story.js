/* 第一章重製：玩家先理解處境，再決定行動。電影主要事件的遊戲化改寫。 */
const START='cold0';
const LEGACY_IDS={cold2:'cold1',cold3:'cold1',cold4:'cold1',cold5:'cold1',cold6:'coldWallet',news:'world',you:'world',gather:'world',offer1:'offer0',offer2:'paper'};
const PEOPLE=[
 {name:'阿朗｜你',text:'20歲，阿健、阿東同阿明口中的大佬。四人經常一同行劫、恐嚇路人；最近，阿健開始不滿每次分到的錢。'},
 {name:'阿健｜物色目標',text:'平時搵目標同收消息。嫌之前搶到嘅錢太少，今次帶咗一個入屋計劃。'},
 {name:'阿東｜動手打人',text:'負責恐嚇同動手，脾氣最差。嫌自己出力打人，最後卻分唔到幾多錢。'},
 {name:'阿明｜開車接應',text:'負責開車同接應。佢最關心喺邊度等、出事點走，唔想臨時先搵退路。'}
];
const NOTES={
 takings:{title:'昨晚搶到的錢',text:'你們搶到三鎊二十便士。錢太少，連車費都不夠，卻為此恐嚇並傷害一個老人。'},
 broadcast:{title:'電視新聞：行為矯正',text:'政府將試行行為矯正療程，聲稱能抑制暴力衝動。新聞只提到試行計劃，未交代具體療程。'},
 window:{title:'窗後的人影',text:'你在後花園看見屋主拿着電話，窗下還有狗。屋主並沒有外出；阿健的說法已被現場情況推翻。'},
 plan:{title:'阿健的計劃',text:'目標：北郊一間獨立屋。阿健聲稱屋主外出，屋內有值錢的收藏。消息未經核實。'},
 front:{title:'前門接應',text:'你接受阿健的安排：自己由側窗進入，其他人在前門等候。沒有人查看後門。'},
 checked:{title:'阿明核實的情況',text:'屋內有人，也有狗。後花園通往另一條路；阿明願意留在那邊接應。阿健的消息並不準確。'},
 occupied:{title:'屋主就在屋內',text:'屋主發現你，已經報警。這次入屋並不是阿健所說的無人目標。'},
 alarm:{title:'警報已經啟動',text:'電話筒未放好，門上的警報燈亮着。屋主表示警察正在趕來。'}
};
const STORY={};
function node(id,scene,section,goal,who,text,next,extra={}){STORY[id]={scene,section,goal,who,text,next,...extra};}
function seq(prefix,scene,section,goal,lines,next){lines.forEach((e,i)=>{const [who,text]=Array.isArray(e)?e:['',e];node(prefix+i,scene,section,goal,who,text,i<lines.length-1?prefix+(i+1):next);});}
const barGoal='聽清阿健的計劃，再決定今晚去不去。';
const openingGoal='你係阿朗，阿健、阿東同阿明口中嘅大佬。';
node('cold0','tunnelThreat','序幕 ／ 昨晚',openingGoal,'','你剛搶走老人的銀包，隧道盡頭便傳來拖曳的腳步聲。\n阿東仍踩着拐杖。阿明盯着出口：「有人折返了。」','cold1',{goalLabel:'你係邊個',mood:'threat'});
node('cold1','tunnelBeam','序幕 ／ 昨晚','錢已到手。你要叫停，定繼續恐嚇？','老人','一道白光掃過牆壁，隨即熄滅。\n老人突然喊：「救命！這裡有人——」',null,{quick:true,mood:'threat',choices:[
 {label:'拉開阿東，叫佢停手',to:'coldStop',set:{opening:'stop',oldStopped:true}},
 {label:'晃一晃銀包，親自羞辱老人',to:'coldMock',set:{opening:'humiliate',oldMocked:true}},
 {label:'企開，任由阿東繼續',to:'coldWatch',set:{opening:'watch',oldWatched:true}}
]});
node('coldStop','halt','序幕 ／ 昨晚','你叫停今次恐嚇。','','你拉開阿東。拐杖落地，聲音沿隧道傳出去。\n出口那個人沒有離開。白光又亮了一次。','coldWitness',{cue:'夠喇。',fx:'halt'});
node('coldMock','wallet','序幕 ／ 昨晚','你親自恐嚇老人。','阿朗','「你睇下自己，成個垃圾咁。\n抬高頭，我同你講嘢呀！」','coldWitness',{cue:'望住我！',fx:'press',mood:'threat'});
node('coldWatch','cane','序幕 ／ 昨晚','你放任阿東繼續。','','你沒有攔他。硬幣滾到鞋邊，阿東終於停手。\n阿明卻沒有看老人：「出口那個人一直在看我們。」','coldWitness',{cue:'砰。',fx:'coins',mood:'impact'});
node('coldWitness','tunnelWitness','序幕 ／ 出口','先看清出口的人影。','','那人舉着電話，鏡頭始終對準你。\n他沒有靠近，只往光亮處退了一步。',null,{quick:true,mood:'threat',legacyNext:'coldWallet',choices:[
 {label:'追到出口，逼他放下電話',to:'coldChase',set:{witnessChoice:'chase'}},
 {label:'攤開雙手退後，叫阿東收手',to:'coldBackOff',set:{witnessChoice:'backoff'}},
 {label:'立即帶人離開，不再理會他',to:'coldLeave',set:{witnessChoice:'leave'}}
]});
node('coldChase','tunnelChase','序幕 ／ 追出去','那人已跑向有燈的店舖。','','你一追，他便喊：「他們在搶劫！」\n店內有人轉頭。阿明扯住你，硬把你拉回暗處。','coldWallet',{fx:'rush',cue:'有人在看。'});
node('coldBackOff','tunnelBackOff','序幕 ／ 退一步','你停手了，鏡頭卻沒有停。','','你攤開手，往後退。阿東罵你，老人緊抱着拐杖。\n錄影的人一直等到你們離開，才放下電話。','coldWallet',{fx:'halt'});
node('coldLeave','tunnelThreat','序幕 ／ 離開','先離開這條隧道。','','你叫眾人走。沒有人跑，但腳步越來越急。\n轉角前，你看見電話鏡頭抬高，對準停在路邊的車。','coldWallet',{mood:'abandoned'});
node('coldWallet','wallet','序幕 ／ 昨晚','睇清今次搶到幾多錢。','','車門關上，你才發現自己還握着那個銀包。\n剛才冒的風險，到底換來了多少錢？','world',{
 action:{kind:'wallet',label:'翻開銀包',feedback:'三鎊二十便士。\n阿健數完，將散紙摑返落你手上：「分咩呀？」',learn:['takings']}
});
node('world','bar','01 ／ 第二晚・奶吧',barGoal,'','第二晚，奶吧。你哋將三鎊二十便士倒喺枱上。\n阿健盯住啲錢：「搞咁耐，就得呢啲？」','worldRisk',{
 variants:[
  {flag:'oldStopped',who:'',text:'第二晚，奶吧。阿東一坐低，就瞪住你。\n「尋晚搶完又拉住我？幾時變到咁心軟呀？」'},
  {flag:'oldMocked',who:'',text:'第二晚，奶吧。阿健將散紙推返畀你。\n「你尋晚掛住玩個老人，我哋等咁耐就分呢啲？」'},
  {flag:'oldWatched',who:'',text:'第二晚，奶吧。阿明一坐低，就講起昨晚。\n「喺隧道拖咁耐，差啲引到巡邏車。今次要講清楚點走。」'}
 ],
 extra:{label:'睇電視新聞（可略過）',scene:'television',text:'電視新聞：「政府將試行行為矯正療程，聲稱能抑制暴力衝動。」',learn:['broadcast']}
});
node('worldRisk','tunnelClip','01 ／ 第二晚・奶吧',barGoal,'','阿健把電話推過來：昨晚的畫面已經傳到網上。\n你伸手想放大，他卻把螢幕按熄。','offer0',{
 extra:{title:'隧道片段',label:'查看電話上的片段',scene:'tunnelClip',text:'片段從你拿着銀包開始，沒有拍到搶劫之前。錄影者已把畫面上傳。',variants:[
  {flag:'witnessChoice',value:'chase',text:'你追向鏡頭的一刻，面孔清楚出現。片段在錄影者跑進店舖後結束。'},
  {flag:'witnessChoice',value:'backoff',text:'片段拍到你退後並叫阿東停手；較早的搶劫和恐嚇並沒有因此消失。'},
  {flag:'witnessChoice',value:'leave',text:'片段拍到你們離開，最後停在車尾；車牌只有一部分可見。'}
 ],learn:['tunnelClip']}
});
NOTES.tunnelClip={title:'隧道的錄影片段',text:'路人拍下了當晚的一部分經過並上傳。鏡頭只記錄了其中一段，不能當成整晚的完整紀錄。'};
node('offer0','bar','01 ／ 第二晚・奶吧',barGoal,'阿健','「我搵咗間北郊獨立屋，有收藏。\n聽講屋主出咗門，做完夠我哋分。」','paper');
node('paper','address','01 ／ 奶吧',barGoal,'','阿健將地址推過嚟。\n阿明問：「我喺邊度等？出事點走？」','planChoice',{
 action:{kind:'paper',label:'查看地址紙',feedback:'地址寫得清楚。\n「屋主外出」只係阿健聽返嚟；退路仲未安排。',learn:['plan']}
});
node('planChoice','address','01 ／ 奶吧',barGoal,'今晚的安排','你要採用邊個安排？',null,{choices:[
 {label:'同阿明先核實消息，再安排後門接應',detail:'會花時間，亦會令阿健覺得你唔信佢。',to:'check0',set:{scouted:true,rear:true,plan:'checked'}},
 {label:'接受阿健計劃，由佢帶人守前門',detail:'消息未經核實；你將撤退接應交畀阿健。',to:'trust0',set:{scouted:false,rear:false,plan:'trusted'}},
 {label:'今晚唔做，叫大家散',detail:'停止今次行動，但同伴未必肯跟你走。',to:'withdraw0',set:{entered:false,plan:'declined'}}
]});
const houseGoal='核實住戶與接應位置，決定要不要入屋。';
seq('check','exterior','02 ／ 屋外',houseGoal,[
 '阿明陪你繞到後花園，踩住濕草停低。\n二樓窗簾郁咗一下。阿健話屋主唔喺度。',
 ['阿明','「屋主根本冇走。\n後面有條小路，我可以留低接應。但你仲要入？」'],
 ['阿健','「我只係聽人講，唔係故意呃你。\n有一個人啫，唔使驚成咁。」']
],'checkedEnter');
STORY.check0.action={kind:'window',label:'查看窗後的人影',feedback:'窗簾移開半吋。一個女人攞住電話，望向花園。\n地下窗口傳出一聲狗吠——間屋有人。',learn:['window']};
STORY.check1.learn=['checked'];
node('checkedEnter','exterior','02 ／ 屋外',houseGoal,'資料已經唔同咗','你而家知道屋內有人。\n如果繼續，就係明知有人仍然闖入。',null,{choices:[
 {label:'取消行動，帶阿明離開',detail:'你唔會入屋。阿健同阿東會自行決定去留。',to:'withdraw0',set:{entered:false}},
 {label:'仍然由側窗入屋，叫阿明留後門接應',detail:'你會入屋偷竊；遇到人時未必可以安靜離開。',to:'enter0',set:{entered:true}}
]});
seq('trust','exterior','02 ／ 屋外',houseGoal,[
 ['阿健','「你由側窗入。我同阿東守前門，\n阿明留喺架車。攞到嘢，開門就走。」'],
 '到埗，樓上有燈。\n阿健話屋主慣咗開燈防賊，但佢冇入去確認過。'
],'trustEnter');
STORY.trust0.learn=['front'];
node('trustEnter','exterior','02 ／ 屋外',houseGoal,'你仲可以離開','前門有人接應，後門情況未知。\n屋主係咪外出，仍然只得阿健一句。',null,{choices:[
 {label:'停手，今晚唔入',detail:'你仍然喺屋外，可以取消行動。',to:'withdraw0',set:{entered:false}},
 {label:'按計劃，由側窗入去',detail:'接受未核實嘅消息，將前門當成撤退路線。',to:'enter0',set:{entered:true}}
]});
const escapeGoal='離開屋內。你要決定是否傷人、走哪條路。';
seq('enter','entry','03 ／ 警報',escapeGoal,[
 '你的鞋剛碰到地板，窗框便響了一下。\n阿健鬆開扶着你的手。窗外的車燈，突然全熄了。',
 '喀。\n你踩碎一隻碟。走廊盡頭，狗爪突然刮過地磚。',
 '狗爪聲停了。一個女人站在走廊盡頭，握着電話。\n她看見你的臉，原本要說的話卡在喉嚨裡。',
 ['屋主','「你係邊個？——救命呀！\n有人入咗嚟！救命！」'],
 '你伸手，想叫佢細聲。佢以為你要捉住佢。\n椅腳尖銳咁刮過地板；佢舉起張椅，退到前門。',
 ['屋主','「唔好過嚟！我講咗地址，警察嚟緊！」'],
 '你退到電話枱，背脊撞上枱角。\n一件沉重擺設搖咗兩下。你伸手扶住，先發現自己攞緊佢。'
],'alarm');
STORY.enter1.cue='喀。';STORY.enter1.mood='hush';
for(let i=2;i<7;i++){STORY['enter'+i].scene='confrontation';STORY['enter'+i].mood=i===3?'scream':'threat';}
STORY.enter3.cue='救命——！';STORY.enter5.learn=['occupied'];
node('alarm','alarm','03 ／ 警報',escapeGoal,'','電話筒吊喺枱邊，仲有人講緊嘢。\n女人一見你望向電話，嗌得更大聲。','exitChoice',{
 mood:'alarm',action:{kind:'alarm',label:'查看警報與電話',feedback:'電話裡：「地址已確認，警員正趕往現場。」\n門上嘅燈已經亮起。遠處，警笛由細變大。',learn:['alarm']}
});
node('exitChoice','confrontation','03 ／ 警報',escapeGoal,'撤退決定','屋主擋在前門。你叫阿健開門，門外卻沒有人回答。\n警笛停了——就在屋前。你手裡還握着那件擺設。',null,{choices:[
 {label:'唔碰屋主，沿走廊退去後門',detail:'如果安排過接應，阿明會喺後面等；否則情況未知。',to:'rearResolve',set:{harmed:false,exit:'rear'}},
 {label:'揮動擺設逼佢讓路，衝去前門',detail:'你選擇用暴力開路，可能令屋主重傷。',to:'violent0',set:{harmed:true,exit:'front'}},
 {label:'放低擺設，舉高手等警察',detail:'停止逃走；你會因闖入被捕。',to:'surrender0',set:{harmed:false,exit:'surrender'}}
]});
node('rearResolve','backdoor','03 ／ 警報',escapeGoal,'','你沿走廊退向後門。','blockedRear0',{resolve:[{flag:'rear',to:'rear0'}]});
seq('rear','backdoor','03 ／ 警報',escapeGoal,[
 ['阿明・門外','「我喺度！條路清咗，快啲！」'],
 '你冇向屋主行近，慢慢退入走廊。\n門外有人拉咗兩下門柄——阿明仲喺度。'
],'openRear');
node('openRear','backdoor','03 ／ 警報','拉開後門，跟阿明離開。','','你握住門閂。前門嗰邊，警車已經停低。','escaped0',{
 action:{kind:'door',label:'拉開後門',feedback:'門向外推開。\n阿明帶你穿過花園，走上另一條路。'}
});
seq('escaped','exterior','04 ／ 章末','今次行動已結束。',[
 '你哋冇偷到嘢。警察趕到前門時，\n你已經跟阿明走到小路另一端。',
 '阿健打嚟，問點解你冇返前門。\n你望住阿明，第一次唔想解釋畀阿健聽。'
],'endEscape');
node('endEscape','exterior','04 ／ 章末','第一章完成。','章末結果 ／ 後門','你事前安排咗接應，亦喺屋內選擇唔出手。\n阿明留低等你，令嗰條退路真正有用。',null,{end:true,result:'escape'});
seq('blockedRear','locked','03 ／ 警報','後路受阻，決定投降或返回前門。',[
 '你推出後門，一路衝到花園鐵閘。鎖鏈猛地扯住你。\n你再拉一次。只聽到金屬撞擊，外面冇人應。'
],'blockedRearChoice');
node('blockedRearChoice','locked','03 ／ 警報','後路受阻，決定投降或返回前門。','你聽到警察入屋','你冇安排人守後門，阿明仲喺前面架車。\n屋內傳來警察嗌聲：「有冇人喺後面？」',null,{choices:[
 {label:'留喺後院，舉高手',detail:'警察會帶走你；你唔會再接近屋主。',to:'surrender0',set:{exit:'surrender'}},
 {label:'折返前門，搵阿健接應',detail:'你要由已經有警察趕到嘅方向離開。',to:'front0',set:{exit:'front'}}
]});
seq('violent','confrontation','03 ／ 警報','你衝向前門。',[
 '你叫佢讓開，手上嘅擺設先揮過去。\n佢舉椅去擋。兩樣嘢撞埋，椅腳斷裂。',
 '佢跌低。你再叫一聲，冇回應。\n啱啱充滿成間屋嘅嗌聲，突然停晒。',
 '電話裡嗰把聲仲喺度：「喂？聽到嗎？」\n你望住地上嗰件擺設，轉身拉開前門。',
 '你叫阿健上車。阿東反而向你行近。\n佢隻手垂喺身側，握住一支硬物。'
],'betray0');
STORY.violent1.scene='aftermath';STORY.violent1.mood='silence';
STORY.violent2.scene='aftermath';STORY.violent2.mood='silence';
STORY.violent3.scene='gate';STORY.violent3.mood='threat';
seq('front','gate','03 ／ 警報','你返到前門，尋找接應。',[
 '阿健已經向架車走。\n你叫住佢，阿東反而返轉頭。',
 ['阿東','「你當我哋係咩？\n幫你擋警察呀？」']
],'betray0');
seq('betray','gate','04 ／ 章末','警察已經到場。',[
 '你以為佢返嚟拉你。\n硬物打中你，地面忽然斜起；車門聲，一下接一下。',
 '你撐唔起身。輪胎由你眼前駛過。\n有人將你雙手扭到背後；阿健同阿東冇再望返轉頭。'
],'caughtResolve');
STORY.betray0.mood='impact';STORY.betray0.cue='砰。';STORY.betray1.mood='abandoned';
node('caughtResolve','prison','04 ／ 章末','今次行動已結束。','','你被帶返警署。','endBetrayed',{resolve:[{flag:'harmed',to:'verdict0'}]});
node('endBetrayed','prison','04 ／ 章末','第一章完成。','章末結果 ／ 被留下','你冇傷害屋主，但因闖入被捕。\n前門嗰個承諾，阿健同阿東都冇守。',null,{end:true,result:'betrayed'});
seq('verdict','prison','04 ／ 章末','今次行動已結束。',[
 '屋主傷重不治。\n法庭判你入獄十四年。',
 '兩年後，有人帶住一份療程同意書入嚟。\n佢話：兩星期，就可以令你重新做人。'
],'endFourteen');
node('endFourteen','prison','04 ／ 章末','第一章完成。','章末結果 ／ 十四年','你用暴力開路，同伴卻將你留下。\n下一個想替你作安排嘅人，係政府。',null,{end:true,result:'fourteen'});
seq('surrender','prison','04 ／ 章末','你停止逃走。',[
 '你舉高手，冇再接近屋主。\n警察扣住你手腕，帶你離開。',
 '你仍然要面對入屋嘅罪責。\n但至少，今次冇人被你擊倒。'
],'endSurrender');
node('endSurrender','prison','04 ／ 章末','第一章完成。','章末結果 ／ 停手','被捕，係你明知會發生仍然選擇嘅結果。\n你冇逃掉，亦冇用另一個人嘅傷換取出路。',null,{end:true,result:'surrender'});
seq('withdraw','bar','04 ／ 章末','你取消今次行動。',[
 ['阿朗','「消息都未查清，今晚唔做。」'],
 '阿健收起地址，阿東跟住佢走。\n阿明留喺你身邊，問你仲返唔返屋企。'
],'endWithdraw');
STORY.exitChoice.mood='alarm';STORY.blockedRear0.mood='trapped';STORY.blockedRearChoice.mood='trapped';
node('endWithdraw','bar','04 ／ 章末','第一章完成。','章末結果 ／ 散場','你冇闖入嗰間屋。\n但阿健同阿東，第一次冇等你就先走。',null,{end:true,result:'withdraw'});


/* 第二章：各自的後果。章末檢查點保留，可從舊存檔繼續。 */
const CHAPTERS={1:'第一章 ／ 誰在帶路',2:'第二章 ／ 條件'};
const CONTINUATIONS={escape:'c2_escape',withdraw:'c2_home',betrayed:'c2_minor',surrender:'c2_minor',fourteen:'c2_fatal'};
for(const n of Object.values(STORY))if(n.end){n.chapter=1;n.boundary='chapter';n.continue=CONTINUATIONS[n.result];}
PEOPLE.push(
 {name:'林醫生｜療程醫生',text:'負責行為矯正評估，認為身體排斥暴力就能減少傷害。你要分清楚她講的效果和你真正願意接受的代價。',requiresNote:'doctor'},
 {name:'何律師｜協助處理問話',text:'協助你整理親眼所見和現有資料，不會替你編造口供，亦不保證案件結果。',requiresNote:'solicitor'}
);
Object.assign(NOTES,{
 fatalCase:{title:'你的判決',text:'屋主傷重不治，你因致命暴力被判十四年。現已服刑兩年，餘下刑期沒有因參加試行計劃自動取消。'},
 minorCase:{title:'入屋案的後續',text:'你沒有傷害屋主，但入屋案及過往襲擊仍要依法處理。審訊後判服刑；這不是十四年命案判決。'},
 doctor:{title:'林醫生',text:'她負責行為矯正療程。她說療程讓身體對攻擊衝動產生排斥，並不直接消除憤怒。'},
 terms:{title:'療程條款',text:'十四天藥物及視覺刺激。完成後另行評估提前釋放，簽名不等於獲釋。可提出退出，須由醫生面談及書面記錄；退出不會消除原判刑期。'},
 exitRecord:{title:'已記錄的退出安排',text:'你在簽名前要求林醫生記錄：提出停止後，必須暫停本次測試並安排面談。這份記錄可以用來追問是否真正執行。'},
 firstFilm:{title:'第一次放映',text:'注射後觀看暴力影像，出現強烈噁心。片中同時播放古典音樂，並不只是安靜的背景畫面。'},
 music:{title:'配樂也進入療程',text:'你指出貝多芬與暴力影像同時播放。林醫生承認可能形成額外聯想，但尚未更換配樂。'},
 daySeven:{title:'第七日的反應',text:'第七日的紀錄將攻擊念頭列為噁心與停頓的觸發因素。這是身體制約，不等於當事人認同；口頭提出要求仍然做得到。'},
 completion:{title:'完成報告',text:'十四天療程已完成。報告認為攻擊反應降低；提前釋放仍需公開評估。對音樂和自衛的影響尚未獨立處理。'},
 homeMessage:{title:'阿健要求的假口供',text:'阿健要求你聲稱案發當晚與他一直留在奶吧。你當晚沒有入屋；你沒有義務替他的去向作出虛假保證。'},
 escapeMessage:{title:'阿健的新說法',text:'你由後門離開，阿健卻要求大家對警方說整晚都在奶吧。屋內影像和你真正的去向可能與他的版本衝突。'},
 solicitor:{title:'何律師',text:'她會陪同整理事實及出席問話。她要求保留原訊息，將親眼所見與猜測分開。'},
 geoAdmission:{title:'阿健的原話',text:'他承認地址消息未經核實，又要求你為整晚都在奶吧的說法作證。你保留了這段原話，未經剪接。'},
 alibi:{title:'你答應的說法',text:'你答應替阿健保證案發時一直在奶吧。這個承諾不是當晚真相；其後會與警方取得的資料核對。'}
});
function n2(id,scene,section,goal,who,text,next,extra={}){node(id,scene,section,goal,who,text,next,{...extra,chapter:2});}
const medicalGoal='了解提早釋放的條件，再決定是否參加療程。';
n2('c2_fatal','prison','01 ／ 已服刑兩年',medicalGoal,'','十四年，你已經坐咗兩年。\n今日，主任話有個「兩星期計劃」想同你傾。','c2_offer',{
 extra:{title:'判決摘要',label:'睇判決摘要',closeLabel:'收起判決',scene:'terms',text:'十四年刑期，已服刑兩年。試行計劃不會自動取消餘下刑期。',learn:['fatalCase']}
});
n2('c2_minor','prison','01 ／ 審訊之後',medicalGoal,'','你因入屋案及過往襲擊被判服刑。幾個月後，\n主任話有個「兩星期計劃」想同你傾。','c2_offer',{
 variants:[{flag:'chapterOneResult',value:'surrender',text:'你停手投降嘅經過有記錄，但入屋仍要負責。\n審訊後你入獄；幾個月後，主任提出一個試行計劃。'}],
 extra:{title:'案件摘要',label:'睇案件摘要',closeLabel:'收起摘要',scene:'terms',text:'你沒有傷害屋主。這次因入屋及過往襲擊服刑，並非十四年命案判決。',learn:['minorCase']}
});
n2('c2_offer','official','01 ／ 試行計劃',medicalGoal,'主任','「自願參加，完成兩星期療程。\n通過評估，就可以申請提前釋放。」',null,{quick:true,choices:[
 {label:'先問風險，再決定',detail:'你會先見醫生，唔會即刻簽名。',to:'c2_question'},
 {label:'先睇書面條款',detail:'確認療程、退出同釋放條件。',to:'c2_terms'},
 {label:'拒絕，照原判決服刑',detail:'繼續服刑，走向「沒有簽名」結局。',to:'c2_refuse'}
]});
n2('c2_question','doctor','01 ／ 醫療面談',medicalGoal,'林醫生','「會強烈反胃，身體會排斥攻擊衝動。\n唔代表你唔再嬲。至於退出，睇清楚份文件。」','c2_terms',{learn:['doctor']});
n2('c2_terms','terms','01 ／ 同意書',medicalGoal,'','兩星期，唔等於兩星期後一定自由。\n你將同意書拉近。','c2_decide',{
 action:{kind:'document',label:'翻開同意書',feedback:'十四天：藥物＋視覺刺激。完成後另行評估釋放。\n可要求退出並安排醫生面談；原有刑期不會因此取消。',card:'療程：十四天\n內容：藥物及視覺刺激\n釋放：完成後另行評估\n退出：醫生面談及書面記錄',learn:['terms']}
});
n2('c2_decide','terms','01 ／ 簽不簽',medicalGoal,'','你可以提出問題。\n但張紙上嗰個簽名，仍然要由你落。',null,{choices:[
 {label:'簽名參加',detail:'接受已列明嘅療程同條件。',to:'c2_sign',set:{joined:true,exitRecorded:false}},
 {label:'要求寫低停止安排，再簽',detail:'要求提出停止後先暫停本次測試，再面談。',to:'c2_record',set:{joined:true,exitRecorded:true}},
 {label:'唔簽，返回囚室',detail:'繼續服刑，走向「沒有簽名」結局。',to:'c2_refuse'}
]});
n2('c2_sign','signature','01 ／ 簽名',medicalGoal,'','你簽咗。主任收起文件。\n林醫生推開另一道門：「由第一次測試開始。」','c2_intake',{fx:'signature',learn:['doctor']});
n2('c2_record','terms','01 ／ 留下記錄',medicalGoal,'林醫生','「可以。我寫低：提出停止，先暫停，再面談。」\n你等佢簽埋名，先落自己個簽名。','c2_intake',{
 learn:['doctor','exitRecord'],fx:'signature',extra:{title:'退出安排',label:'查看剛加上的記錄',closeLabel:'收起記錄',scene:'terms',text:'提出停止後，先暫停本次測試，再安排醫生面談。你和林醫生都已簽名。',learn:['exitRecord']}
});
n2('c2_refuse','refusal','02 ／ 原路返回','你拒絕參加療程。','','你將文件推返去。主任冇再勸。\n門外仍然係原本條監獄走廊。','c2_endRefuse');
n2('c2_endRefuse','prison','第二章 ／ 分岔之後','你保留決定，繼續面對原判。','章末結果 ／ 沒有簽名','你冇換到提早釋放嘅機會。\n但今次，冇人替你簽落個同意。',null,{end:true,result:'refusedTreatment'});
n2('c2_intake','suite','02 ／ 第一天','完成第一次測試，留意身體反應。','林醫生','「先注射，再睇短片。\n唔舒服就按停止掣，我會同你面談。」','c2_projection',{learn:['doctor'],onEnter:{treatmentDays:1}});
n2('c2_projection','projection','02 ／ 第一次放映','留意畫面、配樂同身體的反應。','','你坐低，螢幕前面只得一條光。\n椅邊有個停止掣。','c2_firstReaction',{
 action:{kind:'screen',label:'望向螢幕',feedback:'畫面裡有人被襲擊，你嘅胃突然收緊。\n配樂係貝多芬——以前你會自己熄燈聽嗰首。',learn:['firstFilm']}
});
n2('c2_firstReaction','projection','02 ／ 第一次反應','你仍然可以提出要求。','林醫生','「望住畫面。記住而家嘅感覺。」',null,{quick:true,choices:[
 {label:'按停止掣',to:'c2_stop',set:{requestedStop:true}},
 {label:'問點解用呢首音樂',to:'c2_music',set:{musicConcern:true}},
 {label:'忍住，完成今次測試',to:'c2_endure',set:{enduredFirst:true}}
]});
n2('c2_stop','stopButton','02 ／ 要求停止','等候測試暫停，再決定是否繼續。','','你按落紅掣。投影仲行緊，林醫生望向紀錄板。\n你再叫一次：「我話停。」','c2_stopReply',{
 cue:'停。',fx:'press',variants:[{flag:'exitRecorded',text:'你按落紅掣，指住先前簽過嘅安排。\n「先暫停，再面談。你寫低咗。」'}]
});
n2('c2_stopReply','doctor','02 ／ 面談','決定要不要繼續療程。','林醫生','「今次先停。你可以退出，返去繼續服刑。\n或者等身體平復，再做下一次。」',null,{choices:[
 {label:'退出計劃，返回囚室',detail:'療程停止，原判繼續；走向退出療程嘅結局。',to:'c2_withdraw',set:{withdrewTreatment:true,treatmentDays:1}},
 {label:'要求記錄今次反應，再繼續',detail:'你會繼續療程，停止要求同不適都留低記錄。',to:'c2_day7',set:{firstReactionRecorded:true}}
]});
n2('c2_music','record','02 ／ 配樂','問清楚音樂為何令你不適。','阿朗','「畫面有問題，首歌冇。\n點解連音樂都要一齊播？」','c2_musicReply');
n2('c2_musicReply','doctor','02 ／ 額外聯想','你指出配樂也在影響你。','林醫生','「音樂可能會一齊形成聯想，我記錄。\n但今次用嘅片，暫時未換。」','c2_day7',{learn:['music']});
n2('c2_endure','fists','02 ／ 完成測試','你完成第一次放映。','','你抓實椅邊。畫面停咗，手仍然鬆唔開。\n林醫生喺紀錄板上打一個剔。','c2_day7',{mood:'hush'});
n2('c2_day7','haltedHand','03 ／ 第七日','分清楚自己不想做，還是身體不讓你做。','','第七日，一個技術員企喺門邊。林醫生隔住玻璃觀察。\n你仍然嬲，亦仍然想離開。','c2_day7Choice',{
 onEnter:{treatmentDays:7},extra:{title:'當日紀錄',label:'睇當日療程紀錄',closeLabel:'收起紀錄',scene:'terms',text:'第七日：仍可表達憤怒。攻擊動作開始伴隨噁心及停頓。',learn:['daySeven']}
});
n2('c2_day7Choice','haltedHand','03 ／ 門前','林醫生沒有鎖門。你想離開。','技術員','「試下推開我。」',null,{quick:true,choices:[
 {label:'推開佢，自己行出去',to:'c2_blocked',set:{attemptedPush:true}},
 {label:'唔動手，要求先停低',to:'c2_verbal',set:{verbalRequest:true}},
 {label:'問：連自衛都會咁？',to:'c2_defence',set:{askedDefence:true}}
]});
n2('c2_blocked','haltedHand','03 ／ 選擇被截斷','你仍想離開，身體卻先停手。','','你抬手。胃一抽，手指停喺半空。\n你想推開佢，出口嘅卻係：「幫下我。」','c2_finalDecision',{
 mood:'threat',cue:'停住。',learn:['daySeven'],overwrite:{from:'推開佢，自己行出去',to:'停下手，向醫生求助',reason:'攻擊念頭觸發身體反應。你嘅意願冇變。'}
});
n2('c2_verbal','doctor','03 ／ 仍然可以開口','你不用暴力，也能提出退出要求。','阿朗','「我唔推你。請你暫停，畀我決定仲做唔做。」\n今次，身體冇阻止你講出口。','c2_finalDecision',{learn:['daySeven']});
n2('c2_defence','fists','03 ／ 沒有區分','療程會影響你保護自己的能力。','林醫生','「身體唔會先分清楚係攻擊定自衛。\n佢一感到攻擊衝動，就會有反應。」','c2_finalDecision',{learn:['daySeven']});
n2('c2_finalDecision','doctor','03 ／ 剩下七日','你已知道身體會失去一部分自主反應。','','你仲可以要求退出。\n但返到囚室，已經出現嘅反應唔會即刻消失。',null,{choices:[
 {label:'撤回同意，停止之後嘅療程',detail:'返回囚室服刑及接受觀察，走向退出療程嘅結局。',to:'c2_withdraw',set:{withdrewTreatment:true,treatmentDays:7}},
 {label:'完成餘下療程，爭取釋放評估',detail:'你接受繼續制約，換取評估機會，並非即時自由。',to:'c2_complete',set:{completedTreatment:true,treatmentDays:14}}
]});
n2('c2_withdraw','refusal','第二章 ／ 分岔之後','退出後，原有刑期繼續。','','林醫生記錄你撤回同意，將你送返囚室觀察。\n你冇攞到釋放資格，亦冇繼續餘下療程。','c2_endWithdraw');
n2('c2_endWithdraw','prison','第二章 ／ 分岔之後','你停止了療程，仍要面對已發生的反應。','章末結果 ／ 撤回同意','你保住咗之後唔再參與嘅選擇。\n身體已經受過嘅影響，仍然需要跟進。',null,{end:true,result:'withdrawnTreatment'});
n2('c2_complete','certificate','04 ／ 第十四日','完成不等於已獲釋。','','第十四日，林醫生將完成報告放喺你面前。\n主任話，下一步係向外界示範療程成效。','c2_endComplete',{
 extra:{title:'完成報告',label:'睇完成報告',closeLabel:'收起報告',scene:'terms',text:'攻擊反應降低；仍需公開評估。音樂及自衛能力的影響未獨立處理。',learn:['completion']}
});
n2('c2_endComplete','certificate','第二章 ／ 分岔之後','下一步是公開評估，並非已經自由。','章末結果 ／ 合格之前','主任準備好台下嘅觀眾。\n你望住自己隻手，唔知佢哋準備叫你做乜。',null,{end:true,result:'completedTreatment'});
const freeGoal='分清楚自己做過的事，和阿健想你替他講的話。';
n2('c2_home','bedroom','01 ／ 你沒有入屋',freeGoal,'','你冇跟佢哋去。第二朝，新聞話北郊屋主送院。\n阿健傳嚟訊息，想你替佢證明當晚去向。','c2_homeChoice',{
 extra:{title:'阿健原訊息',label:'打開阿健訊息',closeLabel:'收起訊息',scene:'message',text:'「如果有人問，就話尋晚我哋一直喺奶吧飲嘢。幫個忙。」',learn:['homeMessage']}
});
n2('c2_homeChoice','message','01 ／ 幫不幫這個忙',freeGoal,'阿健・訊息','「有人問，就話我哋成晚喺奶吧。\n幫個忙，唔好拆我台。」',null,{quick:true,choices:[
 {label:'拒絕作假，搵律師保留原訊息',to:'c2_lawyer',set:{rejectedAlibi:true}},
 {label:'約阿健見面，問清楚發生咩事',to:'c2_meet',set:{metKin:true}},
 {label:'唔回覆，暫時唔再聯絡',to:'c2_silence',set:{cutContact:true}}
]});
n2('c2_escape','bedroom','01 ／ 你由後門離開',freeGoal,'','你同阿明由後門走，冇傷害屋主。\n第二朝，阿健叫你話成晚都喺奶吧。','c2_escapeChoice',{
 extra:{title:'阿健原訊息',label:'打開阿健訊息',closeLabel:'收起訊息',scene:'message',text:'「大家都話整晚留喺奶吧，先唔會互相拖累。你記住。」',learn:['escapeMessage']}
});
n2('c2_escapeChoice','message','01 ／ 兩個版本',freeGoal,'阿明','「我同你點走，大家都知。\n佢而家想我哋講另一個故仔。」',null,{quick:true,choices:[
 {label:'先搵律師，準備面對調查',to:'c2_lawyer',set:{rejectedAlibi:true}},
 {label:'見阿健，問佢點解改口',to:'c2_meet',set:{metKin:true}},
 {label:'唔回覆，斷開聯絡',to:'c2_silence',set:{cutContact:true}}
]});
n2('c2_meet','kinMeeting','02 ／ 咖啡店',freeGoal,'阿健','「你只要話我哋一直一齊，就唔會有人再問。\n地址出錯都過咗去啦，仲追嚟做乜？」',null,{quick:true,choices:[
 {label:'攞出手機，要求錄音再問地址',to:'c2_recordKin',set:{recordedKin:true}},
 {label:'拒絕作假，結束會面',to:'c2_break',set:{rejectedAlibi:true}},
 {label:'答應替佢保證整晚喺奶吧',to:'c2_false',set:{falseAlibi:true}}
]});
n2('c2_recordKin','message','02 ／ 留下原話','保留完整對話，不把猜測當成事實。','','你示意要錄音，阿健點頭，壓低聲。\n「係，我冇查過間屋。奶吧嗰段你講就得，其他唔好提。」','c2_lawyer',{
 action:{kind:'phone',label:'保留完整對話',feedback:'地址未核實，同假口供要求，一齊留喺原對話入面。',card:'已保留\n地址未核實\n要求保證整晚留在奶吧\n完整原話，未經剪接',learn:['geoAdmission']}
});
n2('c2_break','morning','02 ／ 離開會面','你拒絕替阿健保證去向。','阿朗','「我見過嘅可以講。\n但唔會替你補一段冇發生過嘅嘢。」','c2_lawyer');
n2('c2_lawyer','solicitor','03 ／ 整理事實','準備按實際經歷接受問話。','何律師','「訊息留原檔。你親眼見過乜，逐樣講。\n唔知道嘅唔好估，冇做過嘅唔好應。」','c2_statement',{
 learn:['solicitor'],extra:{title:'問話準備',label:'查看問話準備',closeLabel:'收起筆記',scene:'terms',text:'保留原訊息，區分親眼所見和他人說法。律師會陪同，案件結果仍須調查。',learn:['solicitor']}
});
n2('c2_statement','policeRoom','03 ／ 正式問話','只說你親身經歷的部分。','','何律師坐喺你旁邊。錄音開始。\n今次你要回答嘅，係自己真正做過乜。','c2_endTruth',{
 variants:[{flag:'chapterOneResult',value:'escape',text:'你承認入屋，同時講清楚冇傷人、點樣離開。\n何律師陪住你；案件唔會因為合作就即刻消失。'}]
});
n2('c2_endTruth','morning','第二章 ／ 分岔之後','調查繼續，你沒有替阿健作假。','章末結果 ／ 自己的版本','你冇保證自己一定無事。\n但阿健講嘅版本，唔再係唯一留下嘅紀錄。',null,{end:true,result:'truthfulStatement'});
n2('c2_false','kinMeeting','02 ／ 答應作證','你接受了不真實的說法。','阿朗','「好。如果有人問，我話我哋成晚都喺奶吧。」\n阿健終於鬆一口氣。','c2_falseStatement',{learn:['alibi']});
n2('c2_falseStatement','policeRoom','03 ／ 第一次口供','你按承諾作出不真實的口供。','','問話時，你照住阿健嘅說法，話佢當晚一直喺奶吧。\n錄音機將你每個字留低。','c2_contradiction');
n2('c2_contradiction','policeRoom','03 ／ 對不上時間','你答應的說法開始被核對。','','幾日後，警方要求你就口供再解釋。\n有人提供嘅時間，同阿健叫你講嘅對唔上。','c2_endAlibi');
n2('c2_endAlibi','message','第二章 ／ 分岔之後','調查仍在繼續。','章末結果 ／ 多了一個謊言','阿健再傳訊息，問你究竟講咗乜。\n你原本只想幫佢過關，依家自己都要解釋。',null,{end:true,result:'falseStatement'});
n2('c2_silence','bedroom','02 ／ 不再回覆','你暫時切斷聯絡。','','你冇回阿健。訊息由催促，慢慢變成責怪。\n幾日後，警方留下聯絡，請你就當晚情況接受問話。','c2_endSilence');
n2('c2_endSilence','morning','第二章 ／ 分岔之後','你還未說出自己的經歷。','章末結果 ／ 沉默的空位','你保留咗暫時唔回覆嘅選擇。\n但當晚發生過乜，其他人已經開始代你講。',null,{end:true,result:'silentWitness'});
// 支線結局有後日談；完成療程會繼續第三章。
const ENDINGS={
 c2_endRefuse:{number:1,title:'沒有簽名',scene:'afterPrison',paragraphs:[
  '你冇參加療程，亦冇獲得提早釋放。\n餘下嘅日子，仍然要喺鐵欄後面過。',
  '服刑期間，阿健冇再探過你。\n阿明最後一封信，只留低一個新地址。',
  '刑滿嗰日，你行返舊奶吧。鐵閘拉低，招牌都拆咗。\n你可以自己決定下一步，但失去嘅年月唔會返嚟。'
 ],variants:[{flag:'chapterOneResult',value:'fourteen',paragraphs:[
  '你拒絕療程。十四年刑期，已經過咗兩年。\n餘下十二年，你照原判服完，冇再申請呢個計劃。',
  '頭幾年，你仍然等阿健有一日會解釋。\n到後來，你連佢封信都唔再等。',
  '出獄時，舊奶吧已經拆咗。你拎住一袋衣物，企喺空地前。\n你保住咗自己嘅意願，亦親手用十四年承擔嗰晚。'
 ]}]},
 c2_endWithdraw:{number:2,title:'未完成的改造',scene:'afterTherapy',paragraphs:[
  '你退出療程，返回囚室，繼續服刑。\n只做過一次測試嘅反胃慢慢退去；醫生仍然安排覆診。',
  '你冇再坐返嗰張放映椅。\n第一次測試同退出要求，都留喺你份醫療紀錄裡。',
  '刑滿之後，你搭巴士離開。收音機播起熟悉嘅旋律。\n你等咗一陣，先放鬆扶住座椅嗰隻手。'
 ],variants:[{flag:'treatmentDays',value:7,paragraphs:[
  '第七日，你終止療程，返回囚室繼續服刑。\n但一諗起推開擋路嘅人，胃仍然會抽緊。',
  '監獄醫生安排跟進，紀錄身體反應。\n你冇再接受放映；已經形成嘅聯想，卻冇隨簽名取消。',
  '出獄後，你仍然覆診，學識喺衝突前先退開。\n你停止咗療程，往後嘅生活仍要同佢留下嘅反應相處。'
 ]}]},
 c2_endTruth:{number:3,title:'自己的版本',scene:'afterTruth',paragraphs:[
  '訊息同阿明嘅說法印證，你冇參與嗰次入屋。\n你以證人身份講出阿健嘅要求，冇替佢作假。',
  '警方亦追查隧道嗰晚嘅襲擊。\n你為自己做過嘅事受審；冇入屋，唔代表之前嘅事冇發生。',
  '處理完案件同判罰，你離開舊圈子，喺車房返夜班。\n阿明偶爾會嚟。阿健冇再叫過你「大佬」。'
 ],variants:[{flag:'chapterOneResult',value:'escape',paragraphs:[
  '你承認入屋，交代點樣由後門離開。\n屋主嘅證詞亦確認，你撤退時冇向佢動手。',
  '法庭處理入屋同過往襲擊，你仍然要服刑。\n阿健想大家一直留喺奶吧嘅版本，冇成為定案。',
  '刑滿後，阿明介紹你去車房返夜班。\n你將工錢放入銀包，第一次唔使等人問：「分幾多？」'
 ]}]},
 c2_endAlibi:{number:4,title:'另一份口供',scene:'afterAlibi',paragraphs:[
  '警方用奶吧閉路電視同車輛紀錄核對時間。\n你話阿健整晚都喺度，影像卻拍到佢早已離開。',
  '阿健改口，話係你叫佢咁講。\n你替佢留下嘅假口供，最後成為自己受審嘅證據。',
  '你因虛假口供受審，最後被判監。阿健冇替你承擔半句。\n囚室門關上嗰刻，你先明白嗰聲「幫個忙」有幾重。'
 ]},
 c2_endSilence:{number:5,title:'沒有回覆',scene:'afterSilence',paragraphs:[
  '你冇回阿健，但幾日後仍然要面對警方問話。\n佢將失敗推畀你；阿明提供嘅記錄，令事情逐步還原。',
  '你冇替阿健作假，亦冇因沉默就自動變成主謀。\n調查之後，你仍然要為已證實嘅襲擊同搶劫承擔後果。',
  '處理完案件同判罰，你搬走，換咗電話號碼。\n舊手機留喺抽屜。四個人嗰張枱，再冇坐齊過。'
 ],variants:[{flag:'chapterOneResult',value:'escape',paragraphs:[
  '你切斷聯絡，調查卻冇停。阿健聲稱入屋係你嘅安排。\n何律師陪你交代去向，阿明亦提供後門接應嘅記錄。',
  '證據分清楚各人做過嘅事。你因入屋同過往襲擊服刑。\n你冇傷害屋主，亦冇為阿健多加一份假口供。',
  '刑滿後，你搬離舊區。阿健再搵你時，只收到停用提示。\n四個人嗰張枱，再冇坐齊過。'
 ]}]}
};
for(const [id,ending] of Object.entries(ENDINGS)){STORY[id].ending=ending;STORY[id].section='結局';}
STORY.c2_endComplete.scene='publicStage';

/* 完整後半部：公開評估、重返街頭、最後的交換。 */
Object.assign(CHAPTERS,{3:'第三章 ／ 合格的人',4:'第四章 ／ 門外',5:'第五章 ／ 你的聲音'});
Object.assign(NOTES,{
 stagePlan:{title:'公開評估安排',text:'以演員挑釁測試攻擊反應；評估不是授權對方任意傷害你。你可以口頭要求停止，並要求把反應寫入報告。'},
 stageRecord:{title:'評估中的停止要求',text:'你在公開場合提出停止。要求和當時反應均有錄音；這與身體無法出手是兩件不同的事。'},
 reporter:{title:'阿晴的聯絡',text:'採訪療程的記者。她留下直接聯絡方法，表示可以提供完整錄音；接受採訪不等於同意任何人使用你的病歷。'},
 releaseCopy:{title:'完成報告副本',text:'你要求並取得副本。報告註明攻擊意念伴隨噁心，亦記錄音樂聯想未被獨立處理；不能用「再無暴力」取代所有健康評估。'},
 releaseLicence:{title:'有條件釋放',text:'特別評估後獲批有條件釋放，須按時報到和覆診；原判記錄仍在。接受宣傳訪問不屬於釋放條件。'},
 mingReturn:{title:'阿明的承認',text:'阿明承認沒有替你承擔當晚的後果。他留下車房及社區支援站地址；這次能否接受幫助，與是否原諒他分開。'},
 patrol:{title:'外判巡邏證件',text:'阿健、阿東是外判街區巡邏員，並非警察。他們出示證件不代表有權強行帶你離開；車號和當時地點可供核實。'},
 support:{title:'社區支援站',text:'值班社工可以安排臨時住宿、醫療轉介和法律聯絡。求醫不需要先接受記者或政府訪問。'},
 interview:{title:'採訪授權',text:'阿晴同意先確認聲音和影像。資助訪問的何先生另有宣傳目的；他提供的剪輯不等於記者保留的完整原檔。'},
 editedClip:{title:'被刪走的前半段',text:'何先生的宣傳片刪走你承認襲擊與搶劫的部分，只保留療程後的不適。這會令人誤以為你從未傷害過人。'},
 incident:{title:'身體反應紀錄',text:'醫療人員記錄目前的噁心、無法自衛及聲音誘發反應。需要獨立評估，不能靠一次表演證明治癒或完全失效。'},
 settlement:{title:'政府的和解條款',text:'提出賠償與宣傳工作，要求簽署「不適與療程無關」的聲明及限制對外談論。醫療照顧和法定申訴不以接受此和解為前提。'},
 evidenceMedical:{title:'資料：醫療紀錄',text:'先核對你手上的報告與覆診紀錄。缺少副本可由律師申請調取，未取得的文件不能當成已證實的證據。'},
 evidencePatrol:{title:'資料：街頭遭遇',text:'只提交親眼見到的人、車號和地點。外判巡邏員的行為與療程責任需要分開調查，不能自行推定上級指使。'},
 evidenceVoice:{title:'資料：完整原話',text:'比對完整錄音和宣傳剪輯。親身經歷、文件內容和他人推測分開整理；保留承認過往罪行的部分。'},
 independent:{title:'獨立醫療與法律協助',text:'呂醫生跟進身體反應，何律師處理文件與申訴。你可以先求醫，再決定是否公開作證；他們不保證立即康復或案件勝訴。'}
});
PEOPLE.push(
 {name:'阿晴｜記者',text:'跟進行為矯正計劃的記者。願意留下完整訪問，但與出錢宣傳的何先生有不同立場。',requiresNote:'reporter'},
 {name:'何先生｜宣傳計劃資助人',text:'反對政府療程，想用你的遭遇製作宣傳。他想要的受害者形象，未必容得下你完整的經歷。',requiresNote:'editedClip'},
 {name:'呂醫生｜獨立醫生',text:'跟進療程後的身體反應，拒絕用政治聲明代替診斷。不承諾一次治療就能恢復。',requiresNote:'independent'}
);
function n3(id,scene,section,goal,who,text,next,extra={}){node(id,scene,section,goal,who,text,next,{...extra,chapter:3});}
function n4(id,scene,section,goal,who,text,next,extra={}){node(id,scene,section,goal,who,text,next,{...extra,chapter:4});}
function n5(id,scene,section,goal,who,text,next,extra={}){node(id,scene,section,goal,who,text,next,{...extra,chapter:5});}
Object.assign(STORY.c2_endComplete,{boundary:'chapter',section:'第二章 ／ 章末',continue:'c3_wait',nextChapter:3});
const stageGoal='完成釋放評估，同時講清楚療程的代價。';
n3('c3_wait','backstage','01 ／ 後台',stageGoal,'','布幕外面有人試咪。\n林醫生話，今日會有人故意激嬲你。','c3_before');
STORY.c3_wait.variants=[{flag:'exitRecorded',text:'布幕外面有人試咪。你帶住先前寫低嘅停止安排。\n林醫生今次先將評估規則交畀你。'}];
n3('c3_before','backstage','01 ／ 後台',stageGoal,'林醫生','「我哋要記錄你嘅反應。\n如果要停，你仍然可以開口。」',null,{quick:true,choices:[
 {label:'先問清楚測試界線',detail:'確認停止要求會點處理。',to:'c3_limits',set:{stagePrepared:true}},
 {label:'要求記錄音樂同自衛問題',detail:'唔畀「完成療程」掩蓋副作用。',to:'c3_sideEffects',set:{sideEffectsRaised:true}},
 {label:'直接上台，先完成評估',detail:'你暫時唔提出額外要求。',to:'c3_step',set:{stagePrepared:false}}
]});
n3('c3_limits','releaseDesk','01 ／ 測試安排',stageGoal,'林醫生','「演員只可以推你一下。你話停，就要暫停。」\n你要求佢寫低，而唔係齋講。','c3_step',{
 action:{kind:'document',label:'核對測試安排',feedback:'測試界線、停止要求同觀察反應，已加入評估表。',card:'評估安排\n一次挑釁測試\n可口頭要求停止\n停止要求亦須記錄',learn:['stagePlan']}
});
n3('c3_sideEffects','doctor','01 ／ 報告未寫完',stageGoal,'阿朗','「我推唔開人，連聽歌都反胃。\n你份報告寫我唔再打人，有冇寫埋呢啲？」','c3_doctorReply');
n3('c3_doctorReply','releaseDesk','01 ／ 報告未寫完',stageGoal,'林醫生','佢停咗支筆。「有。呢啲唔應該喺台上略過。」\n你望住佢將補充頁夾返入去。','c3_step',{learn:['completion']});
n3('c3_step','stageTest','02 ／ 公開評估',stageGoal,'','燈一着，台下突然安靜。\n演員行埋嚟，推咗你一下。你抬手，胃即刻收緊。','c3_stageChoice',{mood:'threat',cue:'抬唔起。'});
n3('c3_stageChoice','stageTest','02 ／ 公開評估',stageGoal,'演員','「咁就唔敢還手喇？以前唔係好威咩？」\n主任已經轉向台下，準備宣布結果。',null,{quick:true,choices:[
 {label:'要求停止測試，等身體平復',to:'c3_stop',set:{stageStopped:true}},
 {label:'攞起咪，講出自己身體嘅反應',to:'c3_voice',set:{publicVoice:true}},
 {label:'忍住，等佢完成觀察',to:'c3_endure',set:{stageEndured:true}}
]});
n3('c3_stop','stageVoice','02 ／ 停止唔等於失敗',stageGoal,'阿朗','「停。我唔會打佢，但我而家企唔穩。」\n林醫生上前，叫演員退開。','c3_stopped',{learn:['stageRecord']});
STORY.c3_stop.variants=[{flag:'stagePrepared',text:'你指住核對過嘅安排：「話停就暫停。」\n林醫生叫演員退開，將你嘅要求記低。'}];
n3('c3_stopped','stageVoice','02 ／ 停止唔等於失敗',stageGoal,'','台下有人問：佢係唔想傷人，定係冇辦法？\n主任未答。阿晴將記者卡放喺台邊。','c3_review',{onEnter:{reporterKnown:true},learn:['reporter']});
n3('c3_voice','stageVoice','02 ／ 把咪未熄',stageGoal,'','你握住咪。手震，但你仲講到嘢。\n「唔出手，唔代表我而家冇事。」','c3_review',{
 action:{kind:'screen',label:'向台下講出反應',feedback:'「佢可以推我，我連擋開佢都會反胃。\n你哋評估嗰陣，請寫埋呢句。」',learn:['stageRecord','reporter']},fx:'mic',onEnter:{reporterKnown:true}
});
n3('c3_endure','stageTest','02 ／ 掌聲',stageGoal,'','你等到演員退開，先放鬆抓住椅邊隻手。\n台下拍掌。林醫生望住你，冇跟住拍。','c3_review');
n3('c3_review','releaseDesk','03 ／ 評估之後',stageGoal,'','醫療小組另行面談。幾日後，釋放申請獲批。\n主任遞嚟另一張紙：宣傳訪問授權。','c3_releaseChoice',{learn:['releaseLicence']});
n3('c3_releaseChoice','releaseDesk','03 ／ 兩份唔同嘅文件',stageGoal,'主任','「釋放已批。做埋個訪問，大家都好睇啲。」\n林醫生補一句：「訪問唔係釋放條件。」',null,{choices:[
 {label:'先攞完整醫療報告副本，拒絕宣傳',detail:'保留身體反應嘅書面記錄。',to:'c3_copy',set:{reportCopy:true,publicSpokesman:false}},
 {label:'接受簡短訪問，照稿講療程成功',detail:'你嘅說話會被用作計劃宣傳。',to:'c3_script',set:{reportCopy:false,publicSpokesman:true}},
 {label:'唔做訪問，按釋放安排離開',detail:'你可以之後再申請病歷副本。',to:'c3_noPress',set:{reportCopy:false,publicSpokesman:false}}
]});
n3('c3_copy','releaseDesk','03 ／ 留一份喺手',stageGoal,'','你逐頁核對副本，搵到「音樂聯想未處理」。\n嗰行字好細，但冇畀人刪走。','c3_depart',{
 action:{kind:'document',label:'收好醫療報告副本',feedback:'副本與原報告頁數相同，載有醫生簽名。',card:'完成報告副本\n攻擊意念伴隨噁心\n自衛能力受影響\n音樂聯想未獨立處理',learn:['releaseCopy']}
});
n3('c3_script','stageVoice','03 ／ 鏡頭前',stageGoal,'阿朗','「療程幫我重新開始。」\n你照稿講完。鏡頭熄咗，胃仍然未鬆。','c3_depart');
n3('c3_noPress','releaseDoor','03 ／ 不接受訪問',stageGoal,'','主任收起授權紙。冇人拍掌送你。\n但放行嗰道門，照樣打開。','c3_depart');
n3('c3_depart','releaseDoor','04 ／ 放行',stageGoal,'','職員交返你嘅衣物，同一張覆診卡。\n你行出門口，冇人跟住話下一步要點做。','c3_end',{
 extra:{title:'釋放與覆診安排',label:'查看覆診卡',scene:'releaseDesk',text:'按時報到及覆診。宣傳訪問另行自願；不接受訪問不撤銷已批安排。',learn:['releaseLicence']}
});
n3('c3_end','releaseDoor','第三章 ／ 章末','你已獲有條件釋放。','章末 ／ 門開了','你有條件離開監獄，但身體嘅制約仲喺度。\n你第一個想返嘅地方，係屋企。',null,{end:true,boundary:'chapter',result:'released',continue:'c4_home',nextChapter:4});
const outsideGoal='搵一個可以落腳、亦可以求助的地方。';
n4('c4_home','homeDoor','01 ／ 屋企門口',outsideGoal,'','你開門，鎖芯已經換咗。\n一個陌生租客話，屋企人搬走前冇留低新地址。','c4_homeChoice');
n4('c4_homeChoice','homeDoor','01 ／ 冇人等你',outsideGoal,'','袋裡得少量現金，同一張覆診卡。\n你要先去邊度？',null,{quick:true,choices:[
 {label:'打畀阿明，問佢可唔可以見面',to:'c4_ming',set:{mingSupport:true}},
 {label:'去舊奶吧附近，搵熟悉嘅人',to:'c4_underpass',set:{oldDistrict:true}},
 {label:'照覆診卡地址，去社區支援站',to:'c4_support',set:{soughtSupport:true}}
]});
n4('c4_ming','mingGarage','02 ／ 阿明的車房',outsideGoal,'阿明','「嗰晚我揸車走咗，冇返轉頭。\n我唔會叫你當冇事。但今晚可以先幫你搵地方住。」','c4_mingReply',{
 variants:[{flag:'rear',text:'「嗰晚我喺後門等，後來見到警車帶走你。\n我冇去自首解釋。呢樣嘢，我一直冇講出口。」'}],learn:['mingReturn']
});
n4('c4_mingReply','mingGarage','02 ／ 先接受一杯水',outsideGoal,'','你接過杯水，冇話原諒佢。\n阿明帶你去附近支援站，話會留低等你。','c4_support');
n4('c4_underpass','returnUnderpass','02 ／ 同一條隧道',outsideGoal,'','隧道裡，老人一見到你就退後。\n「係佢。」旁邊一個男人擋住你去路。','c4_elderChoice',{mood:'threat',variants:[
 {flag:'oldStopped',text:'老人認得你，扶實拐杖。「你後來拉開咗佢，\n但搶我個銀包嗰陣，你一樣喺度。」'},
 {flag:'oldMocked',text:'老人一望見你就嗌：「嗰個叫我垃圾嘅人！」\n幾個途人停低，你忽然唔知雙手可以放喺邊。'}
]});
n4('c4_elderChoice','returnUnderpass','02 ／ 今次輪到你退後',outsideGoal,'','你想擋開伸過嚟隻手，胃即刻抽緊。\n你仍然可以講嘢，亦可以行開。',null,{quick:true,choices:[
 {label:'承認傷害過佢，請旁人幫忙隔開',detail:'道歉唔代表對方必須原諒你。',to:'c4_apologise',set:{acknowledgedVictim:true,publicHelp:true}},
 {label:'唔爭辯，退向有燈嘅店舖',detail:'先離開眼前衝突。',to:'c4_retreat',set:{publicHelp:false}}
]});
n4('c4_apologise','returnUnderpass','02 ／ 唔係一句就算',outsideGoal,'阿朗','「係我。我做過，對唔住。\n但請你哋唔好動手。」店員行出嚟，隔開雙方。','c4_patrol');
n4('c4_retreat','returnUnderpass','02 ／ 退路',outsideGoal,'','你撞到牆邊，膝頭擦損。店員叫你企入燈下面。\n一架巡邏車慢慢停低。','c4_patrol',{onEnter:{streetInjury:true}});
n4('c4_patrol','patrolVan','03 ／ 熟悉的制服',outsideGoal,'','車門一開，落嚟嘅係阿健同阿東。\n阿健睇見你，先笑，再扣返件制服。','c4_badge',{mood:'threat'});
n4('c4_badge','patrolVan','03 ／ 佢哋唔係警察',outsideGoal,'阿健','「咁啱呀，大佬。上車，我哋送你一程。」\n你望住佢胸前張證，同車門嘅標記。','c4_patrolChoice',{
 action:{kind:'document',label:'睇清證件同車號',feedback:'街區外判巡邏員，唔係警察。\n你記低車號，亦記得附近店舖個名。',card:'街區外判巡邏\n阿健與阿東：受僱巡邏員\n並非警察\n車號與地點已記錄',learn:['patrol']}
});
n4('c4_patrolChoice','patrolVan','03 ／ 要唔要上車',outsideGoal,'阿東','「點呀？而家唔識我哋喇？」\n佢擋住車門，等你行近。',null,{choices:[
 {label:'留喺店門口，請店員幫忙聯絡支援站',detail:'唔跟佢哋去冇旁人嘅地方。',to:'c4_public',set:{refusedRide:true,patrolWitness:true}},
 {label:'當面打畀阿明，講出位置',detail:'令其他人知道你喺邊。',to:'c4_call',set:{refusedRide:true,mingSupport:true}},
 {label:'上車，信佢哋一次',detail:'車上只有你同佢哋。',to:'c4_ride',set:{trustedPatrol:true}}
]});
n4('c4_public','supportDesk','03 ／ 留喺燈下面',outsideGoal,'','店員冇走開。阿健見有人望住，收起笑容。\n支援站社工接通電話，叫你等佢安排接送。','c4_support');
n4('c4_call','mingGarage','03 ／ 有人知道你喺邊',outsideGoal,'阿明・電話','「唔好上車。我而家過嚟。」\n你大聲講出店名。阿東放低擋住車門隻手。','c4_support');
n4('c4_ride','patrolVan','03 ／ 車門關上',outsideGoal,'','架車冇向你講嘅地址走。\n阿東將你袋嘢掟落腳邊，問以前點解要聽你話。','c4_road',{mood:'trapped'});
n4('c4_road','returnUnderpass','03 ／ 工業區外圍',outsideGoal,'','佢哋將你推落車，拎走外套。你抬手，仍然擋唔到。\n尾燈消失後，你摸到袋裡部電話。','c4_helpCall',{onEnter:{patrolAbuse:true,admitted:true,streetInjury:true},mood:'abandoned'});
n4('c4_helpCall','medicalRoom','03 ／ 求助',outsideGoal,'','你報出路牌同車號，請人安排救護。\n接線員叫你留喺有燈嘅地方。','c4_medical',{
 action:{kind:'phone',label:'傳出位置，等候救護',feedback:'救護人員接到位置，將你送往醫療中心。\n你嘅衣物、擦傷同說法都有記錄。',learn:['incident']}
});
n4('c4_support','supportDesk','04 ／ 支援站',outsideGoal,'社工','「住宿同求醫，我哋可以先安排。\n有個跟進療程嘅記者想見你，你可以唔見。」','c4_supportChoice',{learn:['support']});
n4('c4_supportChoice','supportDesk','04 ／ 你唔需要先表演',outsideGoal,'','社工將醫療轉介同記者聯絡放喺枱上。\n你想先做邊件事？',null,{choices:[
 {label:'先接受獨立醫療評估',detail:'暫時唔接受訪問，求醫照常安排。',to:'c4_clinic',set:{independentFirst:true}},
 {label:'見記者，講清楚療程之後發生嘅事',detail:'接受訪問前，可以訂明使用影像嘅界線。',to:'c4_reporter',set:{interviewed:true}}
]});
n4('c4_clinic','medicalRoom','04 ／ 唔使等新聞播出',outsideGoal,'','呂醫生先檢查你嘅身體，再問療程經過。\n佢話：「我唔需要你上鏡，先可以幫你。」','c4_end',{learn:['independent','incident'],onEnter:{admitted:false}});
n4('c4_reporter','reporterStudio','05 ／ 訪問之前',outsideGoal,'阿晴','「我會保留原檔。資助人想用片做宣傳，\n但你可以先睇，亦可以唔答。」','c4_soundChoice',{learn:['reporter','interview']});
n4('c4_soundChoice','reporterStudio','05 ／ 聲音的界線',outsideGoal,'','枱邊有一部播放器，裡面係療程資料片。\n阿晴問，可唔可以用嚟核對經過？',null,{choices:[
 {label:'先靜音，只睇畫面',detail:'唔用自己身體再次測試配樂嘅影響。',to:'c4_silent',set:{safePlayback:true}},
 {label:'照常播放，邊睇邊講',detail:'片段可能包含療程配樂。',to:'c4_play',set:{safePlayback:false}}
]});
n4('c4_silent','reporterStudio','05 ／ 靜音',outsideGoal,'','阿晴拔走喇叭線。你指住畫面，講第一次反胃係幾時。\n訪問錄低你承認過往傷人，亦錄低療程之後嘅反應。','c4_edit');
n4('c4_play','soundSwitch','05 ／ 唱針落下',outsideGoal,'','熟悉嘅幾個音一出，胃突然收緊。\n阿晴望見你握實枱邊，立即伸手去熄機。','c4_cut',{mood:'threat',fx:'sound',variants:[
 {flag:'musicConcern',text:'你講起之前已向醫生提出配樂問題。\n阿晴即刻拔走喇叭線：「咁唔應該再播。」'}
]});
n4('c4_cut','soundSwitch','05 ／ 停下來',outsideGoal,'','你指住電源，示意唔好再播。\n訪問暫停，阿晴問要唔要安排醫生。','c4_edit',{
 action:{kind:'screen',label:'確認播放器已關閉',feedback:'播放器已關閉，今次播放安排亦有記錄。\n阿晴安排你去醫療中心檢查，唔再嘗試播片。',learn:['incident']},onEnter:{admitted:true}
});
n4('c4_edit','reporterStudio','05 ／ 被剪走的前半段',outsideGoal,'','資助人何先生帶嚟宣傳剪輯。\n你承認搶劫、傷人嗰段，全部冇咗。','c4_editChoice',{
 extra:{title:'原訪問與宣傳片',label:'對照兩個版本',scene:'evidenceTable',text:'原檔：過往罪行、療程、目前反應。\n宣傳片：只留療程後不適，刪去你承認傷人嘅部分。',learn:['editedClip']}
});
n4('c4_editChoice','reporterStudio','05 ／ 佢想你變成邊個',outsideGoal,'何先生','「觀眾要一個清楚嘅受害者，唔使咁多背景。」\n阿晴將原錄音機留喺你面前。',null,{choices:[
 {label:'要求保留承認罪行嗰段，攞返完整原檔',detail:'你唔接受被包裝成從未傷人嘅人。',to:'c4_fullRecord',set:{fullInterview:true}},
 {label:'暫時唔授權，先攞文件問律師',detail:'停止發佈安排，保留之後再決定嘅空間。',to:'c4_hold',set:{heldInterview:true}}
],learn:['editedClip']});
n4('c4_fullRecord','evidenceTable','05 ／ 兩件事都要留下',outsideGoal,'阿朗','「我做過嘅，我認。療程對我做過乜，一樣要講。」\n阿晴複製原檔，註明暫未授權何先生發佈。','c4_medical',{learn:['interview']});
n4('c4_hold','evidenceTable','05 ／ 唔即刻答應',outsideGoal,'','你要求暫停發佈。阿晴保留原檔，同意等律師核對。\n何先生話咁會錯過新聞時機。你冇改口。','c4_medical');
n4('c4_medical','medicalRoom','06 ／ 獨立評估',outsideGoal,'呂醫生','「先處理你而家嘅反應。\n對外點講，唔應該成為你求醫嘅條件。」','c4_end',{learn:['independent','incident']});
n4('c4_end','medicalRoom','第四章 ／ 章末','你已經找到醫療與住宿支援。','章末 ／ 談判之前','社工替你約咗何律師。\n同一朝，主任亦打嚟，想傾一份「重新開始」嘅安排。',null,{end:true,boundary:'chapter',result:'supported',continue:'c5_room',nextChapter:5});
const finalGoal='先看清條件，再決定自己的經歷交給誰。';
n5('c5_room','medicalRoom','01 ／ 診症室外',finalGoal,'呂醫生','「好消息係你暫時穩定。\n跟進要時間，唔係再拍一條片就等於好返。」','c5_lawyer',{learn:['independent']});
n5('c5_lawyer','evidenceTable','01 ／ 先留低自己版本',finalGoal,'何律師','「你可以申訴，亦可以暫時唔公開。\n但睇清楚有冇人要你簽一段唔真實嘅說話。」','c5_offer',{learn:['solicitor']});
n5('c5_offer','governmentVisit','02 ／ 主任的安排',finalGoal,'主任','「有賠償、有覆診，仲有份宣傳工作。\n大家唔好再追究，一齊向前行。」','c5_terms',{variants:[
 {flag:'publicSpokesman',text:'「上次個訪問反應好好。我哋可以繼續合作，\n有賠償，亦有份長期宣傳工作。」'}
]});
n5('c5_terms','governmentVisit','02 ／ 細字',finalGoal,'','你翻到聲明嗰頁：\n「目前不適與療程無關。」醫療記錄並冇得出呢個結論。','c5_dossier',{
 action:{kind:'document',label:'睇清賠償與聲明條款',feedback:'賠償與宣傳工作綁定對外聲明及保密要求。\n你可以唔接受；求醫同申訴會另外安排。',card:'自願和解提議\n賠償＋宣傳工作\n要求聲明不適與療程無關\n另有對外談論限制',learn:['settlement']}
});
n5('c5_dossier','evidenceTable','03 ／ 三份資料',finalGoal,'','何律師將文件分成三疊。\n先分清楚手上有乜，再決定要交去邊度。','c5_finalChoice',{
 hotspots:[
  {id:'medical',label:'醫療紀錄',title:'醫療紀錄',scene:'releaseDesk',text:'你冇即場攞副本。律師可以申請原檔，現有覆診紀錄會先保存。',variants:[{flag:'reportCopy',text:'你保留嘅副本載有醫生簽名，同「音樂聯想未處理」嗰行字。可以連同現時反應交畀獨立醫生核對。'}],learn:['evidenceMedical'],x:22,y:48},
  {id:'patrol',label:'街頭遭遇',title:'街頭遭遇',scene:'patrolVan',text:'呢次你冇遇到巡邏員。唔會將其他人嘅傳聞當成你親眼見過嘅事。',variants:[{flag:'patrolAbuse',text:'你記低阿健、阿東同車號；救護記錄亦有接到你嘅地點。律師會另行投訴，唔自行推定上級有指使。'},{flag:'oldDistrict',text:'你認出阿健、阿東，並記低車號與地點。你冇上車，亦唔會聲稱發生過冇親歷嘅襲擊。'}],learn:['evidencePatrol'],x:54,y:37},
  {id:'voice',label:'完整原話',title:'完整原話',scene:'reporterStudio',text:'你冇接受後來嘅訪問。律師會先申請公開評估錄音，再由你核對自己講過嘅話。',variants:[{flag:'fullInterview',text:'阿晴提供嘅原檔包括你承認傷人，同療程後嘅反應。宣傳版刪走咗前半段，兩份要分開保存。'},{flag:'heldInterview',text:'訪問仍未授權發佈，原檔由阿晴保留。律師可以先核對，再由你決定公開範圍。'}],learn:['evidenceVoice'],x:76,y:68}
 ]
});
n5('c5_finalChoice','evidenceTable','03 ／ 最後的交換',finalGoal,'何律師','「我會交代每個選擇嘅後果。\n但簽名之前，你有權攞返時間，同講返自己版本。」',null,{choices:[
 {label:'接受主任條件，換取賠償同宣傳工作',detail:'簽下與現有醫療證據不符嘅聲明。',to:'c5_state',set:{finalRoute:'state'}},
 {label:'公開完整證詞，連自己做過嘅事一齊講',detail:'由律師核對事實；你嘅罪行亦會重新被討論。',to:'c5_public',set:{finalRoute:'public'}},
 {label:'唔上鏡，向獨立機構正式申訴',detail:'交文件、接受調查，同時繼續醫療跟進。',to:'c5_private',set:{finalRoute:'private'}},
 {label:'接受何先生剪輯，成為反療程宣傳人物',detail:'以刪走過往罪行嘅版本換取平台同收入。',to:'c5_campaign',set:{finalRoute:'campaign'}},
 {label:'暫時唔替任何人宣傳，先照顧自己',detail:'拒絕兩邊提議，保留文件，繼續覆診及報到。',to:'c5_quiet',set:{finalRoute:'quiet'}}
]});
n5('c5_state','governmentVisit','04 ／ 再一次簽名',finalGoal,'','你喺聲明落款。主任將另一份工作安排推過嚟。\n下一次見面，會有化妝師同攝影機。','endState');
n5('c5_public','publicWitness','04 ／ 完整的一段',finalGoal,'','錄音開始。你先講隧道嗰晚，再講入屋同療程。\n今次冇人可以只留低自己想要嗰半段。','endPublic');
n5('c5_private','evidenceTable','04 ／ 正式收件',finalGoal,'','何律師交出申訴。缺少嘅原檔逐一申請，唔用猜測補。\n你接過收件編號，先去下一次覆診。','endPrivate');
n5('c5_campaign','pressDivide','04 ／ 另一邊的鏡頭',finalGoal,'','何先生話你終於識得把握機會。\n阿晴要求你保留原檔，退出今次宣傳。','endCampaign');
n5('c5_quiet','recoveryRoom','04 ／ 先過今日',finalGoal,'','你拒絕兩份宣傳安排，保留文件。\n社工替你找到暫住地方，呂醫生約好下次覆診。','endQuiet');
const FINAL_ENDINGS={
 endState:{number:6,title:'被借走的聲音',scene:'governmentVisit',paragraphs:[
  '賠償入帳，你有咗固定工作。每次錄影，稿紙都一樣：\n「我已經好返，療程冇問題。」',
  '你照常覆診，反應亦有起伏。但聲明限制咗你對外講乜。\n記者問起身體，你望向鏡頭旁邊等緊你嘅人。',
  '幾個月後，新廣告播出。畫面裡你笑得好自然。\n只有錄影室裡嘅你知道，嗰句說話已經重錄咗七次。'
 ]},
 endPublic:{number:7,title:'留下名字的人',scene:'publicWitness',paragraphs:[
  '完整證詞公開。療程嘅風險同公開評估方式，接受獨立調查。\n你過往傷人嘅事，亦再次成為新聞。',
  '受害者冇義務原諒你。你配合原有判決與調查，唔以療程抵銷罪責。\n部分試行安排被暫停，醫療記錄要重新審視。',
  '你繼續覆診，身體未完全恢復。第一次試聽音樂，只播咗幾秒。\n你自己按停。今次，冇人等住用呢一幕證明乜。'
 ],variants:[{flag:'chapterOneResult',value:'fourteen',paragraphs:[
  '你公開承認嗰晚令屋主死亡，再交代療程經過。\n屋主家屬拒絕接受你嘅道歉，你冇要求佢哋改口。',
  '療程接受獨立調查，部分安排被暫停。\n你嘅釋放條件同原判記錄照樣存在，嗰條人命亦唔會返嚟。',
  '你按時報到、覆診，亦配合後續程序。\n嗰份完整證詞留低你個名，同時留低你唔能夠推走嘅責任。'
 ]}]},
 endPrivate:{number:8,title:'不替任何人說話',scene:'recoveryRoom',paragraphs:[
  '你拒絕兩邊宣傳，向獨立機構提交正式申訴。\n由律師分清楚每項指控；冇文件支持嘅部分，先列為待核實。',
  '過程比新聞慢。你接受問話、補交紀錄，繼續報到同覆診。\n有啲申訴獲得跟進，有啲仍然未有定論。',
  '你搵到一份車房工作，租咗一間細房。\n信箱再有來信時，你會自己拆開，睇完先決定點回覆。'
 ]},
 endCampaign:{number:9,title:'換一張椅',scene:'pressDivide',paragraphs:[
  '何先生替你安排訪問同收入。海報只講你遭遇過乜，冇講你做過乜。\n第一場集會，台下為你站起身。',
  '後來，舊案資料再被翻出。宣傳團隊叫你照稿答，唔好提原錄音。\n阿晴拒絕交出只剩半段嘅故事。',
  '你坐喺另一間錄影室，對面換咗一批人。\n稿紙送到你手上，仍然有人指住一句話：「呢句，跟住讀。」'
 ]},
 endQuiet:{number:10,title:'先過自己的生活',scene:'recoveryRoom',paragraphs:[
  '你冇簽宣傳協議，亦暫時唔公開作證。文件仍然保留。\n覆診、報到、搵住處，成為每日要處理嘅事。',
  '唔再上鏡，唔代表往事消失。你仍要面對做過嘅事，\n亦要學識喺身體未恢復時，用其他方法求助同保護自己。',
  '某個朝早，你打開唱機，手留喺停止掣旁邊。\n你聽咗一小段，決定今日到呢度。窗外冇觀眾，亦冇人拍掌。'
 ]}
};
for(const [id,ending] of Object.entries(FINAL_ENDINGS))n5(id,ending.scene,'結局','故事已完結。','',ending.paragraphs[0],null,{end:true,result:id,ending});

if(typeof module!=='undefined')module.exports={START,STORY,NOTES,PEOPLE,LEGACY_IDS,CHAPTERS,CONTINUATIONS};
