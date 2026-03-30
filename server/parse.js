export function parseText(raw) {
  const input = typeof raw === 'string' ? raw.trim() : raw;
  if (!input) {
    throw new Error('请输入 JSON');
  }
  let parsed = input;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch (err) {
      throw new Error('JSON 解析失败，请检查格式');
    }
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('JSON 解析失败，请检查格式');
  }

  const toText = (value) => {
    if (Array.isArray(value)) {
      return value.map(v => String(v)).join('\n');
    }
    if (value === null || value === undefined) return '';
    return String(value).trim();
  };

  const versions = parsed.versions && typeof parsed.versions === 'object' ? parsed.versions : {};
  const versionKeys = Object.keys(versions)
    .filter(key => /^v\d+$/i.test(key))
    .map(key => ({ key, num: Number(key.slice(1)) }))
    .filter(item => Number.isFinite(item.num))
    .sort((a, b) => a.num - b.num);
  const versionText = versionKeys
    .map(({ key, num }) => {
      const value = toText(versions[key]);
      if (!value) return '';
      return `V${num}：\n${value}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const errors = Array.isArray(parsed.errors) ? parsed.errors : [];
  const vocab = Array.isArray(parsed.vocab) ? parsed.vocab : [];

  const errorItems = errors
    .map(item => ({
      '错误名称': toText(item && item.name),
      '典型错误说明': toText(item && item.description),
      '正确表达模式': toText(item && item.correctPattern)
    }))
    .filter(item => item['错误名称'] || item['典型错误说明'] || item['正确表达模式']);

  const vocabItems = vocab
    .map(item => ({
      '词汇': toText(item && item.word),
      '读音': toText(item && item.reading),
      '中文解释': toText(item && item.meaning),
      '例句': toText(item && item.example)
    }))
    .filter(item => item['词汇'] || item['读音'] || item['中文解释'] || item['例句']);

  return {
    标题: toText(parsed.title),
    主题: toText(parsed.topic),
    我想表达: toText(parsed.intent),
    进化过程: versionText,
    最终定稿: toText(parsed.final),
    本次核心结构: toText(parsed.coreStructure),
    表达升级点: toText(parsed.improvement),
    学习总结: toText(parsed.summary),
    分享标题: toText(parsed.shareTitle),
    错误记录: errorItems,
    生词: vocabItems
  };
}
