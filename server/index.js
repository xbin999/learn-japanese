/**
 * Cloudflare Worker：接收前端解析结果 → 写入 Notion 数据库
 * 路由：POST /sync
 */
import { parseText } from './parse.js';

export default {
  async fetch(request, env) {
    // 统一 CORS 头：允许配置的前端地址调用
    const origin = request.headers.get('Origin');
    
    // 允许任何 localhost 端口或配置的生产域名
    let allowOrigin = origin;
    
    // 宽松的 CORS 策略：
    // 1. 本地开发 (localhost/127.0.0.1)
    // 2. 环境变量配置的 FRONTEND_URL
    // 3. Cloudflare Pages 自动生成的域名 (*.pages.dev)
    // 4. 自定义域名 (jp.mathmind.homes) - 显式添加
    
    const isLocal = origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'));
    const isLan = origin && (
      /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
      /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
      /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)
    );
    const isPagesDev = origin && origin.endsWith('.pages.dev');
    const isCustomDomain = origin && (origin === 'https://jp.mathmind.homes' || origin === 'http://jp.mathmind.homes');
    
    const allowedOrigins = [env.FRONTEND_URL].filter(Boolean);
    
    // 如果Origin不在白名单中，但符合我们的宽松规则，则允许它
    if (!allowedOrigins.includes(origin)) {
      if (isLocal || isLan || isPagesDev || isCustomDomain) {
        allowOrigin = origin;
      } else {
        // 如果都不匹配，才回退到默认
        allowOrigin = allowedOrigins[0] || ''; 
      }
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // 补充 GET 方法支持
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathname = normalizePath(url.pathname);
    
    // AI图片生成代理接口
    if (pathname === '/generate-image') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
      }
      try {
        const body = await request.json();
        const { prompt, aspect_ratio = '3:4' } = body;
        
        if (!prompt) {
          return Response.json({ ok: false, error: '缺少prompt参数' }, { status: 400, headers: corsHeaders });
        }
        
        // 调用AI图片生成API
        const imageResponse = await fetch('https://free-image-generation-api.xbin999.workers.dev', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.AI_API_KEY || 'mycru7-sopsyx-Fixnij'}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt, aspect_ratio })
        });

        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          throw new Error(`AI API错误: ${imageResponse.status} ${errorText}`);
        }

        // 获取图片blob
        const imageBlob = await imageResponse.blob();
        
        // 返回图片数据给前端
        return new Response(imageBlob, {
          headers: {
            ...corsHeaders,
            'Content-Type': imageBlob.type || 'image/jpeg'
          }
        });
        
      } catch (err) {
        console.error('AI图片生成错误:', err);
        return Response.json({ ok: false, error: err.message }, { status: 500, headers: corsHeaders });
      }
    }
    
    // Notion同步接口
    if (pathname === '/sync') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
      }
      try {
        const body = await request.json();
        const normalized = parseText(body);
        const learnerName = body.学习者 || body.learner || '';
        await createNotionPage({ ...normalized, 学习者: learnerName }, env);
        return Response.json({ ok: true, message: '已同步到 Notion！' }, { headers: corsHeaders });
      } catch (err) {
        console.error(err);
        return Response.json({ ok: false, error: err.message }, { status: 500, headers: corsHeaders });
      }
    }

    if (pathname === '/ai/convert') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
      }
      try {
        const body = await request.json();
        const text = (body && body.text ? String(body.text) : '').trim();
        if (!text) {
          return Response.json({ ok: false, error: '请输入结构化文本' }, { status: 400, headers: corsHeaders });
        }
        const model = (body && body.model ? String(body.model) : '').toLowerCase();
        const resolvedModel = model || (env.ZHIPU_API_KEY ? 'zhipu' : 'gemini');
        const prompt = buildInstruction(text);
        const data =
          resolvedModel === 'gemini'
            ? await requestGemini({ apiKey: env.GEMINI_API_KEY, prompt })
            : await requestZhipu({ apiKey: env.ZHIPU_API_KEY, prompt });
        const intentFallback = extractLabeledSection(text, '我想表达');
        if (intentFallback && !normalizeTextValue(data.intent)) {
          data.intent = intentFallback;
        }
        return Response.json({ ok: true, data, model: resolvedModel }, { headers: corsHeaders });
      } catch (err) {
        return Response.json({ ok: false, error: err.message }, { status: 500, headers: corsHeaders });
      }
    }

    // Notion 历史记录查询接口
    if (pathname === '/history') {
      if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
      }
      try {
        const limit = parseInt(url.searchParams.get('limit') || '10', 10);
        const cursor = url.searchParams.get('cursor');
        const title = url.searchParams.get('title');
        const startDate = url.searchParams.get('start_date');
        const endDate = url.searchParams.get('end_date');
        const learner = url.searchParams.get('learner');
        const data = await getNotionHistory(env, limit, cursor, title, startDate, endDate, learner);
        return Response.json(data, { headers: corsHeaders });
      } catch (err) {
        console.error(err);
        return Response.json({ ok: false, error: err.message }, { status: 500, headers: corsHeaders });
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};

function normalizePath(path) {
  if (path === '/api') return '/';
  if (path.startsWith('/api/')) return path.slice(4);
  return path;
}

async function getNotionHistory(env, limit, cursor, title, startDate, endDate, learner) {
  const { NOTION_TOKEN, DATABASE_ID } = env;
  if (!NOTION_TOKEN || !DATABASE_ID) {
    throw new Error('Missing NOTION_TOKEN or DATABASE_ID');
  }

  const queryBody = {
    page_size: limit,
    sorts: [
      {
        property: '日期',
        direction: 'descending'
      }
    ]
  };

  if (cursor) {
    queryBody.start_cursor = cursor;
  }

  const filters = [];

  if (title) {
    filters.push({
      property: '标题',
      title: {
        contains: title
      }
    });
  }

  if (startDate) {
    filters.push({
      property: '日期',
      date: {
        on_or_after: startDate
      }
    });
  }

  if (endDate) {
    filters.push({
      property: '日期',
      date: {
        on_or_before: endDate
      }
    });
  }

  if (learner) {
    filters.push({
      property: '学习者',
      select: {
        equals: learner
      }
    });
  }

  if (filters.length === 1) {
    queryBody.filter = filters[0];
  }

  if (filters.length > 1) {
    queryBody.filter = { and: filters };
  }

  const res = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify(queryBody)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion API ${res.status}: ${text}`);
  }

  const data = await res.json();
  
  const results = data.results.map(page => {
    const props = page.properties;
    return {
      id: page.id,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
      标题: getTextContent(props.标题),
      主题: getMultiSelect(props.主题),
      日期: getDate(props.日期),
      我想表达: getTextContent(props.我想表达),
      进化过程: getTextContent(props.进化过程),
      最终定稿: getTextContent(props.最终定稿),
      本次核心结构: getTextContent(props.本次核心结构),
      表达升级点: getTextContent(props.表达升级点),
      错误记录: getTextContent(props.错误记录),
      生词: getTextContent(props.生词),
      学习总结: getTextContent(props.学习总结),
      分享标题: getTextContent(props.分享标题),
      来源: getSelect(props.来源)
    };
  });

  return {
    results,
    next_cursor: data.next_cursor,
    has_more: data.has_more
  };
}

// 辅助函数：提取 Notion 属性值
function getTextContent(prop) {
  if (!prop) return '';
  if (prop.type === 'title' && prop.title && prop.title.length > 0) {
    return prop.title.map(t => t.plain_text).join('');
  }
  if (prop.type === 'rich_text' && prop.rich_text && prop.rich_text.length > 0) {
    return prop.rich_text.map(t => t.plain_text).join('');
  }
  return '';
}

function getMultiSelect(prop) {
  if (!prop || prop.type !== 'multi_select') return [];
  return prop.multi_select.map(item => item.name);
}

function getSelect(prop) {
  if (!prop || prop.type !== 'select' || !prop.select) return '';
  return prop.select.name;
}

function getDate(prop) {
  if (!prop || prop.type !== 'date' || !prop.date) return '';
  return prop.date.start;
}

async function createNotionPage(data, env) {
  const { NOTION_TOKEN, DATABASE_ID } = env;
  if (!NOTION_TOKEN || !DATABASE_ID) {
    throw new Error('Missing NOTION_TOKEN or DATABASE_ID');
  }

  const payload = {
    parent: { database_id: DATABASE_ID },
    properties: {
      标题: { title: [{ text: { content: data.标题 || '无标题' } }] },
      主题: { multi_select: data.主题 ? data.主题.split(/[,，]/).map(s => ({ name: s.trim() })) : [] },
      我想表达: { rich_text: [{ text: { content: data.我想表达 || '' } }] },
      进化过程: { rich_text: [{ text: { content: data.进化过程 || '' } }] },
      最终定稿: { rich_text: [{ text: { content: data.最终定稿 || '' } }] },
      本次核心结构: { rich_text: [{ text: { content: data.本次核心结构 || '' } }] },
      表达升级点: { rich_text: [{ text: { content: data.表达升级点 || '' } }] },
      错误记录: { rich_text: [{ text: { content: errorsToMarkdown(data.错误记录) } }] },
      生词: { rich_text: [{ text: { content: vocabToMarkdown(data.生词) } }] },
      学习总结: { rich_text: [{ text: { content: data.学习总结 || '' } }] },
      分享标题: { rich_text: [{ text: { content: data.分享标题 || '' } }] },
      日期: { date: { start: new Date().toISOString().slice(0, 10) } },
      来源: { select: { name: '同步' } },
      ...(data.学习者 ? { 学习者: { select: { name: data.学习者 } } } : {})
    }
  };

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion API ${res.status}: ${text}`);
  }
}

function errorsToMarkdown(list) {
  if (!list.length) return '';
  return list.map((e, i) =>
    `**错误${i + 1}**  
错误名称：${e['错误名称'] || ''}  
典型错误说明：${e['典型错误说明'] || ''}  
正确表达模式：${e['正确表达模式'] || ''}  
`
  ).join('\n');
}

function vocabToMarkdown(list) {
  if (!list.length) return '';
  return list.map((v, i) =>
    `**单词${i + 1}**  
词汇：${v['词汇'] || ''}  
读音：${v['读音'] || ''}  
中文解释：${v['中文解释'] || ''}  
例句：${v['例句'] || ''}  
`
  ).join('\n');
}

function buildInstruction(rawText) {
  return `请把下面“结构化文本”转换成 JSON，要求：
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
}

function normalizeTextValue(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item)).join('\n').trim();
  }
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function extractLabeledSection(text, label) {
  const raw = String(text || '');
  const startRegex = new RegExp(`——\\s*${label}\\s*——`);
  const startMatch = raw.match(startRegex);
  if (!startMatch) return '';
  const startIndex = startMatch.index + startMatch[0].length;
  const rest = raw.slice(startIndex);
  const endMatch = rest.match(/\n\s*——.+?——/);
  const endIndex = endMatch ? startIndex + endMatch.index : raw.length;
  const content = raw.slice(startIndex, endIndex).trim();
  return content;
}

function cleanJsonText(text) {
  return String(text || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function parseJsonStrict(text) {
  const cleaned = cleanJsonText(text);
  return JSON.parse(cleaned);
}

async function requestGemini({ apiKey, prompt }) {
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      { role: 'user', parts: [{ text: prompt }] }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API ${res.status}: ${text}`);
  }
  const data = await res.json();
  const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!outputText) {
    throw new Error('Gemini response empty');
  }
  return parseJsonStrict(outputText);
}

async function requestZhipu({ apiKey, prompt }) {
  if (!apiKey) {
    throw new Error('Missing ZHIPU_API_KEY');
  }
  const endpoint = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  const body = {
    model: 'glm-4-flash-250414',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2
  };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zhipu API ${res.status}: ${text}`);
  }
  const data = await res.json();
  const outputText = data?.choices?.[0]?.message?.content;
  if (!outputText) {
    throw new Error('Zhipu response empty');
  }
  return parseJsonStrict(outputText);
}
