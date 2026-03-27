import { WORKER_URL } from './config.js';

let nextCursor = null;
let hasMore = false;
let isLoading = false;
let historyContainer = null;
let loadMoreBtn = null;
let onItemClickCallback = null;
let currentOffset = 0;
let currentQuery = '';
let currentLearner = '';

export function initHistory(containerId, loadMoreBtnId, onItemClick) {
  historyContainer = document.getElementById(containerId);
  loadMoreBtn = document.getElementById(loadMoreBtnId);
  onItemClickCallback = onItemClick;

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => loadHistory());
  }
}

export async function loadHistory(reset = false, query, learner) {
  if (isLoading) return;
  isLoading = true;

  if (reset) {
    nextCursor = null;
    hasMore = false;
    currentOffset = 0;
    if (historyContainer) historyContainer.innerHTML = '<div style="text-align:center; color:#999; padding: 2rem;">正在加载数据...</div>';
  }
  
  if (typeof query === 'string') currentQuery = query;
  if (typeof learner === 'string') currentLearner = learner;

  if (loadMoreBtn) {
    loadMoreBtn.textContent = '加载中...';
    loadMoreBtn.disabled = true;
  }

  try {
    let baseUrl = '';
    
    if (WORKER_URL && typeof WORKER_URL === 'string' && WORKER_URL.trim() !== '') {
      baseUrl = WORKER_URL.trim();
      if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
      baseUrl += '/history';
    } else {
      baseUrl = '/history';
    }

    const params = new URLSearchParams();
    params.set('limit', '10');
    if (nextCursor) params.set('cursor', nextCursor);
    const effectiveQuery = currentQuery || '';
    const effectiveLearner = currentLearner || '';
    if (effectiveQuery) params.set('title', effectiveQuery);
    if (effectiveLearner) params.set('learner', effectiveLearner);

    const finalUrl = `${baseUrl}?${params.toString()}`;
    
    console.log('Fetching history from:', finalUrl);

    const res = await fetch(finalUrl);
    if (!res.ok) throw new Error(`History API error: ${res.status}`);
    
    const data = await res.json();
    
    if (reset && historyContainer) historyContainer.innerHTML = '';

    if (data.results && data.results.length > 0) {
      renderHistoryItems(data.results);
      currentOffset += data.results.length;
    } else if (reset) {
      historyContainer.innerHTML = '<div style="text-align:center; color:#999;">暂无记录</div>';
    }

    nextCursor = data.next_cursor;
    hasMore = data.has_more;

  } catch (err) {
    console.error('Failed to load history:', err);
    if (reset && historyContainer) {
       historyContainer.innerHTML = `<div style="text-align:center; color:red; padding: 1rem;">
         加载失败<br>
         <small>请确保后端服务已启动</small><br>
         <small style="color:#999; font-size:0.8em">${err.message}</small>
       </div>`;
    } else {
       alert(`加载更多失败: ${err.message}`);
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
    
    card.addEventListener('click', () => {
      if (onItemClickCallback) {
        onItemClickCallback(item, currentOffset + index);
      } else {
        fillInput(item);
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
  
  let errorText = item['错误记录'] || '';
  errorText = errorText.replace(/\*\*错误(\d+)\*\*/g, '[错误$1]');
  
  let vocabText = item['生词'] || '';
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
  
  const parseBtn = document.getElementById('parseBtn');
  if (parseBtn) {
    setTimeout(() => parseBtn.click(), 500);
  }
}
