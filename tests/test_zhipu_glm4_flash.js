const { testCases } = require('./ai_test_cases.js');

const apiKey = process.env.ZHIPU_API_KEY;
if (!apiKey) {
  console.error('Missing ZHIPU_API_KEY');
  process.exit(1);
}

const endpoint = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

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

const requestZhipu = async (prompt) => {
  const requestBody = {
    model: 'glm-4-flash-250414',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.2
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Zhipu API ${response.status}: ${text}`);
  }

  const data = await response.json();
  const outputText = data?.choices?.[0]?.message?.content;
  ensure(outputText, 'Missing output text');
  return outputText;
};

const parseOutput = (outputText) => {
  const cleanedText = outputText
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

const assertString = (value, label) => {
  ensure(typeof value === 'string', `${label} should be string`);
};

const assertNonEmpty = (value, label) => {
  ensure(String(value).trim().length > 0, `${label} should be non-empty`);
};

const validateOutput = (outputJson) => {
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

  assertString(outputJson.title, 'title');
  assertString(outputJson.topic, 'topic');
  assertString(outputJson.intent, 'intent');
  assertString(outputJson.final, 'final');
  assertString(outputJson.coreStructure, 'coreStructure');
  assertString(outputJson.improvement, 'improvement');
  assertString(outputJson.summary, 'summary');
  assertString(outputJson.shareTitle, 'shareTitle');

  assertNonEmpty(outputJson.title, 'title');
  assertNonEmpty(outputJson.topic, 'topic');
  assertNonEmpty(outputJson.intent, 'intent');
  assertNonEmpty(outputJson.final, 'final');
  assertNonEmpty(outputJson.coreStructure, 'coreStructure');
  assertNonEmpty(outputJson.improvement, 'improvement');
  assertNonEmpty(outputJson.summary, 'summary');
  assertNonEmpty(outputJson.shareTitle, 'shareTitle');

  ['v1', 'v2', 'v3', 'v4'].forEach((key) => {
    ensure(key in outputJson.versions, `Missing versions.${key}`);
    assertString(outputJson.versions[key], `versions.${key}`);
    assertNonEmpty(outputJson.versions[key], `versions.${key}`);
  });

  ensure(outputJson.errors.length > 0, 'errors should not be empty');
  ensure(outputJson.vocab.length > 0, 'vocab should not be empty');

  outputJson.errors.forEach((item, index) => {
    ensure('name' in item, `errors[${index}].name missing`);
    ensure('description' in item, `errors[${index}].description missing`);
    ensure('correctPattern' in item, `errors[${index}].correctPattern missing`);
    assertString(item.name, `errors[${index}].name`);
    assertString(item.description, `errors[${index}].description`);
    assertString(item.correctPattern, `errors[${index}].correctPattern`);
  });

  outputJson.vocab.forEach((item, index) => {
    ensure('word' in item, `vocab[${index}].word missing`);
    ensure('reading' in item, `vocab[${index}].reading missing`);
    ensure('meaning' in item, `vocab[${index}].meaning missing`);
    ensure('example' in item, `vocab[${index}].example missing`);
    assertString(item.word, `vocab[${index}].word`);
    assertString(item.reading, `vocab[${index}].reading`);
    assertString(item.meaning, `vocab[${index}].meaning`);
    assertString(item.example, `vocab[${index}].example`);
  });
};

const main = async () => {
  for (const testCase of testCases) {
    const prompt = buildInstruction(testCase.text);
    const outputText = await requestZhipu(prompt);
    const outputJson = parseOutput(outputText);
    validateOutput(outputJson);
    console.log(`✅ ${testCase.name} JSON 输出验证通过`);
  }
};

main().catch((error) => {
  console.error('❌ 智谱 API 测试失败');
  console.error(error.message);
  process.exit(1);
});
