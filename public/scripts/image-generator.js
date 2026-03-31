/**
 * 小红书分享图片生成服务
 * 使用HTML/CSS渲染生成四页卡片图片
 * 根据解析的文本字段直接映射生成，无需AI
 * 支持 Linear (极简产品风) 和 Knowledge (知识卡片风) 两种视觉风格
 */

// 风格配置定义
const STYLES = {
  linear: {
    name: 'Linear',
    width: 1080,
    height: 1440,
    colors: {
      bg: '#FAFAFA',
      textMain: '#111111',
      textBody: '#555555',
      accent: '#4F7FFF',
      labelBg: '#EEF3FF',
      labelText: '#4F7FFF',
      border: '#E5E5E5'
    },
    fonts: {
      cn: "'Noto Sans SC', sans-serif",
      jp: "'Noto Sans JP', sans-serif"
    }
  },
  knowledge: {
    name: 'Knowledge',
    width: 1080,
    height: 1440,
    colors: {
      bg: '#F6F6F6',
      cardBg: '#FFFFFF',
      textMain: '#222222',
      textBody: '#444444',
      accent: '#FF7A45',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    fonts: {
      cn: "'Noto Sans SC', sans-serif",
      jp: "'Noto Sans JP', sans-serif"
    }
  }
};

const COVER_IMAGE_SIZE = 640;
const DEFAULT_COVER_IMAGE_PATH = '/assets/xiaohongshu/cover-default.png';

/**
 * 计算 Day X
 */
export function calculateDayNumber() {
  const startDate = new Date('2026-03-06');
  const today = new Date();
  const diffTime = Math.abs(today - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays || 1;
}

function getCoverImageUrl(customUrl) {
  if (customUrl) {
    return customUrl;
  }
  if (typeof window !== 'undefined' && window.location) {
    return new URL(DEFAULT_COVER_IMAGE_PATH, window.location.origin).toString();
  }
  return DEFAULT_COVER_IMAGE_PATH;
}

/**
 * 生成分享图片的HTML模板
 * @param {Object} expressionData - 日语表达记录数据
 * @param {number} cardIndex - 卡片索引 (1-4)
 * @param {string} styleName - 风格名称 ('linear' | 'knowledge')
 * @returns {string} HTML字符串
 */
export function generateCardHTML(expressionData, cardIndex, styleName = 'linear') {
  if (!expressionData) {
    throw new Error('expressionData 不能为空');
  }
  
  const { 分享标题, 进化过程, 最终定稿, 本次核心结构, 表达升级点, 学习总结, 错误记录, 生词, 我想表达, coverImageUrl } = expressionData;
  
  const versions = parseEvolutionProcess(进化过程);
  
  let contentHTML = '';
  switch (cardIndex) {
    case 1:
      contentHTML = generateCoverCard(分享标题 || '日语表达学习记录', styleName, coverImageUrl);
      break;
    case 2:
      contentHTML = generateStartingCard(versions.v1, versions.v2, styleName, 我想表达);
      break;
    case 3:
      contentHTML = generateUpgradeCard(versions.v3, 最终定稿 || '', styleName);
      break;
    case 4:
      contentHTML = generateStructureCard(本次核心结构 || '', 表达升级点 || '', 学习总结, 错误记录, 生词, styleName);
      break;
    default:
      contentHTML = '';
  }

  return `
    <div class="container ${styleName}-style">
      ${contentHTML}
    </div>
  `;
}

/**
 * 解析进化过程文本
 */
function parseEvolutionProcess(evolutionText) {
  const versions = { v1: '', v2: '', v3: '', v4: '' };
  if (!evolutionText) return versions;
  
  const lines = evolutionText.split('\n');
  let currentVersion = '';
  
  lines.forEach(line => {
    if (line.match(/^V[1-4]：/)) {
      currentVersion = line.match(/^V([1-4])：/)[1];
      versions[`v${currentVersion}`] = line.replace(/^V[1-4]：/, '').trim();
    } else if (currentVersion && line.trim()) {
      versions[`v${currentVersion}`] += '\n' + line.trim();
    }
  });
  
  return versions;
}

/**
 * 生成封面卡片HTML
 */
function generateCoverCard(shareTitle, styleName, coverImageUrl) {
  const dayNumber = calculateDayNumber();
  const dayText = `日语表达升级练习 Day ${dayNumber}`;
  const mainTitle = shareTitle || '日语表达学习记录';
  const finalCoverImageUrl = getCoverImageUrl(coverImageUrl);
  
  if (styleName === 'linear') {
    return `
      <div class="card-content cover-card">
        <div class="linear-header">
          <div class="linear-tag">${escapeHtml(dayText)}</div>
        </div>
        <div class="cover-visual">
          <div class="cover-image" style="background-image: url('${finalCoverImageUrl}')"></div>
        </div>
        <div class="cover-title">
          <h1 class="linear-title">${escapeHtml(mainTitle)}</h1>
        </div>
        <div class="linear-footer">
          <div class="linear-brand">乐爸学日语</div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="knowledge-card cover-card">
        <div class="knowledge-header">
          <span class="knowledge-tag">${escapeHtml(dayText)}</span>
        </div>
        <div class="knowledge-body cover-body">
          <div class="cover-visual">
            <div class="cover-image" style="background-image: url('${finalCoverImageUrl}')"></div>
          </div>
          <div class="cover-title">
            <h1 class="knowledge-title">${escapeHtml(mainTitle)}</h1>
          </div>
        </div>
        <div class="knowledge-footer">
          <div class="knowledge-brand">乐爸学日语</div>
        </div>
      </div>
    `;
  }
}

/**
 * 生成表达起点卡片HTML
 */
function generateStartingCard(v1, v2, styleName, cnMeaning) {
  if (!cnMeaning) {
    cnMeaning = extractChineseMeaning(v1);
  }
  
  if (styleName === 'linear') {
    return `
      <div class="card-content">
        <div class="linear-section">
          <div class="linear-section-title">我想表达</div>
          <div class="linear-box">
            <p class="cn-text">${cnMeaning}</p>
          </div>
        </div>
        
        <div class="linear-section">
          <div class="linear-section-title">初级表达</div>
          <div class="linear-versions">
            <div class="linear-version-item">
              <span class="linear-badge">V1</span>
              <p class="jp-text">${escapeHtml(v1)}</p>
            </div>
            ${v2 ? `
            <div class="linear-version-item">
              <span class="linear-badge">V2</span>
              <p class="jp-text">${escapeHtml(v2)}</p>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="knowledge-card">
        <div class="knowledge-section">
          <h2 class="knowledge-heading">我想表达</h2>
          <div class="knowledge-box">
            <p class="cn-text">${cnMeaning}</p>
          </div>
        </div>
        
        <div class="knowledge-section">
          <h2 class="knowledge-heading">初级表达</h2>
          <div class="knowledge-versions">
            <div class="knowledge-version-box">
              <div class="knowledge-label">V1</div>
              <p class="jp-text">${escapeHtml(v1)}</p>
            </div>
            ${v2 ? `
            <div class="knowledge-version-box">
              <div class="knowledge-label">V2</div>
              <p class="jp-text">${escapeHtml(v2)}</p>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * 生成表达升级卡片HTML
 */
function generateUpgradeCard(v3, final, styleName) {
  if (styleName === 'linear') {
    return `
      <div class="card-content">
        <div class="linear-section">
          <div class="linear-section-title">优化表达</div>
          ${v3 ? `
          <div class="linear-version-item">
            <span class="linear-badge">V3</span>
            <p class="jp-text">${escapeHtml(v3)}</p>
          </div>
          ` : ''}
        </div>
        
        <div class="linear-section" style="margin-top: 40px;">
          <div class="linear-section-title">最终定稿</div>
          <div class="linear-final-box">
            <p class="jp-text-large">${escapeHtml(final)}</p>
          </div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="knowledge-card">
        <div class="knowledge-section">
          <h2 class="knowledge-heading">优化表达</h2>
          ${v3 ? `
          <div class="knowledge-version-box">
            <div class="knowledge-label">V3</div>
            <p class="jp-text">${escapeHtml(v3)}</p>
          </div>
          ` : ''}
        </div>
        
        <div class="knowledge-section">
          <h2 class="knowledge-heading highlight">最终定稿</h2>
          <div class="knowledge-final-box">
            <p class="jp-text-large">${escapeHtml(final)}</p>
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * 生成表达结构卡片HTML
 */
function generateStructureCard(coreStructure, upgradePoints, learningSummary, errorRecords, vocabList, styleName) {
  const structures = parseStructurePoints(coreStructure);
  const upgrades = parseUpgradePoints(upgradePoints);
  
  const content = `
    <div class="${styleName === 'linear' ? 'linear-section' : 'knowledge-section'}">
      <div class="${styleName === 'linear' ? 'linear-section-title' : 'knowledge-heading'}">表达结构</div>
      <div class="structure-list">
        ${structures.map(item => `
          <div class="structure-item">
            <span class="structure-num">${item.number}</span>
            <span class="structure-text">${escapeHtml(item.content)}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="${styleName === 'linear' ? 'linear-section' : 'knowledge-section'}">
      <div class="${styleName === 'linear' ? 'linear-section-title' : 'knowledge-heading'}">表达升级</div>
      <div class="upgrade-list">
        ${upgrades.map(upgrade => `
          <div class="upgrade-item">
            <span class="upgrade-check">✓</span>
            <span class="upgrade-text">${escapeHtml(upgrade)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  if (styleName === 'linear') {
    return `
      <div class="card-content">
        ${content}
      </div>
    `;
  } else {
    return `
      <div class="knowledge-card">
        ${content}
      </div>
    `;
  }
}

/**
 * 解析结构点
 */
function parseStructurePoints(structureText) {
  if (!structureText) return [];
  const lines = structureText.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const match = line.match(/^(\d+)[.、]\s*(.+)$/);
    if (match) {
      return { number: match[1], content: match[2].trim() };
    }
    return { number: '•', content: line.trim() };
  });
}

/**
 * 解析升级点
 */
function parseUpgradePoints(upgradeText) {
  if (!upgradeText) return [];
  const lines = upgradeText.split('\n').filter(line => line.trim());
  return lines.map(line => line.replace(/^(\d+)[.、]\s*/, '').trim()).filter(text => text);
}

/**
 * 提取中文含义
 */
function extractChineseMeaning(japaneseText) {
  if (!japaneseText) return '日常表达...';
  return japaneseText.length > 20 ? japaneseText.substring(0, 20) + '...' : japaneseText + '...';
}

/**
 * HTML转义
 */
function escapeHtml(text) {
  if (!text) return '';
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 生成CSS样式
 */
function generateCSS(styleName) {
  const style = STYLES[styleName];
  
  let css = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${style.width}px;
      height: ${style.height}px;
      margin: 0;
      padding: 0;
      font-family: ${style.fonts.cn};
      background: transparent;
      overflow: hidden;
    }
    .container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }
    .jp-text, .jp-text-large, .final-text {
      font-family: ${style.fonts.jp};
      word-break: break-all;
      white-space: pre-wrap;
    }
  `;
  
  if (styleName === 'linear') {
    css += `
      .linear-style {
        background-color: ${style.colors.bg};
        padding: 140px 120px;
        display: flex;
        flex-direction: column;
        color: ${style.colors.textMain};
      }
      
      .card-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
      }
      
      .linear-style::before {
        content: '';
        position: absolute;
        left: 60px;
        top: 140px;
        bottom: 140px;
        width: 6px;
        background-color: ${style.colors.accent};
        border-radius: 3px;
      }
      
      .linear-title {
        font-size: 64px;
        font-weight: 700;
        line-height: 1.4;
        margin-bottom: 32px;
        color: ${style.colors.textMain};
      }
      
      .linear-subtitle {
        font-size: 42px;
        color: ${style.colors.textBody};
        margin-bottom: 20px;
      }
      
      .linear-tag, .linear-badge {
        display: inline-block;
        background-color: ${style.colors.labelBg};
        color: ${style.colors.labelText};
        padding: 8px 24px;
        border-radius: 12px;
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 30px;
      }
      
      .linear-badge {
        font-size: 24px;
        padding: 4px 16px;
        margin-bottom: 16px;
      }
      
      .linear-section {
        margin-bottom: 48px;
      }
      
      .linear-section-title {
        font-size: 36px;
        font-weight: 700;
        color: ${style.colors.textMain};
        margin-bottom: 24px;
        position: relative;
        padding-left: 20px;
      }
      
      .linear-section-title::before {
        content: '';
        position: absolute;
        left: 0;
        top: 8px;
        width: 6px;
        height: 24px;
        background-color: ${style.colors.accent};
        border-radius: 3px;
      }
      
      .linear-box, .linear-final-box {
        padding: 0;
      }
      
      .cn-text {
        font-size: 36px;
        color: ${style.colors.textBody};
        line-height: 1.6;
      }
      
      .jp-text {
        font-size: 38px;
        color: ${style.colors.textMain};
        line-height: 1.8;
      }
      
      .jp-text-large {
        font-size: 42px;
        color: ${style.colors.textMain};
        font-weight: 700;
        line-height: 1.8;
      }
      
      .linear-version-item {
        margin-bottom: 32px;
        padding-left: 10px;
        border-left: 2px solid ${style.colors.border};
      }
      
      .structure-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 24px;
      }
      
      .structure-num {
        background-color: ${style.colors.accent};
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: bold;
        margin-right: 16px;
        flex-shrink: 0;
        margin-top: 4px;
      }
      
      .structure-text, .upgrade-text {
        font-size: 36px;
        color: ${style.colors.textBody};
        line-height: 1.6;
      }
      
      .upgrade-check {
        color: ${style.colors.accent};
        font-size: 36px;
        margin-right: 16px;
        font-weight: bold;
      }
      
      .upgrade-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 24px;
      }
      
      .linear-footer {
        margin-top: auto;
        border-top: 1px solid ${style.colors.border};
        padding-top: 24px;
      }
      
      .linear-brand {
        font-size: 24px;
        color: ${style.colors.accent};
        opacity: 0.6;
        text-align: right;
      }

      .cover-visual {
        display: flex;
        justify-content: center;
        margin: 28px 0 32px;
      }

      .cover-image {
        width: ${COVER_IMAGE_SIZE}px;
        aspect-ratio: 1;
        border-radius: 20px;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        background-color: #F0F2F5;
        border: 1px solid ${style.colors.border};
      }

      .cover-title {
        text-align: center;
        margin-bottom: 16px;
      }

      .cover-card .linear-footer {
        margin-top: 32px;
      }
    `;
  } 
  else {
    css += `
      .knowledge-style {
        background-color: ${style.colors.bg};
        padding: 140px 120px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .knowledge-card {
        width: 100%;
        height: 100%;
        background-color: ${style.colors.cardBg};
        border-radius: 24px;
        box-shadow: 0 20px 60px ${style.colors.shadow};
        padding: 60px;
        display: flex;
        flex-direction: column;
        position: relative;
      }
      
      .knowledge-header {
        margin-bottom: 40px;
      }
      
      .knowledge-tag {
        background-color: ${style.colors.accent};
        color: white;
        padding: 8px 24px;
        border-radius: 12px;
        font-size: 24px;
        font-weight: 700;
      }
      
      .knowledge-body {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .knowledge-body.centered {
        justify-content: center;
        text-align: center;
      }

      .knowledge-body.cover-body {
        justify-content: flex-start;
        align-items: center;
        text-align: center;
      }
      
      .knowledge-title {
        font-size: 64px;
        font-weight: 700;
        color: ${style.colors.textMain};
        margin-bottom: 24px;
        line-height: 1.4;
      }
      
      .knowledge-subtitle {
        font-size: 42px;
        color: ${style.colors.textBody};
      }
      
      .knowledge-section {
        margin-bottom: 48px;
      }
      
      .knowledge-heading {
        font-size: 36px;
        font-weight: 700;
        color: ${style.colors.textMain};
        margin-bottom: 24px;
        display: flex;
        align-items: center;
      }
      
      .knowledge-heading::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 32px;
        background-color: ${style.colors.accent};
        margin-right: 16px;
        border-radius: 4px;
      }
      
      .knowledge-heading.highlight {
        color: ${style.colors.accent};
      }
      
      .knowledge-box, .knowledge-version-box, .knowledge-final-box {
        background-color: #FAFAFA;
        border-radius: 16px;
        padding: 32px;
        margin-bottom: 24px;
      }
      
      .knowledge-final-box {
        background-color: #FFF9F5;
        border: 2px solid ${style.colors.accent}20;
      }
      
      .knowledge-label {
        display: inline-block;
        background-color: ${style.colors.textMain};
        color: white;
        padding: 4px 12px;
        border-radius: 8px;
        font-size: 20px;
        margin-bottom: 16px;
      }
      
      .cn-text {
        font-size: 36px;
        color: ${style.colors.textBody};
        line-height: 1.6;
      }
      
      .jp-text {
        font-size: 38px;
        color: ${style.colors.textMain};
        line-height: 1.8;
      }
      
      .jp-text-large {
        font-size: 42px;
        color: ${style.colors.textMain};
        font-weight: 700;
        line-height: 1.8;
      }
      
      .structure-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px dashed #EEEEEE;
      }
      
      .structure-num {
        background-color: ${style.colors.accent};
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: bold;
        margin-right: 16px;
        flex-shrink: 0;
        margin-top: 4px;
      }
      
      .structure-text, .upgrade-text {
        font-size: 36px;
        color: ${style.colors.textBody};
        line-height: 1.6;
      }
      
      .upgrade-check {
        color: ${style.colors.accent};
        font-size: 36px;
        margin-right: 16px;
        font-weight: bold;
      }
      
      .upgrade-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 24px;
      }
      
      .knowledge-decoration {
        font-size: 80px;
        margin-top: 40px;
        opacity: 0.2;
      }

      .knowledge-footer {
        margin-top: auto;
        border-top: 1px solid #EFEFEF;
        padding-top: 20px;
      }

      .knowledge-brand {
        font-size: 24px;
        color: ${style.colors.accent};
        opacity: 0.7;
        text-align: right;
      }

      .cover-visual {
        display: flex;
        justify-content: center;
        margin: 20px 0 28px;
      }

      .cover-image {
        width: ${COVER_IMAGE_SIZE}px;
        aspect-ratio: 1;
        border-radius: 24px;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        background-color: #F4F4F4;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.08);
      }

      .cover-title {
        text-align: center;
        margin-bottom: 12px;
      }

      .cover-card .knowledge-footer {
        margin-top: 24px;
      }
    `;
  }
  
  return css;
}

/**
 * 将HTML转换为Canvas并生成图片
 */
async function htmlToImage(html, width, height) {
  if (typeof document !== 'undefined') {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = `${width}px`;
      iframe.style.height = `${height}px`;
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      let settled = false;
      let renderStarted = false;

      const cleanup = () => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      };

      const resolveOnce = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
        cleanup();
      };

      const rejectOnce = (error) => {
        if (settled) return;
        settled = true;
        reject(error);
        cleanup();
      };

      const waitForImages = (doc, timeoutMs = 8000) => {
        const images = Array.from(doc.images || []);
        if (images.length === 0) {
          return Promise.resolve();
        }
        return new Promise(resolve => {
          let resolved = false;
          let remaining = images.length;
          const finish = () => {
            if (resolved) return;
            resolved = true;
            resolve();
          };
          const onDone = () => {
            remaining -= 1;
            if (remaining <= 0) finish();
          };
          images.forEach(img => {
            if (img.complete && img.naturalWidth > 0) {
              onDone();
            } else {
              img.addEventListener('load', onDone, { once: true });
              img.addEventListener('error', onDone, { once: true });
            }
          });
          setTimeout(finish, timeoutMs);
        });
      };

      const startRender = async () => {
        if (settled || renderStarted) return;
        renderStarted = true;
        try {
          if (typeof html2canvas === 'undefined') {
            rejectOnce(new Error('html2canvas library is missing'));
            return;
          }
          
          await waitForImages(iframeDoc, 8000);
          await new Promise(r => setTimeout(r, 300));
          
          const canvasPromise = html2canvas(iframeDoc.body, {
            width: width,
            height: height,
            scale: 1,
            useCORS: true,
            backgroundColor: null,
            logging: false,
            allowTaint: false,
          });

          const timeoutPromise = new Promise((_, rejectTimeout) => 
            setTimeout(() => rejectTimeout(new Error('Image generation timed out')), 15000)
          );

          const canvas = await Promise.race([canvasPromise, timeoutPromise]);
          
          canvas.toBlob(blob => {
            if (blob) resolveOnce(blob);
            else rejectOnce(new Error('Canvas to blob conversion failed'));
          }, 'image/png');
        } catch (error) {
          console.error('html2canvas error:', error);
          rejectOnce(error);
        }
      };

      iframe.onload = () => {
        startRender();
      };
      
      iframe.onerror = (e) => {
        console.error('Iframe error:', e);
        rejectOnce(new Error('Iframe loading failed'));
      };

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      setTimeout(() => {
        startRender();
      }, 900);

      setTimeout(() => {
        if (!settled) {
          rejectOnce(new Error('Iframe loading timed out'));
        }
      }, 10000);
    });
  } else {
    return new Promise(resolve => resolve(new Blob([''], { type: 'image/png' })));
  }
}

/**
 * 生成单张卡片图片
 */
export async function generateCardImage(expressionData, cardIndex, styleName = 'linear') {
  const htmlContent = generateCardHTML(expressionData, cardIndex, styleName);
  const cssContent = generateCSS(styleName);
  const style = STYLES[styleName];
  
  const fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">
      <style>
        ${cssContent}
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;
  
  return await htmlToImage(fullHTML, style.width, style.height);
}

/**
 * 生成所有四张卡片
 */
export async function generateAllCards(expressionData, styleName = 'linear', onProgress) {
  const cards = [];
  for (let i = 1; i <= 4; i++) {
    try {
      if (typeof onProgress === 'function') {
        onProgress(`正在生成第${i}张/4...`);
      }
      const cardBlob = await generateCardImage(expressionData, i, styleName);
      cards.push(cardBlob);
    } catch (error) {
      console.error(`生成卡片${i}失败:`, error);
      throw error;
    }
  }
  if (typeof onProgress === 'function') {
    onProgress('生成完成，正在渲染预览...');
  }
  return cards;
}

/**
 * 下载图片
 */
export function downloadImage(imageBlob, fileName) {
  const url = URL.createObjectURL(imageBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 批量下载
 */
export function downloadMultipleImages(imageBlobs, baseFileName) {
  imageBlobs.forEach((blob, index) => {
    const fileName = `${baseFileName}_${index + 1}.png`;
    setTimeout(() => {
      downloadImage(blob, fileName);
    }, index * 500);
  });
}
