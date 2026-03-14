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
  data.错误记录 = parseErrors(errBlock);

  // 4. 生词
  const vocabBlock = getBlock('——生词——');
  data.生词 = parseVocab(vocabBlock);

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
      let currentKey = null;

      lines.forEach(l => {
        const line = l.trim();
        if (!line) return;

        // 匹配 "Key：Value"
        const m = line.match(/^(.+?)：(.*)/);
        if (m) {
          currentKey = m[1].trim();
          obj[currentKey] = m[2].trim();
        } else if (currentKey) {
          // 如果不是 Key:Value 格式，且已有 Key，则追加到 Value（支持多行）
          obj[currentKey] += '\n' + line;
        }
      });
      return obj;
    });
}

function parseErrors(block) {
  if (!block) return [];
  if (/\[错误\d+\]/.test(block)) return parseItems(block, /\[错误\d+\]/);
  const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
  const errors = [];
  let current = {};
  const pushCurrent = () => {
    if (Object.keys(current).length) {
      errors.push(current);
      current = {};
    }
  };

  lines.forEach(line => {
    const reasonMatch = line.match(/^原因[:：](.*)$/);
    if (reasonMatch) {
      const reasonText = reasonMatch[1].trim();
      if (reasonText) {
        current['典型错误说明'] = current['典型错误说明']
          ? `${current['典型错误说明']}\n${reasonText}`
          : reasonText;
      }
      return;
    }

    const keyValue = line.match(/^(.+?)：(.*)/);
    if (keyValue) {
      current[keyValue[1].trim()] = keyValue[2].trim();
      return;
    }

    if (line.includes('❌')) {
      if (Object.keys(current).length) pushCurrent();
      const name = line.replace('❌', '').trim();
      if (name) current['错误名称'] = name;
      return;
    }

    if (line.includes('✔') || line.includes('✅')) {
      const correct = line.replace(/[✔✅]/g, '').trim();
      if (correct) current['正确表达模式'] = correct;
      return;
    }

    const description = line;
    if (description) {
      current['典型错误说明'] = current['典型错误说明']
        ? `${current['典型错误说明']}\n${description}`
        : description;
    }

  });

  pushCurrent();
  return errors;
}

function parseVocab(block) {
  if (!block) return [];
  if (/\[单词\d+\]/.test(block)) return parseItems(block, /\[单词\d+\]/);
  const buildEntry = (lines) => {
    const first = lines[0] || '';
    let word = first;
    let reading = '';
    const match = first.match(/^(.*?)（(.*?)）$/) || first.match(/^(.*?)\((.*?)\)$/);
    if (match) {
      word = match[1].trim();
      reading = match[2].trim();
    }
    const meaning = lines[1] || '';
    const example = lines.length > 2 ? lines.slice(2).join('\n') : '';
    return {
      '词汇': word,
      '读音': reading,
      '中文解释': meaning,
      '例句': example
    };
  };

  const chunks = block.split(/\n\s*\n/).map(c => c.trim()).filter(Boolean);
  if (chunks.length <= 1) {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length > 2) {
      return lines
        .reduce((items, line, index) => {
          if (index % 2 === 0) items.push([line]);
          else items[items.length - 1].push(line);
          return items;
        }, [])
        .map(linesPair => buildEntry(linesPair))
        .filter(v => v['词汇'] || v['读音'] || v['中文解释'] || v['例句']);
    }
  }

  return chunks
    .map(chunk => buildEntry(chunk.split('\n').map(line => line.trim()).filter(Boolean)))
    .filter(v => v['词汇'] || v['读音'] || v['中文解释'] || v['例句']);
}
