// 规则层：章节结算。
// 结算只写状态，不限制以后编辑；重开（取消结算）即可继续勾选/修改。
import { getNextSession } from '../data/order.js';
import { settlementReport } from './clues.js';

export function settleChapter(campaign, sessionId) {
  return {
    ...campaign,
    sessions: campaign.sessions.map((s) =>
      s.id === sessionId ? { ...s, settled: true } : s
    )
  };
}

export function reopenChapter(campaign, sessionId) {
  return {
    ...campaign,
    sessions: campaign.sessions.map((s) =>
      s.id === sessionId ? { ...s, settled: false } : s
    )
  };
}

// 结算确认页需要展示的内容：本章新线索、本章收束、滚入下一章的未解线索。
export function buildSettlement(campaign, sessionId) {
  const report = settlementReport(campaign, sessionId);
  return {
    nextSession: report.nextSession,
    openCount: report.openClues.length,
    openClues: report.openClues,
    closedHere: report.closedHere
  };
}
