import { WORKER_URL } from './config.js';
import { ensureLearnerName } from './nav.js';

const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const historyList = document.getElementById('historyList');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const selectionInfo = document.getElementById('selectionInfo');
const templateEditor = document.getElementById('templateEditor');
const previewOutput = document.getElementById('previewOutput');
const exportBtn = document.getElementById('exportBtn');

const searchBtn = document.getElementById('searchBtn');
const selectAllBtn = document.getElementById('selectAllBtn');
const invertSelectionBtn = document.getElementById('invertSelectionBtn');
const clearSelectionBtn = document.getElementById('clearSelectionBtn');

let records = [];
let selectedIds = new Set();
let nextCursor = null;
let hasMore = false;
let isLoading = false;
let template = '';
let currentLearner = '';

document.addEventListener('DOMContentLoaded', async () => {
  const { start, end } = getDefaultDateRange();
  startDateInput.value = start;
  endDateInput.value = end;
  template = await loadTemplate();
  templateEditor.value = template;

  searchBtn.addEventListener('click', () => loadHistory(true));
  loadMoreBtn.addEventListener('click', () => loadHistory(false));
  selectAllBtn.addEventListener('click', selectAll);
  invertSelectionBtn.addEventListener('click', invertSelection);
  clearSelectionBtn.addEventListener('click', clearSelection);
  exportBtn.addEventListener('click', exportMarkdown);

  templateEditor.addEventListener('input', () => {
    template = templateEditor.value;
    updatePreview();
  });
});

function getDefaultDateRange() {
  const today = new Date();
  const end = formatDate(today);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 6);
  const start = formatDate(startDate);
  return { start, end };
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function loadTemplate() {
  try {
    const res = await fetch('../../templates/review.md');
    if (res.ok) {
      return await res.text();
    }
  } catch (err) {
    console.error('Template load failed', err);
  }
  return getDefaultTemplate();
}

function getDefaultTemplate() {
  return `# {{标题}}

- 日期：{{日期}}
- 主题：{{主题}}
- 来源：{{来源}}

## 我想表达
{{我想表达}}

## 进化过程
{{进化过程}}

## 最终定稿
{{最终定稿}}

## 本次核心结构
{{本次核心结构}}

## 表达升级点
{{表达升级点}}

## 错误记录
{{错误记录}}

## 生词
{{生词}}

## 学习总结
{{学习总结}}

## 分享标题
{{分享标题}}`;
}

async function loadHistory(reset) {
  if (isLoading) return;
  if (reset) {
    currentLearner = ensureLearnerName();
    if (!currentLearner) return;
  }
  isLoading = true;

  if (reset) {
    nextCursor = null;
    hasMore = false;
    records = [];
    selectedIds.clear();
    updateSelectionInfo();
    updatePreview();
    historyList.innerHTML = '<div style="text-align:center; color:#999; padding: 2rem;">正在加载数据...</div>';
  }

  loadMoreBtn.textContent = '加载中...';
  loadMoreBtn.disabled = true;

  try {
    const baseUrl = getHistoryBaseUrl();
    const params = new URLSearchParams();
    params.set('limit', '20');
    if (nextCursor) params.set('cursor', nextCursor);

    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    if (currentLearner) params.set('learner', currentLearner);

    const finalUrl = `${baseUrl}?${params.toString()}`;
    const res = await fetch(finalUrl);
    if (!res.ok) throw new Error(`History API error: ${res.status}`);
    const data = await res.json();

    if (reset) historyList.innerHTML = '';

    if (data.results && data.results.length > 0) {
      records = records.concat(data.results);
      renderHistoryItems(data.results);
    } else if (reset) {
      historyList.innerHTML = '<div style="text-align:center; color:#999;">暂无记录</div>';
    }

    nextCursor = data.next_cursor;
    hasMore = data.has_more;
    updateLoadMoreButton();
  } catch (err) {
    console.error('Failed to load history:', err);
    if (reset) {
      historyList.innerHTML = `<div style="text-align:center; color:red; padding: 1rem;">
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

function getHistoryBaseUrl() {
  if (WORKER_URL && typeof WORKER_URL === 'string' && WORKER_URL.trim() !== '') {
    let baseUrl = WORKER_URL.trim();
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    return `${baseUrl}/history`;
  }
  return '/history';
}

function renderHistoryItems(items) {
  const fragment = document.createDocumentFragment();
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'history-card';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.id = item.id;
    checkbox.checked = selectedIds.has(item.id);
    checkbox.addEventListener('change', () => {
      toggleSelection(item.id, checkbox.checked);
    });

    const content = document.createElement('div');
    content.className = 'history-content';
    content.innerHTML = `
      <div class="history-header">
        <span class="history-date">${item['日期'] || '无日期'}</span>
        <div class="history-tags">
          ${(item['主题'] || []).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
      <h3 class="history-title">${item['标题'] || '无标题'}</h3>
      <p class="history-preview">${(item['我想表达'] || '').slice(0, 50)}...</p>
    `;

    card.dataset.id = item.id;
    card.appendChild(checkbox);
    card.appendChild(content);
    card.addEventListener('click', (event) => {
      if (event.target.tagName === 'INPUT') return;
      checkbox.checked = !checkbox.checked;
      toggleSelection(item.id, checkbox.checked);
    });

    fragment.appendChild(card);
  });
  historyList.appendChild(fragment);
}

function toggleSelection(id, isSelected) {
  if (isSelected) {
    selectedIds.add(id);
  } else {
    selectedIds.delete(id);
  }
  updateSelectionInfo();
  updatePreview();
}

function selectAll() {
  records.forEach(record => selectedIds.add(record.id));
  syncCheckboxes();
  updateSelectionInfo();
  updatePreview();
}

function invertSelection() {
  const newSelected = new Set();
  records.forEach(record => {
    if (!selectedIds.has(record.id)) {
      newSelected.add(record.id);
    }
  });
  selectedIds = newSelected;
  syncCheckboxes();
  updateSelectionInfo();
  updatePreview();
}

function clearSelection() {
  selectedIds.clear();
  syncCheckboxes();
  updateSelectionInfo();
  updatePreview();
}

function syncCheckboxes() {
  const checkboxes = historyList.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    const id = checkbox.dataset.id;
    if (!id) return;
    checkbox.checked = selectedIds.has(id);
  });
}

function updateSelectionInfo() {
  const count = selectedIds.size;
  selectionInfo.textContent = `已选 ${count} 条`;
  exportBtn.disabled = count === 0;
}

function updatePreview() {
  if (selectedIds.size === 0) {
    previewOutput.value = '';
    return;
  }
  const selectedRecords = records.filter(record => selectedIds.has(record.id));
  const content = selectedRecords.map(record => applyTemplate(record, template)).join('\n\n---\n\n');
  previewOutput.value = content;
}

function applyTemplate(record, templateText) {
  let output = templateText;
  const entries = {
    标题: record['标题'] || '',
    主题: Array.isArray(record['主题']) ? record['主题'].join('、') : (record['主题'] || ''),
    日期: record['日期'] || '',
    我想表达: record['我想表达'] || '',
    进化过程: record['进化过程'] || '',
    最终定稿: record['最终定稿'] || '',
    本次核心结构: record['本次核心结构'] || '',
    表达升级点: record['表达升级点'] || '',
    错误记录: record['错误记录'] || '',
    生词: record['生词'] || '',
    学习总结: record['学习总结'] || '',
    分享标题: record['分享标题'] || '',
    来源: record['来源'] || ''
  };

  Object.keys(entries).forEach(key => {
    const value = entries[key];
    output = output.split(`{{${key}}}`).join(value);
  });
  return output;
}

function updateLoadMoreButton() {
  if (hasMore) {
    loadMoreBtn.style.display = 'block';
    loadMoreBtn.textContent = '加载更多';
    loadMoreBtn.disabled = false;
  } else {
    loadMoreBtn.style.display = 'none';
  }
}

function exportMarkdown() {
  if (selectedIds.size === 0) {
    alert('请先选择记录');
    return;
  }

  const content = previewOutput.value || records
    .filter(record => selectedIds.has(record.id))
    .map(record => applyTemplate(record, template))
    .join('\n\n---\n\n');

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const link = document.createElement('a');
  const rangeText = `${startDateInput.value || 'start'}_${endDateInput.value || 'end'}`;
  link.download = `review-${rangeText}.md`;
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
