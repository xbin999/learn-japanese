import { initHistory, loadHistory } from './history-client.js';
import { generateAllCards, downloadMultipleImages, downloadImage } from './image-generator.js';
import { ensureLearnerName } from './nav.js';

let currentRecord = null;
let template = '';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('../templates/xiaohongshu.txt');
    if (res.ok) {
      template = await res.text();
    } else {
      template = getDefaultTemplate();
    }
  } catch (e) {
    console.error('Failed to load template', e);
    template = getDefaultTemplate();
  }
  
  document.getElementById('templateEditor').value = template;

  initHistory('historyList', 'loadMoreHistoryBtn', onRecordSelect);
  document.getElementById('searchBtn').addEventListener('click', () => {
    triggerSearch();
  });
  
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      triggerSearch();
    }
  });

  document.getElementById('toggleTemplate').addEventListener('click', toggleTemplateEditor);
  document.getElementById('templateEditor').addEventListener('input', (e) => {
    template = e.target.value;
    if (currentRecord) generateText(currentRecord);
  });
  document.getElementById('copyTextBtn').addEventListener('click', copyText);
  document.getElementById('generateImageBtn').addEventListener('click', generateImages);
});

function triggerSearch() {
  const learnerName = ensureLearnerName();
  if (!learnerName) return;
  const query = document.getElementById('searchInput').value.trim();
  loadHistory(true, query, learnerName);
}

function getDefaultTemplate() {
  return `{{分享标题}}

【主题】{{主题}}
【日期】{{日期}}

💡 我想表达：
{{我想表达}}

✅ 地道说法：
{{最终定稿}}

📝 核心语法：
{{本次核心结构}}

🌟 表达升级点：
{{表达升级点}}

📖 生词本：
{{生词}}

#日语学习 #日语表达`;
}

function isMobileDevice() {
  return window.matchMedia('(max-width: 768px)').matches || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function openImageInNewTab(blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function onRecordSelect(record, index) {
  currentRecord = record;
  
  if (typeof index !== 'undefined') {
    currentRecordIndex = index;
  }
  
  const panel = document.getElementById('detailPanel');
  panel.style.opacity = '1';
  panel.style.pointerEvents = 'auto';
  
  document.querySelectorAll('.history-card').forEach((el, i) => {
    el.classList.toggle('active', i === currentRecordIndex);
  });
  
  generateText(record);
  
  document.getElementById('imageResult').style.display = 'none';
  document.getElementById('imagePreview').innerHTML = '';
  
  if (window.innerWidth <= 768) {
    panel.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }
}

function generateText(record) {
  let text = template;
  
  const vocab = record['生词'] || '';
  const errors = record['错误记录'] || '';

  const replacements = {
    '{{标题}}': record['标题'] || '',
    '{{主题}}': (record['主题'] || []).join(', '),
    '{{日期}}': record['日期'] || '',
    '{{我想表达}}': record['我想表达'] || '',
    '{{最终定稿}}': record['最终定稿'] || '',
    '{{本次核心结构}}': record['本次核心结构'] || '',
    '{{表达升级点}}': record['表达升级点'] || '',
    '{{生词}}': vocab,
    '{{错误记录}}': errors,
    '{{进化过程}}': record['进化过程'] || '',
    '{{分享标题}}': record['分享标题'] || record['标题'] || '',
    '{{学习总结}}': record['学习总结'] || ''
  };

  for (const [key, value] of Object.entries(replacements)) {
    text = text.replace(new RegExp(key, 'g'), value);
  }

  document.getElementById('xhsContent').value = text;
}

function toggleTemplateEditor() {
  const editor = document.getElementById('templateEditor');
  if (editor.style.display === 'none') {
    editor.style.display = 'block';
  } else {
    editor.style.display = 'none';
  }
}

function copyText() {
  const textarea = document.getElementById('xhsContent');
  textarea.select();
  document.execCommand('copy');
  
  const btn = document.getElementById('copyTextBtn');
  const original = btn.textContent;
  btn.textContent = '已复制!';
  setTimeout(() => btn.textContent = original, 2000);
}

async function generateImages() {
  if (!currentRecord) return;
  
  const btn = document.getElementById('generateImageBtn');
  const resultArea = document.getElementById('imageResult');
  const status = document.getElementById('imageStatus');
  const preview = document.getElementById('imagePreview');
  const saveAllBtn = document.getElementById('saveAllBtn');
  const tips = document.getElementById('imageTips');
  const isMobile = isMobileDevice();
  
  btn.disabled = true;
  btn.textContent = '生成中...';
  resultArea.style.display = 'block';
  status.textContent = '正在准备数据...';
  tips.textContent = '';
  tips.style.display = 'none';
  preview.innerHTML = '';
  saveAllBtn.style.display = 'none';
  
  try {
    const style = document.querySelector('input[name="cardStyle"]:checked').value;
    
    const processedRecord = {
      ...currentRecord,
      生词: parseVocab(currentRecord['生词']),
      错误记录: parseErrors(currentRecord['错误记录'])
    };
    
    const imageUrls = await generateAllCards(processedRecord, style, (msg) => {
      status.textContent = msg;
    });
    
    status.innerHTML = `<span style="color:green">✅ 生成完成！</span>`;
    if (isMobile) {
      tips.textContent = '移动端请长按图片保存到相册';
      tips.style.display = 'block';
    }
    
    preview.innerHTML = '';
    imageUrls.forEach((blob, index) => {
      const url = URL.createObjectURL(blob);
      const img = document.createElement('img');
      img.src = url;
      img.style.width = '150px';
      img.style.borderRadius = '8px';
      img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      img.style.cursor = 'pointer';
      
      img.onclick = () => {
        if (isMobile) {
          openImageInNewTab(blob);
        } else {
          downloadImage(blob, `${processedRecord.分享标题 || '日语表达'}_${index + 1}.png`);
        }
      };
      
      const wrapper = document.createElement('div');
      wrapper.style.display = 'inline-block';
      wrapper.style.margin = '10px';
      wrapper.appendChild(img);
      preview.appendChild(wrapper);
    });
    
    saveAllBtn.style.display = 'inline-block';
    saveAllBtn.onclick = () => {
      if (isMobile) {
        tips.textContent = '移动端无法批量保存，请逐张长按图片保存';
        tips.style.display = 'block';
        return;
      }
      downloadMultipleImages(imageUrls, processedRecord.分享标题 || '日语表达');
    };
    
  } catch (err) {
    console.error('Image generation failed:', err);
    status.innerHTML = `<span style="color:red">❌ 生成失败: ${err.message}</span>`;
    alert(`生成图片失败: ${err.message}\n请尝试刷新页面或使用电脑访问。`);
  } finally {
    btn.disabled = false;
    btn.textContent = '生成分享图片';
  }
}

function parseVocab(text) {
  if (!text) return [];
  
  const items = text.split(/\*\*单词\d+\*\*/).filter(t => t.trim());
  return items.map(item => {
    const getVal = (key) => {
      const m = item.match(new RegExp(`${key}：(.*?)(?:\n|$)`));
      return m ? m[1].trim() : '';
    };
    return {
      '词汇': getVal('词汇'),
      '读音': getVal('读音'),
      '中文解释': getVal('中文解释'),
      '例句': getVal('例句')
    };
  });
}

function parseErrors(text) {
  if (!text) return [];
  const items = text.split(/\*\*错误\d+\*\*/).filter(t => t.trim());
  return items.map(item => {
    const getVal = (key) => {
      const m = item.match(new RegExp(`${key}：(.*?)(?:\n|$)`));
      return m ? m[1].trim() : '';
    };
    return {
      '错误名称': getVal('错误名称'),
      '典型错误说明': getVal('典型错误说明'),
      '正确表达模式': getVal('正确表达模式')
    };
  });
}

let touchStartX = 0;
let touchEndX = 0;
let currentRecordIndex = 0;
let records = [];

document.addEventListener('DOMContentLoaded', () => {
  if ('ontouchstart' in window) {
    const historyList = document.getElementById('historyList');
    
    historyList.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    
    historyList.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipeGesture();
    });
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
    
    const xhsContent = document.getElementById('xhsContent');
    const templateEditor = document.getElementById('templateEditor');
    
    [xhsContent, templateEditor].forEach(textarea => {
      if (textarea) {
        textarea.addEventListener('focus', () => {
          setTimeout(() => {
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        });
      }
    });
  }
  
  function adjustTextareaHeight(textarea) {
    if (!textarea) return;
    
    const minHeight = 120;
    const maxHeight = 300;
    
    textarea.style.height = 'auto';
    const newHeight = Math.max(minHeight, Math.min(maxHeight, textarea.scrollHeight));
    textarea.style.height = newHeight + 'px';
  }
  
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    textarea.addEventListener('input', () => adjustTextareaHeight(textarea));
    setTimeout(() => adjustTextareaHeight(textarea), 100);
  });
  
  window.addEventListener('resize', () => {
    textareas.forEach(textarea => {
      setTimeout(() => adjustTextareaHeight(textarea), 100);
    });
  });
  
  let lastScrollTop = 0;
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (lastScrollTop - scrollTop > 100 && scrollTop > 200) {
      showBackToTopButton();
    }
    lastScrollTop = scrollTop;
  });
  
  function showBackToTopButton() {
    let backToTopBtn = document.getElementById('backToTopBtn');
    if (!backToTopBtn) {
      backToTopBtn = document.createElement('button');
      backToTopBtn.id = 'backToTopBtn';
      backToTopBtn.textContent = '↑';
      backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--accent, #d7ccc8);
        color: var(--ink, #3e2723);
        border: none;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        transition: all 0.3s ease;
        display: none;
      `;
      
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        backToTopBtn.style.display = 'none';
      });
      
      document.body.appendChild(backToTopBtn);
    }
    
    backToTopBtn.style.display = 'block';
    
    setTimeout(() => {
      if (backToTopBtn) {
        backToTopBtn.style.display = 'none';
      }
    }, 3000);
  }
});

function handleSwipeGesture() {
  if (!records.length) return;
  
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0 && currentRecordIndex < records.length - 1) {
      currentRecordIndex++;
      selectRecordWithSwipe(records[currentRecordIndex], currentRecordIndex);
    } else if (diff < 0 && currentRecordIndex > 0) {
      currentRecordIndex--;
      selectRecordWithSwipe(records[currentRecordIndex], currentRecordIndex);
    }
  }
}

function selectRecordWithSwipe(record, index) {
  currentRecord = record;
  currentRecordIndex = index;
  generateText(record);
  
  document.querySelectorAll('.history-card').forEach((card, i) => {
    card.classList.toggle('active', i === index);
  });
  
  if (window.innerWidth <= 768) {
    document.getElementById('detailPanel').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }
}
