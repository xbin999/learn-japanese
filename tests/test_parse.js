import { parseText } from '../server/parse.js';

const goldInput = JSON.stringify({
  title: '娘と朝ジョギングした日',
  topic: '日常出来事の自然な描写',
  intent: '今天早上和女儿一起慢跑，聊了一些学校的事情。',
  versions: {
    v1: '今朝は娘とジョギングしました。そして、たくさん話しました。',
    v2: '今朝は娘と一緒にジョギングをして、そのあと色々なことを話しました。',
    v3: '今朝は娘と一緒にジョギングをしながら、学校のことや最近感じていることについてゆっくり話しました。'
  },
  final: '今朝は娘と一緒にジョギングをしながら、学校のことや最近感じていることについてゆっくり話す時間を持てました。とても穏やかな朝でした。',
  coreStructure: '1. 〜しながら（动作并行）\n2. 〜について（话题展开）\n3. 抽象感受表达（穏やかな朝）',
  improvement: '1. 从简单并列句升级为动作并行结构\n2. 从“たくさん話しました”升级为具体话题展开\n3. 加入情绪性总结句，提高自然度',
  errors: [
    {
      name: '动词连接过于简单',
      description: '使用「そして」进行简单并列，表达偏初级',
      correctPattern: '使用「〜しながら」或从属结构增强自然度'
    },
    {
      name: '表达过于抽象',
      description: '使用「たくさん話しました」缺少具体内容',
      correctPattern: '加入具体话题（〜のことや〜について）'
    }
  ],
  vocab: [
    {
      word: '穏やか',
      reading: 'おだやか',
      meaning: '平静的、温和的',
      example: '今日は穏やかな天気ですね。'
    },
    {
      word: '感じる',
      reading: 'かんじる',
      meaning: '感受到',
      example: '最近、時間が早く過ぎると感じます。'
    }
  ],
  summary: '',
  shareTitle: ''
});

const out = parseText(goldInput);

console.log('=== 解析结果 ===');
console.log(JSON.stringify(out, null, 2));

// 断言：顶层字段
console.assert(out.标题 === '娘と朝ジョギングした日', '标题');
console.assert(out.主题 === '日常出来事の自然な描写', '主题');
console.assert(out.进化过程.includes('V1：'), '进化过程含 V1');
console.assert(out.最终定稿.includes('穏やかな朝'), '最终定稿');
console.assert(out.本次核心结构.includes('〜しながら'), '核心结构');
console.assert(out.表达升级点.includes('情绪性总结句'), '升级点');

// 断言：数组长度
console.assert(out.错误记录.length === 2, '错误记录长度');
console.assert(out.生词.length === 2, '生词长度');

// 断言：第一个错误对象字段
const e1 = out.错误记录[0];
console.assert(e1['错误名称'] === '动词连接过于简单', '错误名称');
console.assert(e1['典型错误说明'].includes('そして'), '典型错误说明');
console.assert(e1['正确表达模式'].includes('〜しながら'), '正确表达模式');

// 断言：第一个单词对象字段
const w1 = out.生词[0];
console.assert(w1['词汇'] === '穏やか', '词汇');
console.assert(w1['读音'] === 'おだやか', '读音');
console.assert(w1['中文解释'] === '平静的、温和的', '中文解释');
console.assert(w1['例句'] === '今日は穏やかな天気ですね。', '例句');

const simpleInput = JSON.stringify({
  title: '2026-03-13 生活习惯｜跑步时听音乐',
  topic: '生活习惯描述',
  intent: '我经常一边慢跑一边听音乐。',
  versions: {
    v1: '僕は走るなから、音楽を聞く。',
    v2: '走りながら音楽を聞く。',
    v3: 'ジョギングしながら音楽を聞きます。',
    v4: 'ジョギングしながらよく音楽を聞きます。'
  },
  final: 'ジョギングしながらよく音楽を聞きます。',
  coreStructure: '1. AしながらB\n表示「一边做A，一边做B」',
  improvement: '1. 用「ジョギングする」代替「走る」，更符合日常运动语境。',
  errors: [
    {
      name: '走るなから',
      description: '「ながら」需要接在 动词ます形去ます 后面。',
      correctPattern: '走りながら'
    }
  ],
  vocab: [
    {
      word: 'ジョギング',
      reading: 'jogging',
      meaning: '慢跑',
      example: ''
    },
    {
      word: 'よく',
      reading: '',
      meaning: '经常、常常',
      example: ''
    }
  ],
  summary: '表达「一边做A一边做B」时使用：动词ます形去ます + ながら',
  shareTitle: '日语真实表达｜「ながら」结构：一边慢跑一边听音乐'
});

const out2 = parseText(simpleInput);
console.assert(out2.错误记录.length === 1, '简化错误记录长度');
console.assert(out2.错误记录[0]['错误名称'] === '走るなから', '简化错误名称');
console.assert(out2.错误记录[0]['正确表达模式'] === '走りながら', '简化正确表达');
console.assert(out2.错误记录[0]['典型错误说明'].includes('动词ます形去ます'), '简化错误原因');
console.assert(out2.生词.length === 2, '简化生词长度');
console.assert(out2.生词[0]['词汇'] === 'ジョギング', '简化词汇1');
console.assert(out2.生词[0]['读音'] === 'jogging', '简化读音1');
console.assert(out2.生词[0]['中文解释'] === '慢跑', '简化中文解释1');
console.assert(out2.生词[1]['词汇'] === 'よく', '简化词汇2');
console.assert(out2.生词[1]['中文解释'] === '经常、常常', '简化中文解释2');

console.log('✅ 全部断言通过！');
