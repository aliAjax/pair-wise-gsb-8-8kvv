// 数据层：初始种子数据。沿用旧版"暮光边境"，并示范线索、离队、结算等结构。
export const seed = {
  version: 2,
  name: '暮光边境',
  system: 'D&D 5E',
  sessions: [
    {
      id: 's_ch1',
      date: '2024-06-08',
      title: '第一章：灰港的钟声',
      summary: '队伍抵达灰港，在失落的钟楼发现了神秘符文。',
      tag: '主线',
      color: '#d8a153',
      participants: ['c_adrian', 'c_serin', 'c_morr'],
      settled: true
    },
    {
      id: 's_ch2',
      date: '2024-06-15',
      title: '第二章：雾中来客',
      summary: '与流浪法师伊琳结盟，追踪海雾中的脚印。',
      tag: '主线',
      color: '#93b7a6',
      participants: ['c_adrian', 'c_serin', 'c_morr'],
      settled: true
    },
    {
      id: 's_ch3',
      date: '2024-06-22',
      title: '支线：深林采药',
      summary: '帮助村民寻找月光草，获得一枚古老铜币。',
      tag: '支线',
      color: '#b9a6d1',
      participants: ['c_adrian', 'c_serin'],
      settled: false
    }
  ],
  characters: [
    {
      id: 'c_adrian',
      name: '艾德里安',
      role: '圣骑士',
      player: '林默',
      color: '#d8a153',
      active: true,
      tenures: [{ id: 't_adrian_1', from: 's_ch1', to: null, note: '初始成员' }]
    },
    {
      id: 'c_serin',
      name: '瑟琳',
      role: '游侠',
      player: '安然',
      color: '#93b7a6',
      active: true,
      tenures: [{ id: 't_serin_1', from: 's_ch1', to: null, note: '初始成员' }]
    },
    {
      id: 'c_morr',
      name: '莫尔',
      role: '术士',
      player: '周岳',
      color: '#b9a6d1',
      active: false,
      tenures: [
        { id: 't_morr_1', from: 's_ch1', to: 's_ch2', note: '雾散后收到术士塔传唤，暂别队伍' }
      ]
    }
  ],
  clues: [
    {
      id: 'cl_rune',
      title: '钟楼符文',
      detail: '失落钟楼墙面上的符文会随潮汐发亮，与古铜币上的纹样一致。',
      originSessionId: 's_ch1',
      ownerCharId: 'c_adrian',
      status: 'open', // open 未解 / closed 已收束
      closeSessionId: null,
      conclusion: '',
      createdOrder: 1,
      closedOrder: null
    },
    {
      id: 'cl_coin',
      title: '古老铜币',
      detail: '深林采药时得到的铜币，正面刻着与钟楼符文相同的记号。',
      originSessionId: 's_ch3',
      ownerCharId: 'c_serin',
      status: 'open',
      closeSessionId: null,
      conclusion: '',
      createdOrder: 3,
      closedOrder: null
    },
    {
      id: 'cl_footprints',
      title: '雾中脚印',
      detail: '海雾边缘的脚印每隔一段就凭空消失，末端留有海盐与硫磺的气味。',
      originSessionId: 's_ch2',
      ownerCharId: 'c_morr',
      status: 'closed',
      closeSessionId: 's_ch3',
      conclusion: '脚印是雾灵兽往返留下的；采药途中已将其安抚，不再出现。',
      createdOrder: 2,
      closedOrder: 1
    }
  ],
  // 后续出处：某条线索在之后章节里的新进展（一次进展可以新增一条待办）。
  followUps: [
    {
      id: 'f_1',
      clueId: 'cl_rune',
      sessionId: 's_ch2',
      note: '伊琳认出符文属于潮语者，建议去月下集市找解读人。'
    },
    {
      id: 'f_2',
      clueId: 'cl_coin',
      sessionId: 's_ch3',
      note: '村民说铜币来自雾林深处的废弃神龛。'
    }
  ],
  // 关闭冲突记录：同一线索被重复关闭时，只保留最早一次，其余记在这里。
  closeConflicts: []
};
