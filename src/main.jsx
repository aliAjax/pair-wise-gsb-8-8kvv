import React,{useEffect,useState}from'react';
import{createRoot}from'react-dom/client';
import{load,save}from'./data.js';
import*as R from'./rules.js';
import'./styles.css';

const TITLES={timeline:'战役时间线',clues:'线索追踪板',characters:'角色与阵营',places:'地点图鉴',loot:'战利品'};

function App(){
  const[data,setData]=useState(load);
  const[tab,setTab]=useState('timeline');
  const[active,setActive]=useState(1);
  const[modal,setModal]=useState(null); // 'chapter' | 'clue' | 'close'
  const[closeFor,setCloseFor]=useState(null);
  const[traceFor,setTraceFor]=useState(null);
  const[notice,setNotice]=useState('');
  const[form,setForm]=useState({title:'',date:'2024-07-01',summary:'',tag:'主线'});
  const[clueForm,setClueForm]=useState({title:'',source:1,owner:'艾德里安'});
  const[closeForm,setCloseForm]=useState({session:1,conclusion:''});
  useEffect(()=>save(data),[data]);
  useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(t)},[notice]);

  const cur=data.sessions.find(x=>x.id===active)||data.sessions[0];
  const lastId=data.sessions[data.sessions.length-1]?.id;
  const stitle=id=>data.sessions.find(s=>s.id===id)?.title||'未知章节';
  // 统一执行规则：有数据变更就落库，有错误/冲突就提示
  const run=r=>{
    if(r.data&&r.data!==data)setData(r.data);
    if(r.error)setNotice(r.error);
    if(r.conflict)setNotice(`重复关闭已忽略：线索「${r.conflict.clue}」最早于「${r.conflict.chapter}」关闭，原状态：${r.conflict.originalStatus}`);
    return r;
  };

  const addChapter=()=>{
    if(!form.title)return;
    const s={...form,id:Date.now(),color:'#d8a153',settled:false,participants:data.characters.filter(R.activeIn).map(c=>c.name)};
    setData({...data,sessions:[...data.sessions,s]});
    setActive(s.id);setForm({title:'',date:'2024-07-01',summary:'',tag:'主线'});setModal(null);setNotice('新章节已加入时间线');
  };
  const addClue=()=>{
    const r=run(R.addClue(data,clueForm));
    if(!r.error){setModal(null);setClueForm({title:'',source:lastId,owner:data.characters[0]?.name||''});setNotice('线索已登记到追踪板')}
  };
  const doClose=()=>{
    const r=run(R.closeClue(data,closeFor,closeForm.session,closeForm.conclusion));
    if(r.conflict||!r.error){setModal(null);if(!r.conflict)setNotice('线索已关闭，结论与收束章节已记录')}
  };
  const settle=()=>{const r=run(R.settleChapter(data,cur.id));if(!r.error)setNotice(`本章已结算，${r.carried} 条未解线索进入下一章`)};
  const leave=name=>{const r=run(R.leaveParty(data,name,lastId));if(!r.error)setNotice(`「${name}」已离队，后续章节不可勾选为参与人`)};
  const rejoin=name=>{const r=run(R.rejoinParty(data,name,lastId));if(!r.error)setNotice(`「${name}」已归队，新增一段经历`)};
  const exportData=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='campaign.json';a.click();setNotice('战役记录已导出')};

  return <div className="shell">
    <aside>
      <div className="logo"><span>✦</span> CAMPAIGNER</div>
      <div className="campaign"><small>当前战役</small><strong>{data.name}</strong><span>{data.system} · 2024</span></div>
      <nav>{[['timeline','◌','时间线'],['clues','⌕','线索追踪板'],['characters','♙','角色与阵营'],['places','⌖','地点图鉴'],['loot','◇','战利品']].map(([id,i,t])=><button className={tab===id?'active':''} onClick={()=>setTab(id)} key={id}><i>{i}</i>{t}</button>)}</nav>
      <div className="side-bottom"><button>⚙ 偏好设置</button><small>本地存储已开启</small></div>
    </aside>
    <main>
      <header>
        <div><span className="crumb">MY CAMPAIGN / {data.system}</span><h1>{TITLES[tab]}</h1></div>
        <div className="actions">
          <button onClick={exportData} className="outline">↓ 导出</button>
          {tab==='clues'
            ?<button onClick={()=>{setClueForm({title:'',source:lastId,owner:data.characters[0]?.name||''});setModal('clue')}} className="primary">＋ 新建线索</button>
            :<button onClick={()=>setModal('chapter')} className="primary">＋ 新建章节</button>}
        </div>
      </header>

      {tab==='timeline'&&<div className="timeline-layout">
        <section className="timeline">
          <div className="timeline-intro"><div><span>THE CHRONICLE</span><h2>记录每一次冒险</h2></div><span className="count">{data.sessions.length} CHAPTERS</span></div>
          {data.sessions.map((s,i)=><button className={'chapter '+(active===s.id?'selected':'')} onClick={()=>setActive(s.id)} key={s.id}>
            <div className="date"><b>{new Date(s.date).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'})}</b><small>{new Date(s.date).getFullYear()}</small></div>
            <div className="line"><span style={{background:s.color}}></span>{i<data.sessions.length-1&&<i/>}</div>
            <div className="chapter-copy"><div className="tag">{s.tag}</div><h3>{s.title}</h3><p>{s.summary}</p></div>
            <span className="arrow">↗</span>
          </button>)}
        </section>
        <section className="detail-panel">
          <div className="detail-cover" style={{background:cur?.color}}><span>CHAPTER {String(data.sessions.findIndex(x=>x.id===active)+1).padStart(2,'0')}</span><i>✦</i></div>
          <div className="detail-body">
            <span className="tag">{cur?.tag}</span>
            <h2>{cur?.title}</h2>
            <p>{cur?.summary}</p>
            <div className="meta-grid">
              <div><small>游戏日期</small><strong>{cur?.date}</strong></div>
              <div><small>参与者</small><strong>{(cur?.participants||[]).length} 位玩家</strong></div>
            </div>
            <div className="participants">
              <small className="crumb">本章参与人（离队角色不可勾选）</small>
              {data.characters.map(c=>{
                const ok=R.inParty(data,c,cur.id),on=(cur.participants||[]).includes(c.name);
                return<label key={c.name} className={ok||on?'':'off'}>
                  <input type="checkbox" checked={on} disabled={!ok&&!on} onChange={()=>run(R.toggleParticipant(data,cur.id,c.name))}/>
                  {c.name}{!ok&&<em>（已离队）</em>}
                </label>})}
            </div>
            {R.cluesIn(data,cur.id).length>0&&<div className="chapter-clues">
              <small className="crumb">本章相关线索</small>
              {R.cluesIn(data,cur.id).map(c=><span key={c.id}>{c.status==='open'?'◌':'●'} {c.title}<b>{c.source===cur.id?'源于本章':c.closedIn===cur.id?'收束于本章':'后续涉及'}</b></span>)}
            </div>}
            {cur&&!cur.settled&&cur.id!==lastId&&<button className="primary settle" onClick={settle}>✓ 结算本章（未解线索进入下一章）</button>}
            {cur?.settled&&<div className="settled-note">本章已结算，未解线索已进入下一章</div>}
          </div>
        </section>
      </div>}

      {tab==='clues'&&<section className="clues">
        <div className="section-note">追踪板共 {data.clues.length} 条线索：{data.clues.filter(c=>c.status==='open').length} 条未解（章节结算后自动进入下一章），{data.clues.filter(c=>c.status==='closed').length} 条已关闭。点「追踪」可沿线索查看来源、角色变化和最终收束。</div>
        {data.clues.map(c=>{
          const t=traceFor===c.id?R.traceClue(data,c.id):null;
          return<article className={'clue-card '+c.status} key={c.id}>
            <div className="clue-head">
              <span className={'badge '+c.status}>{c.status==='open'?'未解':'已关闭'}</span>
              <h3>{c.title}</h3>
              <div className="clue-actions">
                <button onClick={()=>setTraceFor(traceFor===c.id?null:c.id)}>{t?'收起':'追踪'}</button>
                {c.status==='open'&&<button onClick={()=>{setCloseFor(c.id);setCloseForm({session:lastId,conclusion:''});setModal('close')}}>关闭</button>}
              </div>
            </div>
            <div className="clue-meta">来源 {stitle(c.source)} ・ 经办 {c.owner} ・ 后续出处 {c.followups.length?c.followups.map(stitle).join('、'):'暂无'}</div>
            {c.status==='closed'&&<p className="conclusion">结论：{c.conclusion}<br/>收束于「{stitle(c.closedIn)}」</p>}
            {c.conflicts.length>0&&<p className="conflict">⚠ {c.conflicts.length} 次重复关闭被忽略，保留最早记录（{stitle(c.closedIn)}，原状态：已关闭）</p>}
            {t&&<div className="trace">
              <div><b>来源</b><span>{t.source?.title}（{t.source?.date}）</span></div>
              <div><b>经办角色</b><span>{t.clue.owner}{t.ownerStints.length?`：${t.ownerStints.map((s,i)=>`第${i+1}段 ${s.from?.title||'?'} → ${s.to?s.to.title:'在队'}`).join('；')}`:'（无经历记录）'}</span></div>
              <div><b>后续出处</b><span>{t.followups.length?t.followups.map(f=>f.title).join(' → '):'暂无'}</span></div>
              <div><b>最终收束</b><span>{t.closedIn?`${t.closedIn.title}：${t.clue.conclusion}`:'尚未收束，结算后进入下一章'}</span></div>
            </div>}
          </article>})}
        {data.clues.length===0&&<div className="section-note">还没有线索，点击右上角「＋ 新建线索」登记第一条。</div>}
      </section>}

      {tab==='characters'&&<section className="cards">
        <div className="section-note">队伍中有 {data.characters.length} 位冒险者。离队后的章节不可勾选为参与人；归队会另建一段经历，旧出场记录保留可查。</div>
        {data.characters.map(c=>{
          const on=R.activeIn(c),gigs=data.sessions.filter(s=>(s.participants||[]).includes(c.name));
          return<article className="char-card" key={c.name}>
            <div className="avatar" style={{background:c.color}}>{c.name[0]}</div>
            <div><small>{c.role} · {on?'在队':'已离队'}</small><h3>{c.name}</h3><p>玩家 · {c.player}</p></div>
            <button className="mini" onClick={()=>on?leave(c.name):rejoin(c.name)}>{on?'标记离队':'标记归队'}</button>
            <div className="char-detail">
              {c.stints.map((st,i)=><span key={i}><b>第{i+1}段经历</b>　{stitle(st.from)} → {st.to==null?'至今':stitle(st.to)}</span>)}
              <span><b>出场记录</b>　{gigs.length?gigs.map(g=>g.title).join('、'):'暂无'}</span>
            </div>
          </article>})}
      </section>}

      {tab==='places'&&<section className="empty"><div>⌖</div><h2>地点图鉴</h2><p>从章节笔记中收集地点。当前已记录灰港、雾林和失落钟楼。</p><div className="place-list"><span>01　灰港 <b>已探索</b></span><span>02　失落钟楼 <b>已探索</b></span><span>03　雾林 <b>待探索</b></span></div></section>}
      {tab==='loot'&&<section className="empty"><div>◇</div><h2>战利品清单</h2><p>追踪旅途中获得的装备、遗物和金币。</p><div className="place-list"><span>月光草 × 3 <b>消耗品</b></span><span>古老铜币 × 1 <b>遗物</b></span><span>灰港守卫徽章 × 2 <b>任务物品</b></span></div></section>}
    </main>

    {modal==='chapter'&&<div className="modal-bg"><div className="modal">
      <button className="close" onClick={()=>setModal(null)}>×</button>
      <span className="crumb">NEW CHAPTER</span><h2>记录新的章节</h2>
      <label>章节标题<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="例：第三章：月下集市"/></label>
      <label>游戏日期<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
      <label>章节摘要<textarea rows="3" value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})} placeholder="发生了什么？"/></label>
      <label>章节类型<select value={form.tag} onChange={e=>setForm({...form,tag:e.target.value})}><option>主线</option><option>支线</option><option>番外</option></select></label>
      <button className="primary full" onClick={addChapter}>保存章节</button>
    </div></div>}

    {modal==='clue'&&<div className="modal-bg"><div className="modal">
      <button className="close" onClick={()=>setModal(null)}>×</button>
      <span className="crumb">NEW CLUE</span><h2>登记新线索</h2>
      <label>线索标题<input value={clueForm.title} onChange={e=>setClueForm({...clueForm,title:e.target.value})} placeholder="例：钟楼符文的含义"/></label>
      <label>来源章节<select value={clueForm.source} onChange={e=>setClueForm({...clueForm,source:Number(e.target.value)})}>{data.sessions.map(s=><option value={s.id} key={s.id}>{s.title}</option>)}</select></label>
      <label>经办角色<select value={clueForm.owner} onChange={e=>setClueForm({...clueForm,owner:e.target.value})}>{data.characters.map(c=><option key={c.name}>{c.name}</option>)}</select></label>
      <button className="primary full" onClick={addClue}>保存线索</button>
    </div></div>}

    {modal==='close'&&<div className="modal-bg"><div className="modal">
      <button className="close" onClick={()=>setModal(null)}>×</button>
      <span className="crumb">CLOSE CLUE</span><h2>关闭线索</h2>
      <p className="modal-note">关闭必须填写结论并关联收束章节；同一线索重复关闭只保留最早一次。</p>
      <label>收束章节<select value={closeForm.session} onChange={e=>setCloseForm({...closeForm,session:Number(e.target.value)})}>{data.sessions.map(s=><option value={s.id} key={s.id}>{s.title}</option>)}</select></label>
      <label>结论<textarea rows="3" value={closeForm.conclusion} onChange={e=>setCloseForm({...closeForm,conclusion:e.target.value})} placeholder="这条线索最终如何收束？"/></label>
      <button className="primary full" onClick={doClose}>确认关闭</button>
    </div></div>}

    {notice&&<div className="toast">{notice}</div>}
  </div>
}
createRoot(document.getElementById('root')).render(<App/>);
