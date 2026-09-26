// 数据层：章节顺序。章节数组不保证有序，所有"第几章/上一章/下一章"都在这里计算。
export function sortSessions(sessions) {
  return [...sessions].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1
  );
}

export function sessionIndex(campaign, sessionId) {
  return sortSessions(campaign.sessions).findIndex((s) => s.id === sessionId);
}

export function orderedSessions(campaign) {
  return sortSessions(campaign.sessions);
}

export function chapterNo(campaign, sessionId) {
  return sessionIndex(campaign, sessionId) + 1;
}

export function getSession(campaign, sessionId) {
  return campaign.sessions.find((s) => s.id === sessionId) || null;
}

export function getNextSession(campaign, sessionId) {
  const list = sortSessions(campaign.sessions);
  const i = list.findIndex((s) => s.id === sessionId);
  return i >= 0 && i < list.length - 1 ? list[i + 1] : null;
}
