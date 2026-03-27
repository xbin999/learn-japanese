const { testCases } = require('./ai_test_cases.js');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing GEMINI_API_KEY');
  process.exit(1);
}


const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

const ensure = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const buildInstruction = (rawText) => `请把下面“结构化文本”转换成 JSON，要求：
1) 必须是合法 JSON，且只输出 JSON
2) 字段结构与下面 schema 完全一致
3) 标题： -> title，主题： -> topic
4) ——我想表达—— -> intent
5) ——进化过程—— -> versions.v1-v4
6) ——最终定稿—— -> final
7) ——本次核心结构—— -> coreStructure
8) ——表达升级点—— -> improvement
9) ——错误记录—— -> errors
10) ——生词—— -> vocab
11) ——学习总结—— -> summary
12) ——分享标题—— -> shareTitle

schema:
{
  "title": "",
  "topic": "",
  "intent": "",
  "versions": { "v1": "", "v2": "", "v3": "", "v4": "" },
  "final": "",
  "coreStructure": "",
  "improvement": "",
  "errors": [{ "name": "", "description": "", "correctPattern": "" }],
  "vocab": [{ "word": "", "reading": "", "meaning": "", "example": "" }],
  "summary": "",
  "shareTitle": ""
}

结构化文本：
${rawText}`;

const parseOutput = (outputText) => {
  const cleanedText = String(outputText || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch (error) {
    throw new Error(`Invalid JSON output: ${outputText}`);
  }
};

const main = async () => {
  for (const testCase of testCases) {
    const prompt = buildInstruction(testCase.text);
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini API ${response.status}: ${text}`);
    }

    const data = await response.json();
    const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    ensure(outputText, 'Missing output text');

    const outputJson = parseOutput(outputText);
    const requiredKeys = [
      'title',
      'topic',
      'intent',
      'versions',
      'final',
      'coreStructure',
      'improvement',
      'errors',
      'vocab',
      'summary',
      'shareTitle'
    ];

    requiredKeys.forEach((key) => ensure(key in outputJson, `Missing key: ${key}`));
    ensure(typeof outputJson.versions === 'object', 'versions should be object');
    ensure(Array.isArray(outputJson.errors), 'errors should be array');
    ensure(Array.isArray(outputJson.vocab), 'vocab should be array');

    console.log(`✅ ${testCase.name} Gemini JSON 输出验证通过`);
  }
};

main().catch((error) => {
  console.error('❌ Gemini API 测试失败');
  console.error(error.message);
  process.exit(1);
});
