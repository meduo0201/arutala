import type { CyclePhase } from '@/features/insights/api';

export interface ZhInsight {
  title: string;
  body: string;
  category: string;
  emoji: string;
}

const INSIGHTS: Record<CyclePhase, readonly ZhInsight[]> = {
  period: [
    {
      title: '给身体一点空间',
      body: '经期前几天子宫内膜脱落，腰腹酸胀很常见。热敷、放慢节奏，比硬撑更有效。',
      category: '建议',
      emoji: '🌸',
    },
    {
      title: '补水和铁',
      body: '经血会带走水分和铁。今天多喝温水，餐里加点深色蔬菜或红肉，会舒服一些。',
      category: '生活',
      emoji: '🫖',
    },
    {
      title: '疼痛可以记录',
      body: '把痛经程度记下来，过几个周期就能看出规律，也方便和医生沟通。',
      category: '提示',
      emoji: '📝',
    },
  ],
  follicular: [
    {
      title: '能量慢慢回来',
      body: '卵泡期雌激素上升，很多人会觉得头脑更清楚、更想活动。适合安排需要专注的事。',
      category: '知识',
      emoji: '🌱',
    },
    {
      title: '温和运动刚刚好',
      body: '散步、拉伸或轻松力量训练，比高强度冲刺更贴合这个阶段。',
      category: '生活',
      emoji: '🚶',
    },
  ],
  fertile: [
    {
      title: '易孕窗口',
      body: '排卵前约 5 天到排卵当天受孕几率更高。无论是备孕还是避孕，都可以多留意。',
      category: '知识',
      emoji: '🌿',
    },
    {
      title: '分泌物可能变化',
      body: '这个阶段白带常会更清、更有弹性。这是正常的激素变化，不是感染信号。',
      category: '提示',
      emoji: '💧',
    },
  ],
  ovulation: [
    {
      title: '排卵日前后',
      body: '有人会感到单侧腹隐痛或轻微胀感，通常很快过去。持续剧痛请及时就医。',
      category: '知识',
      emoji: '🌕',
    },
    {
      title: '和伴侣沟通',
      body: '如果你在和伴侣共享记录，今天是个好时机同步感受和计划。',
      category: '伴侣',
      emoji: '💬',
    },
  ],
  luteal: [
    {
      title: '黄体期更需要休息',
      body: '孕激素升高后，情绪和睡眠更容易波动。减少咖啡因、早点睡觉会有帮助。',
      category: '建议',
      emoji: '🌙',
    },
    {
      title: '想吃甜食很正常',
      body: '经前食欲变化很常见。与其苛责自己，不如准备一些更稳的加餐。',
      category: '生活',
      emoji: '🍫',
    },
    {
      title: '记录比忍耐更有用',
      body: '乳房胀痛、烦躁或腹胀都可以记下来。几个周期后，你会更清楚自己的节奏。',
      category: '提示',
      emoji: '📒',
    },
  ],
  any: [
    {
      title: '规律来自记录',
      body: '哪怕只记下开始和结束日期，两个周期后就能看到预测。',
      category: '提示',
      emoji: '✨',
    },
    {
      title: '这是你的数据',
      body: '健康信息只存在你的账号里。不想分享时，可以继续独自使用。',
      category: '支持',
      emoji: '🔒',
    },
  ],
};

const hashDay = (dateIso: string, phase: string): number => {
  let n = 0;
  const seed = `${dateIso}:${phase}`;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return n;
};

/** Deterministic Chinese tip for (date, phase). Does not depend on DB copy. */
export const pickZhInsight = (phase: CyclePhase, dateIso: string): ZhInsight => {
  const pool = INSIGHTS[phase] ?? INSIGHTS.any;
  return pool[hashDay(dateIso, phase) % pool.length] ?? INSIGHTS.any[0]!;
};
