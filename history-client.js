
import { WORKER_URL } from './config.js';

let nextCursor = null;
let hasMore = false;
let isLoading = false;
let historyContainer = null;
let loadMoreBtn = null;
let onItemClickCallback = null;
let currentOffset = 0;

export function initHistory(containerId, loadMoreBtnId, onItemClick) {
  historyContainer = document.getElementById(containerId);
  loadMoreBtn = document.getElementById(loadMoreBtnId);
  onItemClickCallback = onItemClick;

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => loadHistory());
  }
}

export async function loadHistory(reset = false, query = '') {
  if (isLoading) return;
  isLoading = true;

  if (reset) {
    nextCursor = null;
    hasMore = false;
    currentOffset = 0; // 重置偏移量
    // if (historyContainer) historyContainer.innerHTML = ''; // 不要立即清空，保持加载状态或者显示加载骨架屏
    if (historyContainer) historyContainer.innerHTML = '<div style="text-align:center; color:#999; padding: 2rem;">正在加载数据...</div>';
  }

  // 更新按钮状态
  if (loadMoreBtn) {
    loadMoreBtn.textContent = '加载中...';
    loadMoreBtn.disabled = true;
  }

  let targetUrl = '';

  try {
    // 修复URL构造：更加稳健的处理方式
    // 在Cloudflare Pages环境中，如果WORKER_URL为空字符串，我们应该直接使用相对路径，或者正确构造绝对路径
    // 之前的问题可能是 new URL(path) 如果path不是绝对路径且没有提供base参数会报错
    
    let fetchUrl;
    
    if (WORKER_URL) {
      // 如果配置了WORKER_URL（如本地开发环境）
      let baseUrl = WORKER_URL;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      targetUrl = `${baseUrl}/history`;
      fetchUrl = new URL(targetUrl);
    } else {
      // 生产环境，使用当前域名
      // 使用 window.location.origin 确保构建出绝对路径
      targetUrl = `${window.location.origin}/history`;
      fetchUrl = new URL(targetUrl);
    }
    
    console.log('Fetching history from:', targetUrl); // 调试日志
    
    fetchUrl.searchParams.set('limit', '10');
    if (nextCursor) {
      fetchUrl.searchParams.set('cursor', nextCursor);
    }
    if (query) {
      fetchUrl.searchParams.set('title', query);
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error(`History API error: ${res.status}`);
    
    const data = await res.json();
    
    if (reset && historyContainer) historyContainer.innerHTML = ''; // 获取成功后清空

    if (data.results && data.results.length > 0) {
      renderHistoryItems(data.results);
      currentOffset += data.results.length; // 更新偏移量
    } else if (reset) {
      historyContainer.innerHTML = '<div style="text-align:center; color:#999;">暂无记录</div>';
    }

    nextCursor = data.next_cursor;
    hasMore = data.has_more;

  } catch (err) {
    console.error('Failed to load history:', err);
    if (reset && historyContainer) {
       historyContainer.innerHTML = `<div style="text-align:center; color:red; padding: 1rem;">加载失败: ${err.message}<br><small>URL: ${targetUrl}</small><br><small>请确保后端服务已启动 (localhost:8787)</small></div>`;
    } else {
       alert('加载更多失败，请重试');
    }
  } finally {
    isLoading = false;
    updateLoadMoreButton();
  }
}

function updateLoadMoreButton() {
  if (!loadMoreBtn) return;
  
  if (hasMore) {
    loadMoreBtn.style.display = 'block';
    loadMoreBtn.textContent = '加载更多';
    loadMoreBtn.disabled = false;
  } else {
    loadMoreBtn.style.display = 'none';
  }
}

function renderHistoryItems(items) {
  if (!historyContainer) return;

  const fragment = document.createDocumentFragment();

  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <div class="history-header">
        <span class="history-date">${item['日期'] || '无日期'}</span>
        <div class="history-tags">
          ${(item['主题'] || []).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
      <h3 class="history-title">${item['标题'] || '无标题'}</h3>
      <p class="history-preview">${(item['我想表达'] || '').slice(0, 50)}...</p>
    `;
    
    // 点击卡片
    card.addEventListener('click', () => {
      if (onItemClickCallback) {
        onItemClickCallback(item, currentOffset + index);
      } else {
        fillInput(item);
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    fragment.appendChild(card);
  });

  historyContainer.appendChild(fragment);
}

function fillInput(item) {
  const input = document.getElementById('input');
  if (!input) return;

  // 构造结构化文本
  // 注意：这里我们尽量还原格式，但可能无法完全一致，取决于用户原始输入习惯
  // 我们使用标准格式
  
  // 处理错误记录和生词的格式转换 (Markdown -> 解析器格式)
  let errorText = item['错误记录'] || '';
  // 将 **错误N** 转换为 [错误N] 以适配 parse.js
  errorText = errorText.replace(/\*\*错误(\d+)\*\*/g, '[错误$1]');
  
  let vocabText = item['生词'] || '';
  // 将 **单词N** 转换为 [单词N] 以适配 parse.js
  vocabText = vocabText.replace(/\*\*单词(\d+)\*\*/g, '[单词$1]');
  
  const text = `标题：${item['标题']}
主题：${(item['主题'] || []).join(', ')}
分享标题：${item['分享标题'] || ''}
学习总结：${item['学习总结'] || ''}

——我想表达——
${item['我想表达'] || ''}

——进化过程——
${item['进化过程'] || ''}

——最终定稿——
${item['最终定稿'] || ''}

——本次核心结构——
${item['本次核心结构'] || ''}

——表达升级点——
${item['表达升级点'] || ''}

——错误记录——
${errorText}

——生词——
${vocabText}
`;

  input.value = text;
  
  // 触发一次解析预览
  // 假设 parseBtn 存在且有点击事件
  const parseBtn = document.getElementById('parseBtn');
  if (parseBtn) {
    // 稍微延迟一下，让用户看到填入的效果
    setTimeout(() => parseBtn.click(), 500);
  }
}
