// 规则层：纯函数，只根据传入数据计算结果，不碰存储与界面
export const idxOf=(data,sid)=>data.sessions.findIndex(s=>s.id===sid);
export const sessionOf=(data,sid)=>data.sessions.find(s=>s.id===sid);
export const charOf=(data,name)=>data.characters.find(c=>c.name===name);
export const activeIn=char=>char.stints.some(st=>st.to==null);

// 角色在某章是否在队：按经历段 [from, to]（to 为最后参与章节，null 表示至今）判断
export const inParty=(data,char,sid)=>{
  const i=idxOf(data,sid);if(i<0||!char)return false;
  return char.stints.some(st=>{
    const from=idxOf(data,st.from);
    const to=st.to==null?Infinity:idxOf(data,st.to);
    return i>=from&&i<=to;
  });
};

// 勾选/取消参与人：离队后的章节不可勾选
export const toggleParticipant=(data,sid,name)=>{
  const char=charOf(data,name),s=sessionOf(data,sid);
  if(!char||!s)return{data,error:'章节或角色不存在'};
  const on=s.participants.includes(name);
  if(!on&&!inParty(data,char,sid))
    return{data,error:`「${name}」在「${s.title}」期间已离队，不能勾选为参与人`};
  const participants=on?s.participants.filter(n=>n!==name):[...s.participants,name];
  return{data:{...data,sessions:data.sessions.map(x=>x.id===sid?{...x,participants}:x)}};
};

// 离队：结束当前经历段，sid 为最后参与的章节
export const leaveParty=(data,name,sid)=>{
  const char=charOf(data,name);
  if(!char)return{data,error:'角色不存在'};
  if(!activeIn(char))return{data,error:`「${name}」当前不在队中`};
  const stints=char.stints.map(st=>st.to==null?{...st,to:sid}:st);
  return{data:{...data,characters:data.characters.map(c=>c.name===name?{...c,stints}:c)}};
};

// 归队：另建一段经历，旧出场记录保留
export const rejoinParty=(data,name,sid)=>{
  const char=charOf(data,name);
  if(!char)return{data,error:'角色不存在'};
  if(activeIn(char))return{data,error:`「${name}」已在队中`};
  const stints=[...char.stints,{from:sid,to:null}];
  return{data:{...data,characters:data.characters.map(c=>c.name===name?{...c,stints}:c)}};
};

// 登记线索
export const addClue=(data,{title,source,owner})=>{
  if(!title.trim())return{data,error:'请填写线索标题'};
  const clue={id:Date.now(),title:title.trim(),source,owner,status:'open',followups:[],conclusion:'',closedIn:null,conflicts:[]};
  return{data:{...data,clues:[...data.clues,clue]}};
};

// 章节结算：未解线索自动进入下一章（写入后续出处）
export const settleChapter=(data,sid)=>{
  const i=idxOf(data,sid),next=data.sessions[i+1];
  if(i<0)return{data,error:'章节不存在'};
  if(!next)return{data,error:'已是最后一章，没有下一章可承接'};
  const clues=data.clues.map(c=>{
    if(c.status!=='open'||idxOf(data,c.source)>i)return c;
    return c.followups.includes(next.id)?c:{...c,followups:[...c.followups,next.id]};
  });
  const sessions=data.sessions.map(s=>s.id===sid?{...s,settled:true}:s);
  const carried=clues.filter(c=>c.status==='open'&&idxOf(data,c.source)<=i).length;
  return{data:{...data,sessions,clues},carried};
};

// 关闭线索：必须写结论并关联收束章节；重复关闭只保留最早一次，并记录冲突（线索、章节、原状态）
export const closeClue=(data,cid,sid,conclusion)=>{
  const clue=data.clues.find(c=>c.id===cid);
  if(!clue)return{data,error:'线索不存在'};
  const s=sessionOf(data,sid);
  if(clue.status==='closed'){
    const first=sessionOf(data,clue.closedIn);
    const conflict={clue:clue.title,chapter:first?first.title:'未知章节',originalStatus:'已关闭',attempt:s?s.title:'',at:Date.now()};
    const clues=data.clues.map(c=>c.id===cid?{...c,conflicts:[...c.conflicts,conflict]}:c);
    return{data:{...data,clues},conflict};
  }
  if(!s)return{data,error:'请选择收束章节'};
  if(!conclusion.trim())return{data,error:'关闭线索必须填写结论'};
  const clues=data.clues.map(c=>c.id===cid?{...c,status:'closed',conclusion:conclusion.trim(),closedIn:sid}:c);
  return{data:{...data,clues}};
};

// 线索追踪：来源 → 经办角色及其经历变化 → 后续出处 → 最终收束
export const traceClue=(data,cid)=>{
  const clue=data.clues.find(c=>c.id===cid);if(!clue)return null;
  const owner=charOf(data,clue.owner);
  return{
    clue,source:sessionOf(data,clue.source),owner,
    ownerStints:owner?owner.stints.map(st=>({from:sessionOf(data,st.from),to:st.to==null?null:sessionOf(data,st.to)})):[],
    followups:clue.followups.map(id=>sessionOf(data,id)).filter(Boolean),
    closedIn:clue.closedIn==null?null:sessionOf(data,clue.closedIn)
  };
};

// 某章相关的线索：源于本章、在本章有后续、或收束于本章
export const cluesIn=(data,sid)=>data.clues.filter(c=>c.source===sid||c.followups.includes(sid)||c.closedIn===sid);
