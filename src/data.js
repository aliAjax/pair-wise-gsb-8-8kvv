// 数据层：种子数据、本地存储读写、旧版本数据迁移
const KEY='campaign-log';

export const seed={
  name:'暮光边境',system:'D&D 5E',
  sessions:[
    {id:1,date:'2024-06-08',title:'第一章：灰港的钟声',summary:'队伍抵达灰港，在失落的钟楼发现了神秘符文。',tag:'主线',color:'#d8a153',participants:['艾德里安','瑟琳','莫尔'],settled:true},
    {id:2,date:'2024-06-15',title:'第二章：雾中来客',summary:'与流浪法师伊琳结盟，追踪海雾中的脚印。',tag:'主线',color:'#93b7a6',participants:['艾德里安','瑟琳','莫尔'],settled:true},
    {id:3,date:'2024-06-22',title:'支线：深林采药',summary:'帮助村民寻找月光草，获得一枚古老铜币。',tag:'支线',color:'#b9a6d1',participants:['艾德里安','瑟琳'],settled:false}
  ],
  characters:[
    {name:'艾德里安',role:'圣骑士',player:'林默',color:'#d8a153',stints:[{from:1,to:null}]},
    {name:'瑟琳',role:'游侠',player:'安然',color:'#93b7a6',stints:[{from:1,to:null}]},
    {name:'莫尔',role:'术士',player:'周岳',color:'#b9a6d1',stints:[{from:1,to:2}]}
  ],
  clues:[
    {id:1,title:'钟楼神秘符文的含义',source:1,owner:'艾德里安',status:'open',followups:[2],conclusion:'',closedIn:null,conflicts:[]},
    {id:2,title:'海雾中的脚印去向',source:2,owner:'瑟琳',status:'open',followups:[],conclusion:'',closedIn:null,conflicts:[]},
    {id:3,title:'古老铜币的来历',source:3,owner:'莫尔',status:'closed',followups:[],conclusion:'铜币属于沉没商队，已交还灰港博物馆。',closedIn:3,conflicts:[]}
  ]
};

// 旧存档补齐新字段：线索表、角色经历段、章节参与人
export const normalize=d=>({
  ...seed,...d,
  sessions:(d.sessions||[]).map(s=>({participants:[],settled:false,...s})),
  characters:(d.characters||[]).map(c=>({stints:[{from:1,to:null}],...c})),
  clues:(d.clues||[]).map(c=>({followups:[],conflicts:[],conclusion:'',closedIn:null,...c}))
});

export const load=()=>{try{return normalize(JSON.parse(localStorage.getItem(KEY))||seed)}catch{return normalize(seed)}};
export const save=d=>localStorage.setItem(KEY,JSON.stringify(d));
