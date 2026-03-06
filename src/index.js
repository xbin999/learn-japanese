/**
 * Cloudflare Worker：接收前端解析结果 → 写入 Notion 数据库
 * 路由：POST /sync
 */
export default {
  async fetch(request, env) {
    // 统一 CORS 头：允许配置的前端地址调用
    const origin = request.headers.get('Origin');
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:8081',
      env.FRONTEND_URL
    ].filter(Boolean); // 过滤掉 undefined/null
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    // AI图片生成代理接口
    if (url.pathname === '/generate-image') {
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
      try {
        const body = await request.json();
        await createNotionPage(body, env);
        return Response.json({ ok: true, message: '已同步到 Notion！' }, { headers: corsHeaders });
      } catch (err) {
        console.error(err);
        return Response.json({ ok: false, error: err.message }, { status: 500, headers: corsHeaders });
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};

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