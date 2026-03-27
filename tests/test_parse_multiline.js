
import { parseText } from '../server/parse.js';

const raw = JSON.stringify({
  title: '',
  topic: '',
  intent: '',
  versions: {},
  final: '',
  coreStructure: '',
  improvement: '',
  errors: [
    {
      name: 'いろいろ＋名词误用',
      description: '「いろいろ」修饰名词时通常使用「いろいろな」，而不是「いろいろの」。\n第二行补充说明。',
      correctPattern: 'いろいろな＋名词'
    },
    {
      name: '原因表达不完整',
      description: '只用「〜ましたから」有时像句子未完结，改为「〜て、それで〜」可以更自然表达因果。',
      correctPattern: 'Aて、それでB'
    }
  ],
  vocab: [],
  summary: '',
  shareTitle: ''
});

const data = parseText(raw);
console.log(JSON.stringify(data.错误记录, null, 2));
