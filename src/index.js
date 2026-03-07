/**
 * Cloudflare Worker：接收前端解析结果 → 写入 Notion 数据库
 * 路由：POST /sync
 */
export default {
  async fetch(request, env) {
    // 统一 CORS 头：允许配置的前端地址调用
    const origin = request.headers.get('Origin');
    
    // 允许任何 localhost 端口或配置的生产域名
    let allowOrigin = origin;
    
    // 如果不是本地开发环境，需要严格检查 Origin
    // 但为了本地开发方便，我们允许 localhost/127.0.0.1 及其任意端口
    const isLocal = origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'));
    const allowedOrigins = [env.FRONTEND_URL].filter(Boolean);
    
    if (!isLocal && !allowedOrigins.includes(origin)) {
      allowOrigin = allowedOrigins[0] || ''; // 如果不匹配，回退到默认允许的域名（如果没有配置则为空）
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
    
    // AI图片生成代理接口
    if (url.pathname === '/generate-image') {
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
    if (url.pathname === '/sync') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
      }
      try {
        const body = await request.json();
        await createNotionPage(body, env);
        return Response.json({ ok: true, message: '已同步到 Notion！' }, { headers: corsHeaders });
      } catch (err) {
        console.error(err);
        return Response.json({ ok: false, error: err.message }, { status: 500, headers: corsHeaders });
      }
    }

    // Notion 历史记录查询接口
    if (url.pathname === '/history') {
      if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
      }
      try {
        const limit = parseInt(url.searchParams.get('limit') || '10', 10);
        const cursor = url.searchParams.get('cursor');
        const title = url.searchParams.get('title');
        const data = await getNotionHistory(env, limit, cursor, title);
        return Response.json(data, { headers: corsHeaders });
      } catch (err) {
        console.error(err);
        return Response.json({ ok: false, error: err.message }, { status: 500, headers: corsHeaders });
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};

async function getNotionHistory(env, limit, cursor, title) {
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

  if (title) {
    queryBody.filter = {
      property: '标题',
      title: {
        contains: title
      }
    };
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
      来源: { select: { name: '同步' } }
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