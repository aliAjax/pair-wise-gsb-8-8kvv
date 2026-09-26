// 通过 Vite SSR 管线加载 JSX，实际渲染各界面组件。
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const mem = {};
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; }
};

const server = await createServer({
  server: { middlewareMode: true },
  logLevel: 'silent',
  configFile: '/workspace/vite.config.js'
});
try {
  const mods = await Promise.all([
    server.ssrLoadModule('/src/ui/App.jsx'),
    server.ssrLoadModule('/src/ui/Timeline.jsx'),
    server.ssrLoadModule('/src/ui/CluesBoard.jsx'),
    server.ssrLoadModule('/src/ui/Roster.jsx'),
    server.ssrLoadModule('/src/ui/Archives.jsx'),
    server.ssrLoadModule('/src/data/seed.js')
  ]);
  const [appMod, tlMod, boardMod, rosterMod, arcMod, seedMod] = mods;
  const { seed } = seedMod;
  const { orderedSessions } = await server.ssrLoadModule('/src/data/order.js');
  const { useCampaignStore } = await server.ssrLoadModule('/src/state/store.js');

  const noop = () => {};
  const store = {
    ...Object.fromEntries(Object.keys(useCampaignStore || {}).map((k) => [k, noop])),
    toggleParticipant: noop, addSession: noop, updateSession: noop,
    settle: noop, reopen: noop, addCharacter: noop, setLeave: noop,
    setRejoin: noop, addClue: noop, addFollowUp: noop, closeClue: noop,
    restartCampaign: noop
  };

  // 时间线停在第三章：莫尔应置灰为离队中
  const s3 = orderedSessions(seed)[2].id;
  const tlHtml = renderToStaticMarkup(
    React.createElement(tlMod.Timeline, {
      campaign: seed, store, active: s3, setActive: noop, setTab: noop, notice: noop
    })
  );
  for (const c of ['本章参与人', '莫尔', '离队中', '滚入本章的未解线索', '钟楼符文', '章节结算']) {
    if (!tlHtml.includes(c)) { console.error('TIMELINE MISSING:', c); process.exit(1); }
  }

  // 线索板
  const boardHtml = renderToStaticMarkup(
    React.createElement(boardMod.CluesBoard, {
      campaign: seed, store, setActiveSession: noop, notice: noop
    })
  );
  for (const c of ['钟楼符文', '来源', '经办', '后续出处', '雾中脚印', '收束']) {
    if (!boardHtml.includes(c)) { console.error('BOARD MISSING:', c); process.exit(1); }
  }

  // 角色页
  const rosterHtml = renderToStaticMarkup(
    React.createElement(rosterMod.Roster, {
      campaign: seed, store, setActiveSession: noop, notice: noop
    })
  );
  for (const c of ['艾德里安', '瑟琳', '离队', '归队']) {
    if (!rosterHtml.includes(c)) { console.error('ROSTER MISSING:', c); process.exit(1); }
  }

  // 归档页（带一个归档）
  const { archiveCampaign } = await server.ssrLoadModule('/src/rules/archive.js');
  const arcHtml = renderToStaticMarkup(
    React.createElement(arcMod.Archives, {
      campaign: seed, archives: [archiveCampaign(seed, '测试')], store, notice: noop
    })
  );
  for (const c of ['重开战役', '沿线索复盘', '暮光边境']) {
    if (!arcHtml.includes(c)) { console.error('ARCHIVE MISSING:', c); process.exit(1); }
  }

  // App 外壳
  const appHtml = renderToStaticMarkup(React.createElement(appMod.default));
  for (const c of ['CAMPAIGNER', '线索追踪板', '暮光边境']) {
    if (!appHtml.includes(c)) { console.error('APP MISSING:', c); process.exit(1); }
  }

  console.log('SSR 四个界面全部渲染成功');
} finally {
  await server.close();
}
process.exit(0);
