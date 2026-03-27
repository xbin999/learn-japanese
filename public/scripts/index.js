import { WORKER_URL } from './config.js';
import { ensureLearnerName } from './nav.js';

const input = document.getElementById('input');
const syncResult = document.getElementById('syncResult');
const syncBtn = document.getElementById('syncBtn');
const clearBtn = document.getElementById('clearBtn');
const modelSelect = document.getElementById('modelSelect');

if (window.location.hostname === 'localhost') {
  modelSelect.value = 'zhipu';
} else {
  modelSelect.value = 'gemini';
}

const readJson = async (res) => {
  const text = await res.text();
  try {
    return { ok: true, json: JSON.parse(text), text };
  } catch (err) {
    return { ok: false, text };
  }
};

const setStatus = (message, color) => {
  if (!message) {
    syncResult.textContent = '（同步结果会出现在这里）';
    return;
  }
  const safeColor = color || 'inherit';
  syncResult.innerHTML = `<span style="color:${safeColor}">${message}</span>`;
};

clearBtn.addEventListener('click', () => {
  input.value = '';
  input.focus();
  setStatus('');
});

syncBtn.addEventListener('click', async () => {
  const text = input.value;
  if (!text.trim()) {
    alert('请先粘贴结构化文本');
    return;
  }
  const learnerName = ensureLearnerName();
  if (!learnerName) return;

  syncBtn.disabled = true;
  syncBtn.textContent = '生成中...';
  setStatus('⏳ 步骤 1/2：AI 解析中...', 'var(--ink-soft)');

  try {
    const convertRes = await fetch(`${WORKER_URL}/ai/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model: modelSelect.value })
    });
    const convertPayload = await readJson(convertRes);
    if (!convertPayload.ok) {
      throw new Error(`AI 转换失败: ${convertRes.status} ${convertPayload.text || ''}`.trim());
    }
    const convertResult = convertPayload.json;
    if (!convertResult.ok) {
      throw new Error(convertResult.error || 'AI 转换失败');
    }

    syncBtn.textContent = '同步中...';
    setStatus('⏳ 步骤 2/2：同步到 Notion 中...', 'var(--ink-soft)');
    const res = await fetch(`${WORKER_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...convertResult.data, 学习者: learnerName })
    });

    const syncPayload = await readJson(res);
    if (!syncPayload.ok) {
      throw new Error(`同步失败: ${res.status} ${syncPayload.text || ''}`.trim());
    }
    const result = syncPayload.json;

    if (result.ok) {
      setStatus(`✅ ${result.message}`, 'green');
      createFireworks();
    } else {
      throw new Error(result.error);
    }
  } catch (err) {
    setStatus(`❌ 同步失败: ${err.message}`, 'red');
  } finally {
    syncBtn.disabled = false;
    syncBtn.textContent = '生成并同步';
  }
});

function createFireworks() {
  const container = document.getElementById('fireworks');
  const rect = syncResult.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  for (let i = 0; i < 20; i++) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    spark.style.left = x + 'px';
    spark.style.top = y + 'px';
    spark.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;

    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 100;

    spark.style.setProperty('--x', Math.cos(angle) * dist + 'px');
    spark.style.setProperty('--y', Math.sin(angle) * dist + 'px');

    container.appendChild(spark);
    setTimeout(() => spark.remove(), 600);
  }
}

function adjustTextareaHeight() {
  const lineHeight = parseInt(getComputedStyle(input).lineHeight);
  const minHeight = 120;
  const maxHeight = 300;

  input.style.height = 'auto';
  const newHeight = Math.max(minHeight, Math.min(maxHeight, input.scrollHeight));
  input.style.height = newHeight + 'px';
}

if ('ontouchstart' in window) {
  let touchStartY = 0;
  let touchEndY = 0;

  document.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
  });

  document.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
    if (touchEndY - touchStartY > 100 && Math.abs(touchEndY - touchStartY) > 50) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  input.addEventListener('focus', () => {
    setTimeout(() => {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  });
}

input.addEventListener('input', adjustTextareaHeight);

window.addEventListener('resize', () => {
  setTimeout(adjustTextareaHeight, 100);
});

window.addEventListener('load', adjustTextareaHeight);

let isFormDirty = false;
input.addEventListener('input', () => {
  isFormDirty = true;
});

window.addEventListener('beforeunload', (e) => {
  if (isFormDirty && input.value.trim()) {
    e.preventDefault();
    e.returnValue = '';
  }
});

if (window.innerWidth > 768) {
  input.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      parseBtn.click();
    }
  });
}
