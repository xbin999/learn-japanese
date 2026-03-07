
import { parseText } from './parse.js';

const raw = `
——错误记录—— 
 [错误1] 
 错误名称：いろいろ＋名词误用 
 典型错误说明：「いろいろ」修饰名词时通常使用「いろいろな」，而不是「いろいろの」。 
 正确表达模式： 
 いろいろな＋名词 
 
 [错误2] 
 错误名称：原因表达不完整 
 典型错误说明：只用「〜ましたから」有时像句子未完结，改为「〜て、それで〜」可以更自然表达因果。 
 正确表达模式： 
 Aて、それでB 
`;

const data = parseText(raw);
console.log(JSON.stringify(data.错误记录, null, 2));
