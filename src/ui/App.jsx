// 界面层：应用外壳。数据 / 规则 / 界面分层，本文件只做装配。
import React, { useState } from 'react';
import { useCampaignStore } from '../state/store.js';
import { orderedSessions } from '../data/order.js';
import { Timeline } from './Timeline.jsx';
import { CluesBoard } from './CluesBoard.jsx';
import { Roster } from './Roster.jsx';
import { Archives } from './Archives.jsx';

const NAV = [
  ['timeline', '◌', '时间线'],
  ['clues', '⌕', '线索追踪板'],
  ['characters', '♙', '角色与阵营'],
  ['archives', '▣', '归档与重开']
];

export default function App() {
  const store = useCampaignStore();
  const { campaign, archives } = store;
  const [tab, setTab] = useState('timeline');
  const [active, setActive] = useState(
    orderedSessions(campaign)[0]?.id || null
  );
  const [notice, setNotice] = useState('');

  const flash = (msg) => {
    setNotice(msg);
    window.clearTimeout(flash._t);
    flash._t = window.setTimeout(() => setNotice(''), 2600);
  };

  const jumpSession = (id) => {
    setActive(id);
    setTab('timeline');
  };

  const exportData = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(campaign, null, 2)], { type: 'application/json' })
    );
    a.download = `${campaign.name || 'campaign'}.json`;
    a.click();
    flash('战役记录已导出');
  };

  const openClues = campaign.clues.filter((c) => c.status === 'open').length;

  return (
    <div className="shell">
      <aside>
        <div className="logo">
          <span>✦</span> CAMPAIGNER
        </div>
        <div className="campaign">
          <small>当前战役</small>
          <strong>{campaign.name}</strong>
          <span>
            {campaign.system || '未设置系统'} · {campaign.sessions.length} 章
          </span>
        </div>
        <nav>
          {NAV.map(([id, icon, t]) => (
            <button className={tab === id ? 'active' : ''} key={id} onClick={() => setTab(id)}>
              <i>{icon}</i>
              {t}
              {id === 'clues' && openClues > 0 && <em className="nav-badge">{openClues}</em>}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <button onClick={exportData}>↓ 导出数据</button>
          <small>本地存储已开启 · 数据/规则/界面分层</small>
        </div>
      </aside>

      <main>
        <header>
          <div>
            <span className="crumb">
              MY CAMPAIGN / {campaign.system || '—'}
            </span>
            <h1>
              {tab === 'timeline'
                ? '战役时间线'
                : tab === 'clues'
                ? '线索追踪板'
                : tab === 'characters'
                ? '角色与阵营'
                : '归档与重开'}
            </h1>
          </div>
          <div className="actions">
            {tab === 'timeline' && (
              <button className="primary" onClick={() => setTab('clues')}>
                查看线索板
              </button>
            )}
          </div>
        </header>

        {tab === 'timeline' && (
          <Timeline
            campaign={campaign}
            store={store}
            active={active}
            setActive={setActive}
            setTab={setTab}
            notice={flash}
          />
        )}
        {tab === 'clues' && (
          <CluesBoard
            campaign={campaign}
            store={store}
            setActiveSession={jumpSession}
            notice={flash}
          />
        )}
        {tab === 'characters' && (
          <Roster
            campaign={campaign}
            store={store}
            setActiveSession={jumpSession}
            notice={flash}
          />
        )}
        {tab === 'archives' && (
          <Archives campaign={campaign} archives={archives} store={store} notice={flash} />
        )}
      </main>

      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}
