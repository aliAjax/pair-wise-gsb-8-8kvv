// 规则层自检（不引入测试框架，node 直接跑）：node test/rules.test.js
import assert from 'node:assert';
import { seed } from '../src/data/seed.js';
import { orderedSessions, chapterNo } from '../src/data/order.js';
import { isOnRoster, canParticipate } from '../src/rules/participation.js';
import { leaveParty, rejoinParty } from '../src/rules/tenure.js';
import {
  createClue,
  addFollowUp,
  closeClue,
  carriedInto,
  settlementReport
} from '../src/rules/clues.js';
import { settleChapter } from '../src/rules/settlement.js';
import { archiveCampaign, rosterTimeline, conflictList } from '../src/rules/archive.js';

let cp = structuredClone(seed);
const [s1, s2, s3] = orderedSessions(cp);
const morr = cp.characters.find((c) => c.name === '莫尔');

// 1. 莫尔在种子数据里已于 s2 离队：s1/s2 可出场，s3 不可。
assert.equal(canParticipate(cp, morr.id, s1.id), true);
assert.equal(canParticipate(cp, morr.id, s2.id), true, '离队当章仍可出场');
assert.equal(canParticipate(cp, morr.id, s3.id), false, '离队后章节不可勾选');

// 2. 归队（假设以后有 s4）：另建任期，旧任期保留可查。
const s4 = { id: 's_ch4', date: '2024-06-29', title: '第四章', tag: '主线', participants: [], settled: false };
cp = { ...cp, sessions: [...cp.sessions, s4] };
const morrBack = rejoinParty(morr, s4.id, '术士塔事务结束');
cp = { ...cp, characters: cp.characters.map((c) => (c.id === morr.id ? morrBack : c)) };
assert.equal(morrBack.tenures.length, 2, '归队产生第二段任期');
assert.equal(canParticipate(cp, morr.id, s3.id), false, '离队区间仍不可选');
assert.equal(canParticipate(cp, morr.id, s4.id), true, '归队章可选');

// 3. 新线索登记在 s3，结算 s2 后它应滚入 s3、s4。
let r = createClue(cp, {
  title: '神龛位置',
  detail: '铜币指向雾林深处的废弃神龛。',
  originSessionId: s3.id,
  ownerCharId: 'c_serin'
});
cp = r;
const newClue = cp.clues.find((c) => c.title === '神龛位置');
assert.deepEqual(carriedInto(cp, s4.id).map((c) => c.id), [
  'cl_rune',
  'cl_coin',
  newClue.id
], '所有来源更早的未解线索都滚入下一章（按登记次序）');
assert.deepEqual(carriedInto(cp, s3.id).map((c) => c.id), ['cl_rune']);

// 4. 后续出处
cp = addFollowUp(cp, { clueId: newClue.id, sessionId: s4.id, note: '神龛大门需符文与铜币同时开启。' });

// 5. 收束要关联章节与结论
let res = closeClue(cp, newClue.id, { closeSessionId: s4.id, conclusion: '神龛开启，潮语者遗物现世。' });
assert.equal(res.conflict, null);
cp = res.campaign;
const closed = cp.clues.find((c) => c.id === newClue.id);
assert.equal(closed.status, 'closed');
assert.equal(closed.closeSessionId, 's_ch4');
assert.ok(closed.conclusion);

// 6. 重复关闭：只保留最早一次，冲突记录线索/章节/原状态
res = closeClue(cp, newClue.id, { closeSessionId: s3.id, conclusion: '另一个错误结论。' });
assert.ok(res.conflict, '重复关闭必须产生冲突');
assert.equal(res.conflict.clueId, newClue.id);
assert.equal(res.conflict.attemptedSessionId, s3.id);
assert.equal(res.conflict.originalStatus, 'closed');
assert.equal(res.conflict.originalCloseSessionId, s4.id);
cp = res.campaign;
assert.equal(cp.clues.find((c) => c.id === newClue.id).conclusion, '神龛开启，潮语者遗物现世。', '最早结论不被覆盖');
assert.equal(cp.closeConflicts.length, 1);

// 7. 章节结算报告：s1 结算后，符文滚入后续；已收束线索不在 open
cp = settleChapter(cp, s1.id);
const rep = settlementReport(cp, s3.id);
assert.ok(rep.openClues.some((c) => c.id === 'cl_rune'));
assert.ok(rep.openClues.some((c) => c.id === 'cl_coin'));
assert.ok(!rep.openClues.some((c) => c.id === newClue.id), '已收束不滚入');

// 8. 归档沿线索可看 来源→后续→收束，角色任期与冲突都在
const arc = archiveCampaign(cp, '复盘测试');
const trail = arc.clueTrails.find((t) => t.id === newClue.id);
assert.equal(trail.originTitle, s3.title);
assert.equal(trail.ownerName, '瑟琳');
assert.equal(trail.followUps.length, 1);
assert.equal(trail.closeTitle, s4.title);
const tl = rosterTimeline(cp).find((t) => t.id === morr.id);
assert.equal(tl.tenures.length, 2);
assert.equal(tl.active, true);
const cf = conflictList(cp);
assert.equal(cf.length, 1);
assert.equal(cf[0].attemptedTitle, s3.title);
assert.equal(cf[0].originalCloseTitle, s4.title);
// 快照深拷贝：改新战役不影响归档
arc.snapshot.name = 'MUTATED';
assert.notEqual(cp.name, 'MUTATED');

// 9. 离队动作结束当前任期但旧出场仍查得到
const adrian = cp.characters.find((c) => c.name === '艾德里安');
const left = leaveParty(adrian, s3.id, '圣骑士团召回');
assert.equal(left.active, false);
assert.equal(left.tenures[0].to, s3.id);
assert.equal(left.tenures[0].note, '圣骑士团召回');
assert.equal(isOnRoster({ ...cp, characters: cp.characters.map((c)=>c.id===left.id?left:c) }, left, s3.id), true);

console.log('全部规则断言通过 ✓');
