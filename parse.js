/**
 * 按 INTERFACE.md 块级规则解析文本
 * 返回：{ 标题, 主题, 进化过程, 最终定稿, 本次核心结构, 表达升级点, 错误记录[], 生词[] }
 */
export function parseText(raw) {
  const lines = raw.split(/\r?\n/);
  const data = {
    标题: '',
    主题: '',
    我想表达: '',
    进化过程: '',
    最终定稿: '',
    本次核心结构: '',
    表达升级点: '',
    学习总结: '',
    分享标题: '',
    错误记录: [],
    生词: []
  };

  const getBlock = (marker) => {
    const start = lines.findIndex(l => l.trim() === marker);
    if (start === -1) return '';
    const end = lines.findIndex((l, idx) => idx > start && l.trim().startsWith('——') && l.trim().endsWith('——'));
    const last = end === -1 ? lines.length : end;
    return lines.slice(start + 1, last).map(l => l.trim()).filter(Boolean).join('\n');
  };

  // 1. 顶层字段（冒号版）
  const top = lines.slice(0, 20); // 只扫前 20 行，避免大块干扰
  data.标题 = top.find(l => l.startsWith('标题：'))?.replace('标题：', '').trim() || '';
  data.主题 = top.find(l => l.startsWith('主题：'))?.replace('主题：', '').trim() || '';
  data.我想表达 = top.find(l => l.startsWith('我想表达：'))?.replace('我想表达：', '').trim() || '';
  
  // 尝试从顶层字段解析分享标题和学习总结（作为备选）
  const shareTitleLine = top.find(l => l.startsWith('分享标题：'));
  if (shareTitleLine) data.分享标题 = shareTitleLine.replace('分享标题：', '').trim();
  
  const summaryLine = top.find(l => l.startsWith('学习总结：'));
  if (summaryLine) data.学习总结 = summaryLine.replace('学习总结：', '').trim();

  // 2. 大块内容
  data.进化过程 = getBlock('——进化过程——');
  data.最终定稿 = getBlock('——最终定稿——');
  data.本次核心结构 = getBlock('——本次核心结构——');
  data.表达升级点 = getBlock('——表达升级点——');
  
  const blockIWantToExpress = getBlock('——我想表达——');
  if (blockIWantToExpress) data.我想表达 = blockIWantToExpress;

  // 如果块解析为空，保留顶层解析结果；否则使用块解析结果
  const blockSummary = getBlock('——学习总结——');
  if (blockSummary) data.学习总结 = blockSummary;
  
  const blockShareTitle = getBlock('——分享标题——');
  if (blockShareTitle) data.分享标题 = blockShareTitle;

  // 3. 错误记录
  const errBlock = getBlock('——错误记录——');
  data.错误记录 = parseItems(errBlock, /\[错误\d+\]/);

  // 4. 生词
  const vocabBlock = getBlock('——生词——');
  data.生词 = parseItems(vocabBlock, /\[单词\d+\]/);

  return data;
}

// 通用 [标签X] 块解析
function parseItems(block, splitter) {
  if (!block) return [];
  return block
    .split(splitter)
    .filter(chunk => chunk.trim())
    .map(chunk => {
      const lines = chunk.trim().split('\n');
      const obj = {};
      lines.forEach(l => {
        const m = l.trim().match(/^(.+?)：(.+)/);
        if (m) obj[m[1]] = m[2].trim();
      });
      return obj;
    });
}