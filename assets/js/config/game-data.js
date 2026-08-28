window.WW=window.WW||{};
window.WW.config=window.WW.config||{};

window.WW.config.hero={
 H001:{name:'赤焰战神',hp:620,atk:108,def:28,move:4.8,aspd:.95,crit:5,unlock:0,color:'#ef694e',skill:'炎龙斩',ult:'赤龙降世',
  presets:[['灭世炎狱',['A011','A021','A026','A027','A003','A054'],['P026','P017','P030','P019','P016','P018']],['炎龙武圣',['A001','A003','A054','A042','A063','A070'],['P016','P026','P011','P003','P019','P043']],['火域站场',['A021','A027','A028','A041','A011','A062'],['P017','P026','P027','P019','P043','P001']]]},
 H002:{name:'雷霆猛将',hp:520,atk:102,def:20,move:5.4,aspd:1.15,crit:8,unlock:800,color:'#70a9ff',skill:'雷闪突击',ult:'雷霆万军',
  presets:[['九天雷神',['A013','A022','A041','A051','A062','S003'],['P027','P023','P011','P018','P019','P003']],['雷枪连击',['A002','A051','A062','A013','A041','S003'],['P027','P011','P007','P003','P018','P019']],['雷影军团',['S003','A013','A022','A051','A041','A060'],['P027','P039','P036','P018','P011','P019']]]},
 H007:{name:'灵猴',hp:560,atk:105,def:22,move:5.4,aspd:1.10,crit:8,unlock:1200,color:'#f0b45d',skill:'腾云震地',ult:'法天象地',
  presets:[['斗战风暴',['A005','A001','A026','A045','S001','A009'],['P016','P011','P030','P039','P036','P018']],['万猴军团',['S001','A005','A026','A045','A060','A009'],['P039','P036','P037','P018','P016','P030']],['巨神棍阵',['A005','A001','A009','A045','A026','S001'],['P001','P016','P011','P019','P030','P043']]]},
 H010:{name:'炎忍',hp:440,atk:116,def:14,move:5.3,aspd:1.0,crit:6,unlock:0,color:'#f08358',skill:'炎龙疾走',ult:'炎龙忍法',
  presets:[['爆炎忍法',['A011','A019','A027','A054','S002','A042'],['P026','P010','P018','P019','P024','P033']],['炎龙疾走',['A054','A011','A027','A051','A060','S002'],['P026','P018','P011','P019','P033','P007']],['火分身',['S002','A011','A019','A027','A042','A063'],['P036','P039','P026','P010','P018','P019']]]},
 H012:{name:'影忍',hp:430,atk:106,def:14,move:5.6,aspd:1.20,crit:12,unlock:0,color:'#a47dff',skill:'影袭瞬杀',ult:'万影杀阵',
  presets:[['万影忍神',['A015','S001','A053','A070','A072','A073'],['P024','P039','P033','P007','P018','P019']],['暗器暴击',['A015','A007','A070','A053','A072','A073'],['P024','P007','P011','P019','P033','P018']],['影军召唤',['S001','A015','A053','A070','S002','S003'],['P039','P036','P033','P018','P019','P024']]]},
 H019:{name:'气功战士',hp:500,atk:112,def:18,move:5.2,aspd:1.05,crit:8,unlock:1500,color:'#65d8ff',skill:'爆气冲击',ult:'超级气功炮',
  presets:[['万象星河炮',['A014','A030','A049','A060','A068','S018'],['P032','P019','P018','P003','P016','P043']],['气爆领域',['A030','A060','A068','A014','A049','S018'],['P032','P016','P018','P019','P043','P001']],['百重气功',['A014','S018','A049','A068','A060','A030'],['P032','P019','P018','P003','P011','P016']]]}
};

window.WW.config.skill={A001:'旋风斩',A002:'雷霆枪',A003:'烈焰刀',A005:'回旋棍',A007:'修罗斩',A009:'连环拳',A011:'火球术',A013:'雷电弹',A014:'气功弹',A015:'手里剑',A019:'爆裂弹',A021:'火焰领域',A022:'雷霆领域',A026:'龙卷风',A027:'陨石雨',A028:'爆炎阵',A030:'气爆领域',A041:'落雷',A042:'火柱',A045:'风刃雨',A049:'气功轰炸',A051:'雷闪',A053:'影袭',A054:'火焰冲刺',A060:'气爆瞬移',A062:'雷珠',A063:'火轮',A068:'气功珠',A070:'暗影刃',A072:'黑洞',A073:'镜像攻击',S001:'影分身',S002:'火分身',S003:'雷分身',S018:'气功幻影',P001:'力量强化',P003:'破军',P007:'致命',P010:'暴击爆炸',P011:'极速',P016:'范围强化',P017:'持续强化',P018:'冷却缩减',P019:'技能倍率',P023:'弹射',P024:'分裂',P026:'火神祝福',P027:'雷神祝福',P030:'风神祝福',P032:'气能强化',P033:'暗影强化',P036:'召唤强化',P037:'召唤速度',P039:'召唤数量',P043:'吸血'};
window.WW.config.evolution={E001:['无双风暴','A001','P016'],E003:['炼狱龙斩','A003','P026'],E005:['斗战神棍','A005','P018'],E011:['炼狱火球','A011','P026'],E013:['无限雷链','A013','P023'],E014:['星河气弹','A014','P032'],E015:['万影手里剑','A015','P024'],E019:['连环爆破','A019','P010'],E021:['炼狱火海','A021','P017'],E022:['九天雷域','A022','P027'],E026:['天灾风暴','A026','P030'],E027:['天火陨星','A027','P026'],E028:['九重爆炎阵','A028','P019'],E030:['星环气场','A030','P032'],E041:['天罚神雷','A041','P027'],E049:['星河弹幕','A049','P032'],E054:['炎龙疾走','A054','P026'],SE001:['万影军团','S001','P039'],SE003:['雷神影军','S003','P027'],SE018:['星河幻影','S018','P032']};
const FUSIONS={F001:['焚天龙卷','E011','E026'],F002:['天火炼狱','E021','E027'],F003:['炎爆地狱','E028','E019'],F004:['炎龙乱舞','E003','E054'],F005:['雷神万影','E013','SE003'],F006:['九天雷劫','E022','E041'],F020:['百重气功炮','E014','SE018'],F021:['星河冲击','E030','E049'],F026:['无限影军','SE001','E015'],F033:['斗战风暴','E005','E001']};

window.WW.config.gear={
 EQW001:{name:'赤炎刀',slot:'weapon',score:310,rarity:'purple'},EQW003:{name:'玄铁棍',slot:'weapon',score:403,rarity:'gold'},EQW005:{name:'雷鸣枪',slot:'weapon',score:350,rarity:'purple'},EQW007:{name:'夜鸦千刃',slot:'weapon',score:440,rarity:'gold'},
 EQA001:{name:'武将甲',slot:'armor',score:220,rarity:'blue'},EQA003:{name:'斗战战甲',slot:'armor',score:380,rarity:'gold'},EQA005:{name:'影忍轻甲',slot:'armor',score:300,rarity:'purple'},EQA007:{name:'灵界战衣',slot:'armor',score:420,rarity:'gold'},
 EQX001:{name:'炎龙核心',slot:'accessory',score:250,rarity:'purple'},EQX003:{name:'万界印记',slot:'accessory',score:390,rarity:'gold'},EQX005:{name:'天机玉佩',slot:'accessory',score:210,rarity:'blue'},EQX007:{name:'混沌指环',slot:'accessory',score:430,rarity:'gold'}
};
window.WW.config.rune={R031:{name:'火神符文',score:95},R012:{name:'巨化符文',score:82},R043:{name:'学者符文',score:76},R001:{name:'狂战符文',score:88},R017:{name:'多重符文',score:90},R021:{name:'吸血符文',score:78}};
window.WW.config.pet={PET001:{name:'火灵',score:140},PET002:{name:'雷狼',score:120},PET007:{name:'治疗精灵',score:110},PET011:{name:'招财猫',score:105},PET015:{name:'镜像精灵',score:128}};

const ENEMIES={
 EN001:{name:'黄巾步卒',map:'ST001',ai:'melee',hp:70,speed:68,damage:8,color:'#a84b43'},
 EN002:{name:'黄巾弓手',map:'ST001',ai:'ranged',hp:55,speed:54,damage:7,color:'#9d6a44'},
 EN003:{name:'黄巾盾兵',map:'ST001',ai:'shield',hp:145,speed:45,damage:7,color:'#6e737c'},
 EN004:{name:'黄巾骑兵',map:'ST001',ai:'charge',hp:105,speed:86,damage:12,color:'#8d4b3b'},
 EN005:{name:'火箭兵',map:'ST001',ai:'aoe_ranged',hp:65,speed:48,damage:9,color:'#b45d3d'},
 EN006:{name:'黄巾力士',map:'ST001',ai:'brute',hp:220,speed:38,damage:16,color:'#b2844f'},
 EN014:{name:'猴妖',map:'ST003',ai:'melee',hp:85,speed:76,damage:9,color:'#8e6b40'},
 EN015:{name:'狼妖',map:'ST003',ai:'flank',hp:72,speed:95,damage:10,color:'#6c6f75'},
 EN016:{name:'蛇妖',map:'ST003',ai:'poison',hp:68,speed:66,damage:8,color:'#5e8a58'},
 EN017:{name:'牛妖',map:'ST003',ai:'brute',hp:260,speed:40,damage:18,color:'#825947'},
 EN018:{name:'飞妖',map:'ST003',ai:'fly',hp:62,speed:82,damage:8,color:'#7b6f92'},
 EN019:{name:'妖术师',map:'ST003',ai:'summoner',hp:90,speed:45,damage:7,color:'#77508d'},
 EN020:{name:'石妖',map:'ST003',ai:'shield',hp:210,speed:36,damage:12,color:'#77756b'},
 EN021:{name:'下忍',map:'ST004',ai:'melee',hp:78,speed:84,damage:9,color:'#6d596f'},
 EN022:{name:'暗器忍',map:'ST004',ai:'ranged',hp:60,speed:74,damage:8,color:'#64567b'},
 EN023:{name:'火忍',map:'ST004',ai:'aoe_ranged',hp:72,speed:68,damage:10,color:'#9a4f3d'},
 EN024:{name:'雷忍',map:'ST004',ai:'dash',hp:74,speed:90,damage:11,color:'#5573a1'},
 EN025:{name:'分身忍',map:'ST004',ai:'clone',hp:82,speed:72,damage:8,color:'#705d84'},
 EN026:{name:'爆符忍',map:'ST004',ai:'trap',hp:65,speed:65,damage:12,color:'#8c593d'},
 EN027:{name:'医忍',map:'ST004',ai:'healer',hp:95,speed:55,damage:5,color:'#5b8c76'}
};

window.WW.config.boss={
 B001:{name:'黄巾巨将',map:'ST001',style:'巨斧冲击',hp:7000,color:'#8f3539',skills:['震地斩','狂暴冲锋','旋风斧']},
 B002:{name:'乱世妖师',map:'ST001',style:'法阵与召唤',hp:11000,color:'#76538f',skills:['火符法阵','妖兵召唤','瞬移雷击']},
 B003:{name:'混沌骑将',map:'ST001',style:'骑乘冲锋',hp:18000,color:'#8a472d',skills:['直线冲锋','枪阵','下马狂战']},
 B006:{name:'牛魔妖王',map:'ST003',style:'重击与岩爆',hp:22000,color:'#76513a',skills:['裂地重锤','岩石爆破','霸体冲撞']},
 B008:{name:'混世魔猿',map:'ST003',style:'跳跃与分身',hp:30000,color:'#805f39',skills:['跃击','棍影分身','狂暴连砸']},
 B009:{name:'炎狱忍王',map:'ST004',style:'火遁与爆符',hp:24000,color:'#9a4539',skills:['炎墙','爆符雨','炎龙突袭']},
 B010:{name:'雷瞬忍王',map:'ST004',style:'高速雷闪',hp:26000,color:'#4f6d9c',skills:['雷瞬','雷牢','天雷落']},
 B011:{name:'万影忍王',map:'ST004',style:'分身与斩杀',hp:36000,color:'#70528d',skills:['万影分身','暗影扇刃','影界处刑']}
};

window.WW.config.stage={
 ST001:{name:'乱世荒原',desc:'黄巾残军与裂隙妖术肆虐边境。',pos:[18,67],mechanic:'火线：周期出现横向燃烧带，站在其中持续掉血。',bossPool:['B001','B002','B003'],stages:[
  ['ST001-01','边境清剿',true,260,'B001',{objective:'在 06:00 前击败黄巾巨将并领取战利品',duration:360,bosses:['B001'],bossAt:270,unlockAfter:null,stars:{clear:2,mastery:3,masteryHp:.55},reward:{starGold:100}}],
  ['ST001-02','废村救援',false,320,'B001',{objective:'守住废村救援路线，坚持至 20:00',duration:1200,bosses:[],bossAt:null,unlockAfter:'ST001-01',stars:{clear:2,mastery:3,masteryHp:.55},reward:{starGold:100}}],
  ['ST001-03','妖师祭坛',true,420,'B002',{objective:'在 20:00 前击败乱世妖师并摧毁祭坛',duration:1200,bosses:['B002'],bossAt:720,unlockAfter:'ST001-02',stars:{clear:2,mastery:3,masteryHp:.55},reward:{starGold:100}}],
  ['ST001-04','裂隙骑将',true,650,'B003',{objective:'在 20:00 前击败混沌骑将，封锁裂隙',duration:1200,bosses:['B003'],bossAt:720,unlockAfter:'ST001-03',stars:{clear:2,mastery:3,masteryHp:.55},reward:{starGold:100}}]
 ]},
 ST003:{name:'花果妖岭',desc:'妖气笼罩古道，混世魔猿统领怪潮。',pos:[52,37],mechanic:'妖雾：周期覆盖区域，降低视野并强化妖怪移速。',bossPool:['B006','B008'],stages:[
  ['ST003-01','妖岭入口',false,420,'B006',{objective:'突破妖岭入口，坚持至 20:00',duration:1200,bosses:[],bossAt:null,unlockAfter:'ST001-04',stars:{clear:2,mastery:3,masteryHp:.55},reward:{starGold:100}}],
  ['ST003-02','白骨迷阵',false,480,'B006',{objective:'穿越白骨迷阵，坚持至 20:00',duration:1200,bosses:[],bossAt:null,unlockAfter:'ST003-01',stars:{clear:2,mastery:3,masteryHp:.55},reward:{starGold:100}}],
  ['ST003-03','牛魔试炼',true,620,'B006',{objective:'在 20:00 前击败牛魔妖王，完成试炼',duration:1200,bosses:['B006'],bossAt:720,unlockAfter:'ST003-02',stars:{clear:2,mastery:3,masteryHp:.55},reward:{starGold:100}}],
  ['ST003-04','混世魔猿',true,820,'B008',{objective:'在 20:00 前击败混世魔猿，平息妖岭',duration:1200,bosses:['B008'],bossAt:720,unlockAfter:'ST003-03',stars:{clear:2,mastery:3,masteryHp:.55},reward:{starGold:100}}]
 ]},
 ST004:{name:'忍界战场',desc:'雷火、暗器与分身制造高速战场。',pos:[83,58],mechanic:'爆符区：地面随机生成爆符预警圈，延迟后爆炸。',bossPool:['B009','B010','B011'],stages:[
  ['ST004-01','暗器封锁',false,540,'B009',{objective:'突破暗器封锁，坚持至 20:00',duration:1200,bosses:[],bossAt:null,unlockAfter:'ST003-04',stars:{clear:2,mastery:3,masteryHp:.55},reward:{starGold:100}}],
  ['ST004-02','爆符峡谷',false,620,'B010',{objective:'穿越爆符峡谷，坚持至 20:00',duration:1200,bosses:[],bossAt:null,unlockAfter:'ST004-01',stars:{clear:2,mastery:3,masteryHp:.55},reward:{starGold:100}}],
  ['ST004-03','炎雷双王',true,820,'B010',{objective:'在 20:00 前依次击败炎狱忍王与雷瞬忍王',duration:1200,bosses:['B009','B010'],bossAt:720,unlockAfter:'ST004-02',stars:{clear:2,mastery:3,masteryHp:.55},reward:{starGold:100}}],
  ['ST004-04','万影忍王',true,1100,'B011',{objective:'在 20:00 前击败万影忍王，终结战役',duration:1200,bosses:['B011'],bossAt:720,unlockAfter:'ST004-03',stars:{clear:2,mastery:3,masteryHp:.55},reward:{starGold:100}}]
 ]}
};

window.WW.config.storyEncounters={
 'ST001-01':{name:'边境疏火线',spawn:.88,elite:.70,horde:.70,enemies:[['EN001',5],['EN002',3],['EN003',1]],eventAt:[45,150],eventPool:['merchant','goldChest'],chestAt:[90,210],hazard:{type:'fireline',name:'边境疏火线',desc:'低频横向火线留出明确闪避窗口。',interval:26,damage:8,size:36,life:4},waves:[
  {at:0,name:'步卒接战',type:'normal',budget:.78,elite:.35,note:'步卒与弓手建立基础走位'},
  {at:60,name:'弓手压线',type:'normal',budget:.88,elite:.45,note:'远程火力开始夹击'},
  {at:150,name:'盾阵试锋',type:'elite',budget:.96,elite:.85,note:'首名精英检验构筑'},
  {at:270,name:'巨将压境',type:'boss',budget:.68,elite:.30,bosses:['B001'],note:'黄巾巨将登场'},
  {at:360,name:'边境决胜',type:'end',budget:0,elite:0,note:'Boss战利品决定通关'}]},
 'ST001-02':{name:'废村守援',spawn:.94,elite:.90,horde:1.05,enemies:[['EN003',4],['EN006',2],['EN002',2]],eventAt:[150,450,780],eventPool:['merchant','goldChest'],chestAt:[300,660,960],hazard:{type:'fireline',name:'救援间歇火线',desc:'较慢火线穿过村道，重装敌群借机包围。',interval:30,damage:9,size:44,life:5},waves:[
  {at:0,name:'村口盾阵',type:'normal',budget:.84,elite:.45,note:'盾兵掩护弓手推进'},
  {at:180,name:'救援窗口',type:'event',budget:.70,elite:.35,note:'短暂回落并处理补给'},
  {at:360,name:'力士围攻',type:'elite',budget:1.18,elite:1.20,note:'重装精英压缩村道'},
  {at:600,name:'双路守援',type:'horde',budget:1.58,elite:.90,note:'高密度包围'},
  {at:900,name:'撤离反扑',type:'horde',budget:1.72,elite:1.05,note:'护送终段持续增压'},
  {at:1080,name:'村口坚守',type:'elite',budget:1.42,elite:1.35,note:'终局精英守线'},
  {at:1200,name:'救援完成',type:'end',budget:0,elite:0,note:'生存目标结算'}]},
 'ST001-03':{name:'妖火祭坛',spawn:1.02,elite:1.20,horde:1.10,enemies:[['EN005',4],['EN002',2],['EN006',2]],eventAt:[180,420,780],eventPool:['altar','rift'],chestAt:[300,600,930],hazard:{type:'fireline',name:'祭坛妖火线',desc:'密集妖火横扫祭坛，迫使玩家持续换边。',interval:19,damage:11,size:48,life:5},waves:[
  {at:0,name:'火箭试探',type:'normal',budget:.94,elite:.55,note:'火箭兵封锁停留区'},
  {at:180,name:'祭坛抉择',type:'event',budget:.76,elite:.40,note:'祭坛或裂缝事件'},
  {at:360,name:'妖火齐射',type:'horde',budget:1.55,elite:.95,note:'范围火力形成密集区'},
  {at:540,name:'力士护坛',type:'elite',budget:1.34,elite:1.55,note:'精英护卫压迫近身空间'},
  {at:720,name:'妖师现身',type:'boss',budget:.82,elite:.42,bosses:['B002'],note:'乱世妖师登场'},
  {at:960,name:'法阵反扑',type:'horde',budget:1.62,elite:1.18,note:'Boss战中敌潮回补'},
  {at:1200,name:'祭坛决胜',type:'end',budget:0,elite:0,note:'检查Boss目标'}]},
 'ST001-04':{name:'骑阵裂隙',spawn:1.08,elite:1.35,horde:1.25,enemies:[['EN004',4],['EN006',3],['EN003',2]],eventAt:[120,510,840],eventPool:['rift','altar'],chestAt:[270,570,900],hazard:{type:'fireline',name:'裂隙烈焰带',desc:'高频宽火线配合骑兵冲锋切割战场。',interval:15,damage:12,size:58,life:5},waves:[
  {at:0,name:'骑兵穿阵',type:'normal',budget:1.02,elite:.62,note:'冲锋敌人提前入场'},
  {at:150,name:'裂隙诱敌',type:'event',budget:.78,elite:.48,note:'高风险事件窗口'},
  {at:330,name:'盾骑夹击',type:'horde',budget:1.68,elite:1.10,note:'盾兵与骑兵同步推进'},
  {at:540,name:'力士破阵',type:'elite',budget:1.48,elite:1.72,note:'重装精英制造缺口'},
  {at:720,name:'骑将冲阵',type:'boss',budget:.88,elite:.52,bosses:['B003'],note:'混沌骑将登场'},
  {at:930,name:'裂隙暴走',type:'horde',budget:1.86,elite:1.35,note:'Boss战场持续高压'},
  {at:1110,name:'封隙死战',type:'elite',budget:1.58,elite:1.72,note:'终局精英压迫'},
  {at:1200,name:'裂隙决胜',type:'end',budget:0,elite:0,note:'检查Boss目标'}]},
 'ST003-01':{name:'妖岭疾袭',spawn:1.05,elite:.80,horde:1.20,enemies:[['EN014',4],['EN015',4],['EN018',2]],eventAt:[180,480,780],eventPool:['merchant','rift'],chestAt:[300,630,960],hazard:{type:'fog',name:'流动薄雾',desc:'薄雾周期遮蔽边缘，疾速妖怪从侧翼突入。',frequency:.18,density:.58},waves:[
  {at:0,name:'猴妖探路',type:'normal',budget:.92,elite:.42,note:'快速近战建立节奏'},
  {at:180,name:'狼妖侧袭',type:'horde',budget:1.48,elite:.72,note:'侧翼敌群短促爆发'},
  {at:390,name:'飞妖掠阵',type:'normal',budget:1.16,elite:.70,note:'空中远射迫使转向'},
  {at:600,name:'山道奔袭',type:'horde',budget:1.72,elite:.92,note:'疾速混编持续推进'},
  {at:840,name:'雾中补给',type:'event',budget:.76,elite:.48,note:'事件后快速回压'},
  {at:1020,name:'妖岭冲锋',type:'horde',budget:1.88,elite:1.08,note:'终局速度峰值'},
  {at:1200,name:'入口突破',type:'end',budget:0,elite:0,note:'生存目标结算'}]},
 'ST003-02':{name:'白骨迷雾',spawn:.92,elite:1.15,horde:.95,enemies:[['EN016',4],['EN019',3],['EN020',2]],eventAt:[150,540,870],eventPool:['altar','goldChest'],chestAt:[330,690,990],hazard:{type:'fog',name:'白骨浓雾',desc:'浓雾长时间压低视野，术师与石妖构成阵地战。',frequency:.24,density:.88},waves:[
  {at:0,name:'蛇妖毒径',type:'normal',budget:.82,elite:.58,note:'毒性远射限制路径'},
  {at:210,name:'术师布阵',type:'normal',budget:1.08,elite:.82,note:'召唤单位逐步增多'},
  {at:420,name:'石妖封路',type:'elite',budget:1.28,elite:1.48,note:'高耐久精英堵塞通道'},
  {at:690,name:'迷阵换位',type:'event',budget:.68,elite:.46,note:'资源窗口短暂降压'},
  {at:840,name:'白骨围阵',type:'horde',budget:1.52,elite:1.12,note:'召唤与毒射混编'},
  {at:1080,name:'浓雾镇守',type:'elite',budget:1.44,elite:1.62,note:'终局重装精英'},
  {at:1200,name:'迷阵穿越',type:'end',budget:0,elite:0,note:'生存目标结算'}]},
 'ST003-03':{name:'牛魔重阵',spawn:.96,elite:1.35,horde:1.05,enemies:[['EN017',4],['EN020',3],['EN014',2]],eventAt:[210,510,810],eventPool:['rift','altar'],chestAt:[300,660,960],hazard:{type:'fog',name:'沉降妖尘',desc:'妖尘间歇收拢视野，重装敌人正面推进。',frequency:.15,density:.66},waves:[
  {at:0,name:'石妖列阵',type:'normal',budget:.96,elite:.68,note:'高耐久前排缓慢推进'},
  {at:240,name:'牛妖重压',type:'elite',budget:1.32,elite:1.55,note:'首轮重装精英'},
  {at:420,name:'妖军踏阵',type:'horde',budget:1.54,elite:1.12,note:'低速高血敌潮'},
  {at:600,name:'试炼补给',type:'chest',budget:.72,elite:.42,note:'Boss前构筑窗口'},
  {at:720,name:'牛魔试炼',type:'boss',budget:.86,elite:.48,bosses:['B006'],note:'牛魔妖王登场'},
  {at:960,name:'岩阵回响',type:'elite',budget:1.52,elite:1.72,note:'Boss战中重装回补'},
  {at:1200,name:'试炼决胜',type:'end',budget:0,elite:0,note:'检查Boss目标'}]},
 'ST003-04':{name:'魔猿乱潮',spawn:1.12,elite:1.25,horde:1.35,enemies:[['EN014',4],['EN018',3],['EN019',3]],eventAt:[120,420,750],eventPool:['rift','goldChest'],chestAt:[240,570,900],hazard:{type:'fog',name:'翻涌妖云',desc:'妖云快速明暗变化，召唤与飞行敌群连续换位。',frequency:.30,density:.94},waves:[
  {at:0,name:'群猴乱入',type:'horde',budget:1.18,elite:.62,note:'开场即进入密集近战'},
  {at:180,name:'飞妖遮天',type:'normal',budget:1.24,elite:.82,note:'远射与近战快速换层'},
  {at:360,name:'术师唤群',type:'elite',budget:1.42,elite:1.45,note:'精英术师持续召唤'},
  {at:540,name:'妖云狂潮',type:'horde',budget:1.88,elite:1.22,note:'Boss前密度峰值'},
  {at:720,name:'魔猿降临',type:'boss',budget:.92,elite:.50,bosses:['B008'],note:'混世魔猿登场'},
  {at:900,name:'棍影群潮',type:'horde',budget:1.96,elite:1.38,note:'Boss战中持续增援'},
  {at:1080,name:'万妖反扑',type:'elite',budget:1.72,elite:1.78,note:'终局精英与召唤混合'},
  {at:1200,name:'妖岭决胜',type:'end',budget:0,elite:0,note:'检查Boss目标'}]},
 'ST004-01':{name:'暗器封锁线',spawn:1.04,elite:.90,horde:1.10,enemies:[['EN022',5],['EN021',2],['EN027',1]],eventAt:[180,480,810],eventPool:['merchant','goldChest'],chestAt:[300,630,960],hazard:{type:'blast',name:'稀疏爆符区',desc:'小型爆符定点预警，暗器忍从远处封锁走位。',interval:9,damage:12,size:34,life:1.35},waves:[
  {at:0,name:'暗器试射',type:'normal',budget:.90,elite:.46,note:'远程忍者建立火力线'},
  {at:210,name:'下忍突入',type:'normal',budget:1.12,elite:.66,note:'近战牵制远程射线'},
  {at:420,name:'医疗增援',type:'elite',budget:1.24,elite:1.32,note:'优先处理精英与医忍'},
  {at:660,name:'封锁齐射',type:'horde',budget:1.62,elite:.96,note:'远程密度明显提升'},
  {at:870,name:'忍具补给',type:'event',budget:.72,elite:.44,note:'终局前资源选择'},
  {at:1050,name:'暗器绝阵',type:'elite',budget:1.52,elite:1.52,note:'精英射手终局压迫'},
  {at:1200,name:'封锁突破',type:'end',budget:0,elite:0,note:'生存目标结算'}]},
 'ST004-02':{name:'爆符峡谷',spawn:1.08,elite:1.10,horde:1.20,enemies:[['EN026',5],['EN023',3],['EN024',2]],eventAt:[150,450,780],eventPool:['altar','rift'],chestAt:[270,600,930],hazard:{type:'blast',name:'连锁爆符区',desc:'大范围爆符快速落点，火忍与雷忍迫使连续闪避。',interval:5.5,damage:16,size:46,life:1.05},waves:[
  {at:0,name:'爆符投放',type:'normal',budget:1.02,elite:.58,note:'陷阱忍者限制安全区'},
  {at:180,name:'火雷夹谷',type:'horde',budget:1.52,elite:.92,note:'范围火力与突进混合'},
  {at:390,name:'爆符精锐',type:'elite',budget:1.38,elite:1.48,note:'精英陷阱制造者入场'},
  {at:600,name:'峡谷连爆',type:'horde',budget:1.78,elite:1.08,note:'危险区与怪潮同步加速'},
  {at:840,name:'雷忍突阵',type:'elite',budget:1.48,elite:1.62,note:'高速精英追击'},
  {at:1050,name:'爆符封谷',type:'horde',budget:1.92,elite:1.36,note:'终局范围压迫'},
  {at:1200,name:'峡谷穿越',type:'end',budget:0,elite:0,note:'生存目标结算'}]},
 'ST004-03':{name:'炎雷王域',spawn:1.06,elite:1.30,horde:1.18,enemies:[['EN023',3],['EN024',4],['EN027',2]],eventAt:[180,510,840],eventPool:['goldChest','rift'],chestAt:[300,660,990],hazard:{type:'blast',name:'炎雷交错区',desc:'中频爆符与高速雷忍交替压迫，双王依次登场。',interval:7,damage:17,size:42,life:.95},waves:[
  {at:0,name:'炎忍开阵',type:'normal',budget:1.00,elite:.62,note:'火忍范围压迫'},
  {at:210,name:'雷忍穿场',type:'horde',budget:1.48,elite:.92,note:'高速突进接管节奏'},
  {at:420,name:'炎雷精锐',type:'elite',budget:1.46,elite:1.62,note:'精英火雷混编'},
  {at:600,name:'双王前哨',type:'chest',budget:.76,elite:.46,note:'双Boss前构筑窗口'},
  {at:720,name:'炎雷双王',type:'boss',budget:.84,elite:.42,bosses:['B009','B010'],note:'炎狱忍王后接雷瞬忍王'},
  {at:930,name:'王域增援',type:'horde',budget:1.72,elite:1.26,note:'双王战中忍军增援'},
  {at:1110,name:'炎雷终阵',type:'elite',budget:1.62,elite:1.76,note:'终局高速精英'},
  {at:1200,name:'双王决胜',type:'end',budget:0,elite:0,note:'检查双Boss目标'}]},
 'ST004-04':{name:'万影终阵',spawn:1.16,elite:1.45,horde:1.45,enemies:[['EN025',5],['EN026',2],['EN022',2]],eventAt:[120,420,720],eventPool:['rift','altar'],chestAt:[240,540,870],hazard:{type:'blast',name:'万影爆符阵',desc:'高频大范围爆符压缩空间，分身忍持续复制。',interval:4.8,damage:18,size:48,life:.85},waves:[
  {at:0,name:'分身涌现',type:'horde',budget:1.22,elite:.72,note:'分身敌群开场复制'},
  {at:180,name:'暗器猎杀',type:'normal',budget:1.32,elite:.92,note:'远程火力穿插分身'},
  {at:360,name:'万影精锐',type:'elite',budget:1.54,elite:1.68,note:'高压精英分身'},
  {at:540,name:'影潮覆场',type:'horde',budget:2.02,elite:1.36,note:'Boss前最高密度怪潮'},
  {at:720,name:'忍王终阵',type:'boss',budget:.96,elite:.52,bosses:['B011'],note:'万影忍王登场'},
  {at:900,name:'影界增殖',type:'horde',budget:2.10,elite:1.52,note:'Boss战中分身持续增长'},
  {at:1080,name:'万影处刑',type:'elite',budget:1.84,elite:1.92,note:'终局精英压迫'},
 {at:1200,name:'战役决胜',type:'end',budget:0,elite:0,note:'检查Boss目标'}]}
};

window.WW.config.storyCurve={
 'ST001-01':{budget:.64,beat:'首战保护',hp:.90,dmg:.82,speed:.96,incoming:.58,bossHp:3.00,note:'六分钟教学Boss，低承伤与疏潮换取完整三阶段首领体验。'},
 'ST001-02':{budget:.76,beat:'首个长局',hp:.92,dmg:.86,speed:.97,incoming:.72,bossHp:.90,note:'无Boss守援关，延长构筑时间并温和抬升怪潮密度。'},
 'ST001-03':{budget:.90,beat:'首个标准Boss',hp:.96,dmg:.90,speed:.98,incoming:.76,bossHp:.92,note:'祭坛火线与单Boss形成第一处明确战役峰值。'},
 'ST001-04':{budget:1.03,beat:'章节决战',hp:1.00,dmg:.94,speed:1.00,incoming:.80,bossHp:.95,note:'裂隙高压怪潮接骑将，完成第一章强度收束。'},
 'ST003-01':{budget:1.10,beat:'新章换速',hp:.98,dmg:.92,speed:1.01,incoming:.80,bossHp:.96,note:'降低重装倍率，以高速妖怪和薄雾建立章节转换。'},
 'ST003-02':{budget:1.18,beat:'阵地耐久',hp:1.02,dmg:.96,speed:1.00,incoming:.84,bossHp:.98,note:'浓雾、术师与石妖把压力从速度切换为耐久。'},
 'ST003-03':{budget:1.30,beat:'重阵Boss',hp:1.06,dmg:1.00,speed:1.01,incoming:.88,bossHp:.98,note:'重装精英和牛魔Boss构成第二章首个稳定峰值。'},
 'ST003-04':{budget:1.42,beat:'妖岭决战',hp:1.10,dmg:1.04,speed:1.03,incoming:.90,bossHp:1.00,note:'高密妖潮与魔猿连续换位，验证成熟构筑清场能力。'},
 'ST004-01':{budget:1.48,beat:'忍界换章',hp:1.04,dmg:1.00,speed:1.04,incoming:.88,bossHp:.98,note:'略收生命压力，以暗器封锁和稀疏爆符重建节奏。'},
 'ST004-02':{budget:1.60,beat:'爆符进阶',hp:1.08,dmg:1.04,speed:1.05,incoming:.92,bossHp:1.00,note:'连锁爆符配合火雷忍，形成持续走位检查。'},
 'ST004-03':{budget:1.76,beat:'双王峰值',hp:1.12,dmg:1.07,speed:1.06,incoming:.94,bossHp:.86,note:'单体Boss生命下调但连续两战，总首领负载形成刻意峰值。'},
 'ST004-04':{budget:1.90,beat:'战役终阵',hp:1.16,dmg:1.10,speed:1.07,incoming:.96,bossHp:1.04,note:'最高怪潮、精英与万影忍王共同构成最终构筑检查。'}
};

const ELITE_AFFIXES=[
 {id:'swift',name:'迅捷',desc:'移速+35%',apply:e=>{e.speed*=1.35}},
 {id:'tank',name:'坚甲',desc:'生命+80%',apply:e=>{e.hp*=1.8;e.maxHp*=1.8}},
 {id:'volatile',name:'爆裂',desc:'死亡爆炸',apply:e=>{e.volatile=true}},
 {id:'vamp',name:'吸血',desc:'命中回复',apply:e=>{e.vamp=true}},
 {id:'aura',name:'压制光环',desc:'靠近降低玩家移速',apply:e=>{e.aura=true}},
 {id:'split',name:'分裂',desc:'死亡分裂',apply:e=>{e.split=true}}
];

const MAP_EVENTS=[
 {id:'merchant',name:'万界游商',desc:'用金币购买一次局内强化。'},
 {id:'altar',name:'战神祭坛',desc:'获得强力增益，但附带代价。'},
 {id:'goldChest',name:'黄金宝箱',desc:'直接获得技能升级或装备掉落。'},
 {id:'rift',name:'时空裂缝',desc:'召唤精英怪，胜利后获得高品质奖励。'}
];

const SAVE_KEY='wanjie_v18_alpha_content';
const DEFAULT_SAVE={
 accountLv:12,gold:6000,hero:'H001',
 heroes:{H001:{unlocked:true,level:6,mastery:40},H002:{unlocked:false,level:1,mastery:0},H007:{unlocked:false,level:1,mastery:0},H010:{unlocked:true,level:4,mastery:20},H012:{unlocked:true,level:5,mastery:28},H019:{unlocked:false,level:1,mastery:0}},
 equip:{weapon:'EQW001',armor:'EQA001',accessory:'EQX001'},runes:['R031','R012','R043'],pet:'PET001',
 build:{active:['A011','A021','A026','A027','A003','A054'],passive:['P026','P017','P030','P019','P016','P018']},
 chapters:{ST001:{stars:{'ST001-01':3,'ST001-02':2,'ST001-03':0,'ST001-04':0}},ST003:{stars:{}},ST004:{stars:{}}},
 selectedChapter:'ST001',selectedStage:'ST001-03',
 inventory:{gear:['EQW001','EQW003','EQW005','EQA001','EQA003','EQA005','EQX001','EQX003','EQX005'],runes:['R031','R012','R043','R001','R017','R021'],pets:['PET001','PET002','PET007','PET011','PET015']},
 stats:{runs:4,kills:1840,bossKills:9},
 settings:{shake:true,numbers:true,particles:true,vignette:true,tutorialSeen:false}
};

function clone(x){return JSON.parse(JSON.stringify(x))}
function merge(a,b){for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k]))a[k]=merge(a[k],b[k]);else a[k]=b[k]}return a}
function loadSave(){try{return merge(clone(DEFAULT_SAVE),JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'))}catch(e){return clone(DEFAULT_SAVE)}}
let save=loadSave(),lastResult=null;
function persist(){recomputeWorldUnlocks();localStorage.setItem(SAVE_KEY,JSON.stringify(save));renderAll()}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(window.tt);window.tt=setTimeout(()=>t.classList.remove('show'),1600)}
function hint(m){const t=document.getElementById('eventHint');t.textContent=m;t.classList.add('show');clearTimeout(window.hh);window.hh=setTimeout(()=>t.classList.remove('show'),1700)}
function log(m){const d=document.createElement('div');d.textContent=m;const l=document.getElementById('battleLog');l.prepend(d);while(l.children.length>14)l.lastChild.remove()}
function fmt(sec){let m=Math.floor(sec/60),s=Math.floor(sec%60);return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
const PAGE_TITLES={home:'主大厅',heroes:'英雄',growth:'长期成长',loadout:'行囊',build:'战斗构筑',modes:'游戏模式',briefing:'出战简报',world:'世界地图',battle:'战斗',result:'战利结算'};
const mobileNavPanel=document.getElementById('mobileNavPanel'),navMore=document.getElementById('navMore');
function setMobileNavOpen(open){mobileNavPanel.classList.toggle('open',open);navMore.setAttribute('aria-expanded',String(open))}
function go(id){
 const page=document.getElementById(id);if(!page)return;
 document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
 document.querySelectorAll('.nav button[data-page]').forEach(b=>{const active=b.dataset.page===id;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 const overflowActive=!!mobileNavPanel.querySelector(`button[data-page="${id}"]:not([data-nav-tier="flow"])`);navMore.classList.toggle('active',overflowActive);
 page.classList.add('active');document.getElementById('pageTitle').textContent=PAGE_TITLES[id]||'万界无双';setMobileNavOpen(false);WW.ui.shell.sync(id);if(id==='battle')resizeArena()
}
document.querySelectorAll('.nav button[data-page]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
navMore.addEventListener('click',()=>setMobileNavOpen(!mobileNavPanel.classList.contains('open')));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mobileNavPanel.classList.contains('open')){setMobileNavOpen(false);e.preventDefault();e.stopImmediatePropagation()}},true);

function storyStageEntry(id){for(const [chapter,c] of Object.entries(WW.config.stage)){const stage=c.stages.find(st=>st[0]===id);if(stage)return {chapter,stage}}return null}
function storyStageContract(id){return storyStageEntry(id)?.stage[5]||null}
function storyStageEncounter(id=save.selectedStage){return WW.config.storyEncounters[id]||null}
function storyStageRecord(id){const entry=storyStageEntry(id),value=Number(entry&&save.chapters[entry.chapter]?.stars?.[id]);return entry&&Number.isFinite(value)?Math.max(0,Math.min(3,value)):0}
function storyStageUnlocked(id){const contract=storyStageContract(id);return !!contract&&(!contract.unlockAfter||storyStageRecord(contract.unlockAfter)>0)}
function storyStarAward(victory,hp,maxHp,id=save.selectedStage){if(!victory)return 0;const stars=storyStageContract(id)?.stars||{clear:2,mastery:3,masteryHp:.55};return maxHp>0&&hp/maxHp>stars.masteryHp?stars.mastery:stars.clear}
function storyBestStars(id,stars){return Math.max(storyStageRecord(id),Math.max(0,Math.min(3,Number(stars)||0)))}
function storyBossNames(id){return (storyStageContract(id)?.bosses||[]).map(bossId=>WW.config.boss[bossId]?.name||bossId)}
function storyStageReward(id,stars){const entry=storyStageEntry(id),contract=entry?.stage[5],base=entry?.stage[3]||0,star=(Number(stars)||0)*(contract?.reward?.starGold||0);return {base,star,total:base+star}}
function storyStageSchedule(id){const contract=storyStageContract(id),bosses=storyBossNames(id);if(!contract)return'—';return bosses.length?fmt(contract.bossAt)+' '+bosses.join(' → ')+' · '+fmt(contract.duration)+' 决胜':fmt(contract.duration)+' 生存目标'}
function storyStageSuccess(id){const entry=storyStageEntry(id),bosses=storyBossNames(id);return bosses.length?bosses.join('、')+'已击败 · '+entry.stage[1]+'完成':entry.stage[1]+' · 生存目标完成'}
function storyStageTimeout(id){const contract=storyStageContract(id),bosses=storyBossNames(id);return fmt(contract?.duration||0)+' 时限到达 · '+(bosses.length?bosses.join('、')+'未全部击败':'生存目标未完成')}
function chapterStars(id){return (WW.config.stage[id]?.stages||[]).reduce((total,stage)=>total+storyStageRecord(stage[0]),0)}
function totalStars(){return Object.keys(WW.config.stage).reduce((a,id)=>a+chapterStars(id),0)}
function recomputeWorldUnlocks(){WW.config.stage.ST001.unlock=true;WW.config.stage.ST003.unlock=storyStageUnlocked('ST003-01');WW.config.stage.ST004.unlock=storyStageUnlocked('ST004-01')}
function gearScore(){return Object.values(save.equip).reduce((s,id)=>s+(WW.config.gear[id]?.score||0),0)}
function runeScore(){return save.runes.reduce((s,id)=>s+(WW.config.rune[id]?.score||0),0)}
function petScore(){return WW.config.pet[save.pet]?.score||0}
function buildScore(){const e=reachableBuildEvos().length,f=reachableBuildFusions().length;return Math.round(save.build.active.length*70+save.build.passive.length*45+e*35+f*75)}
function combatPower(){const h=save.heroes[save.hero];return Math.round(1200+save.accountLv*70+(h.level-1)*110+gearScore()*1.7+runeScore()*2.1+petScore()*2+buildScore()*.55)}
function heroStats(id){const h=WW.config.hero[id],s=save.heroes[id],lv=1+(s.level-1)*.04;return {hp:Math.round(h.hp*(1+(s.level-1)*.03)),atk:Math.round(h.atk*lv),def:Math.round(h.def*(1+(s.level-1)*.02)),move:h.move,aspd:h.aspd,crit:h.crit}}
function skillName(id){return WW.config.skill[id]||WW.config.evolution[id]?.[0]||FUSIONS[id]?.[0]||id}
function glyph(id){return skillName(id).slice(0,1)}
function reachableBuildEvos(){return Object.entries(WW.config.evolution).filter(([id,[n,a,p]])=>save.build.active.includes(a)&&save.build.passive.includes(p)).map(([id])=>id)}
function reachableBuildFusions(){const e=new Set(reachableBuildEvos());return Object.entries(FUSIONS).filter(([id,[n,a,b]])=>e.has(a)&&e.has(b)).map(([id])=>id)}
function selectedStageInfo(){for(const [cid,c] of Object.entries(WW.config.stage)){for(const st of c.stages)if(st[0]===save.selectedStage)return {chapter:cid,stage:st}}return {chapter:'ST001',stage:WW.config.stage.ST001.stages[0]}}
function worldProgress(){return Math.round(totalStars()/36*100)}

function renderTop(){
 const si=selectedStageInfo();document.getElementById('topLv').textContent=save.accountLv;document.getElementById('topPower').textContent=combatPower().toLocaleString();document.getElementById('topGold').textContent=save.gold.toLocaleString();document.getElementById('topStars').textContent=totalStars();
 const bosses=storyBossNames(si.stage[0]);document.getElementById('homeHero').textContent=WW.config.hero[save.hero].name;document.getElementById('homeStage').textContent=save.selectedStage;document.getElementById('homeBoss').textContent=bosses.join(' → ')||'无首领';document.getElementById('homeGear').textContent=gearScore();document.getElementById('homeBuild').textContent=buildScore();document.getElementById('homeWorld').textContent=worldProgress()+'%';WW.ui?.nexusHub?.render()
}
function continueFlow(){go('heroes')}
