// 状态层：把规则层的纯函数接到 React，界面只调用这里的动作，不直接改数据。
import { useCallback, useEffect, useState } from 'react';
import { loadCampaign, saveCampaign, loadArchives, saveArchives } from '../data/storage.js';
import { createEmptyCampaign } from '../data/factory.js';
import { uid } from '../data/uid.js';
import { orderedSessions, getSession, chapterNo } from '../data/order.js';
import { isOnRoster } from '../rules/participation.js';
import { leaveParty, rejoinParty } from '../rules/tenure.js';
import {
  createClue as ruleCreateClue,
  addFollowUp as ruleAddFollowUp,
  closeClue as ruleCloseClue
} from '../rules/clues.js';
import { settleChapter, reopenChapter } from '../rules/settlement.js';
import { archiveCampaign } from '../rules/archive.js';

export function useCampaignStore() {
  const [campaign, setCampaign] = useState(loadCampaign);
  const [archives, setArchives] = useState(loadArchives);

  useEffect(() => saveCampaign(campaign), [campaign]);
  useEffect(() => saveArchives(archives), [archives]);

  const addSession = useCallback(
    (form) => {
      const id = uid('s');
      const session = {
        id,
        date: form.date,
        title: form.title,
        summary: form.summary || '',
        tag: form.tag || '主线',
        color: form.color || '#d8a153',
        // 新章节默认勾选当前仍在队（最后一段任期未结束）的角色。
        participants: campaign.characters
          .filter((c) => c.active !== false)
          .map((c) => c.id),
        settled: false
      };
      setCampaign({ ...campaign, sessions: [...campaign.sessions, session] });
      return id;
    },
    [campaign]
  );

  const updateSession = useCallback(
    (id, patch) => {
      setCampaign({
        ...campaign,
        sessions: campaign.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s))
      });
    },
    [campaign]
  );

  // 离队后的章节不能勾选；返回 false 时界面给出原因提示。
  const toggleParticipant = useCallback(
    (sessionId, charId) => {
      const ch = campaign.characters.find((c) => c.id === charId);
      if (!ch || !isOnRoster(campaign, ch, sessionId)) return false;
      setCampaign({
        ...campaign,
        sessions: campaign.sessions.map((s) => {
          if (s.id !== sessionId) return s;
          const has = (s.participants || []).includes(charId);
          return {
            ...s,
            participants: has
              ? s.participants.filter((x) => x !== charId)
              : [...(s.participants || []), charId]
          };
        })
      });
      return true;
    },
    [campaign]
  );

  const settle = useCallback(
    (sessionId) => setCampaign(settleChapter(campaign, sessionId)),
    [campaign]
  );
  const reopen = useCallback(
    (sessionId) => setCampaign(reopenChapter(campaign, sessionId)),
    [campaign]
  );

  const addCharacter = useCallback(
    ({ name, role, player, color, fromSessionId }) => {
      const id = uid('c');
      const list = orderedSessions(campaign);
      const from = fromSessionId || (list.length ? list.at(-1).id : null);
      const ch = {
        id,
        name: name.trim(),
        role: role || '',
        player: player || '',
        color: color || '#93b7a6',
        active: true,
        tenures: [{ id: uid('t'), from, to: null, note: '入团' }]
      };
      setCampaign({ ...campaign, characters: [...campaign.characters, ch] });
      return id;
    },
    [campaign]
  );

  // 离队：结束当前任期；离队章之后的勾选记录按规则兜底清理。
  const setLeave = useCallback(
    (charId, sessionId, note) => {
      const ch = campaign.characters.find((c) => c.id === charId);
      if (!ch) return;
      const left = leaveParty(ch, sessionId, note);
      const leaveNo = chapterNo(campaign, sessionId);
      setCampaign({
        ...campaign,
        characters: campaign.characters.map((c) => (c.id === charId ? left : c)),
        sessions: campaign.sessions.map((s) =>
          chapterNo(campaign, s.id) > leaveNo
            ? { ...s, participants: (s.participants || []).filter((x) => x !== charId) }
            : s
        )
      });
    },
    [campaign]
  );

  // 归队：旧任期原样保留，另起一段新经历。
  const setRejoin = useCallback(
    (charId, sessionId, note) => {
      setCampaign({
        ...campaign,
        characters: campaign.characters.map((c) =>
          c.id === charId ? rejoinParty(c, sessionId, note) : c
        )
      });
    },
    [campaign]
  );

  const addClue = useCallback(
    (input) => setCampaign(ruleCreateClue(campaign, input)),
    [campaign]
  );

  const addFollowUp = useCallback(
    (input) => setCampaign(ruleAddFollowUp(campaign, input)),
    [campaign]
  );

  // 关闭线索；重复关闭时返回冲突信息（线索/章节/原状态），数据不改。
  const closeClue = useCallback(
    (clueId, input) => {
      const result = ruleCloseClue(campaign, clueId, input);
      setCampaign(result.campaign);
      return result.conflict;
    },
    [campaign]
  );

  // 重开战役：当前战役完整归档（沿线索可溯源），再换一份空白战役。
  const restartCampaign = useCallback(
    ({ name, system, note }) => {
      const archived = archiveCampaign(campaign, note);
      setArchives((list) => [archived, ...list]);
      setCampaign(
        createEmptyCampaign({ name: name || '新的战役', system: system || campaign.system })
      );
    },
    [campaign]
  );

  const resetToSeed = useCallback(() => {
    localStorage.removeItem('campaign-log');
    setCampaign(loadCampaign());
  }, []);

  return {
    campaign,
    archives,
    getSession: (id) => getSession(campaign, id),
    addSession,
    updateSession,
    toggleParticipant,
    settle,
    reopen,
    addCharacter,
    setLeave,
    setRejoin,
    addClue,
    addFollowUp,
    closeClue,
    restartCampaign,
    resetToSeed
  };
}
