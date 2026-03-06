/**
 * Cloudflare Pages Function：接收前端解析结果 → 写入 Notion 数据库
 * 路由：POST /sync
 */

// 处理 CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // 允许跨域（如果本地开发需要）
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    
    // 验证环境变量
    const { NOTION_TOKEN, DATABASE_ID } = env;
    if (!NOTION_TOKEN || !DATABASE_ID) {
      throw new Error('Missing NOTION_TOKEN or DATABASE_ID');
    }

    // 构建 Notion 请求体
    const payload = {
      parent: { database_id: DATABASE_ID },
      properties: {
        标题: { title: [{ text: { content: body.标题 || '无标题' } }] },
        主题: { multi_select: body.主题 ? body.主题.split(/[,，]/).map(s => ({ name: s.trim() })) : [] },
        我想表达: { rich_text: [{ text: { content: body.我想表达 || '' } }] },
        进化过程: { rich_text: [{ text: { content: body.进化过程 || '' } }] },
        最终定稿: { rich_text: [{ text: { content: body.最终定稿 || '' } }] },
        本次核心结构: { rich_text: [{ text: { content: body.本次核心结构 || '' } }] },
        表达升级点: { rich_text: [{ text: { content: body.表达升级点 || '' } }] },
        错误记录: { rich_text: [{ text: { content: errorsToMarkdown(body.错误记录 || []) } }] },
        生词: { rich_text: [{ text: { content: vocabToMarkdown(body.生词 || []) } }] },
        学习总结: { rich_text: [{ text: { content: body.学习总结 || '' } }] },
        分享标题: { rich_text: [{ text: { content: body.分享标题 || '' } }] },
        日期: { date: { start: new Date().toISOString().slice(0, 10) } },
        来源: { select: { name: '同步' } }
      }
    };

    // 调用 Notion API
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

    return Response.json({ ok: true, message: '已同步到 Notion！' }, { headers: corsHeaders });

  } catch (err) {
    console.error('Sync error:', err);
    return Response.json({ ok: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

// 辅助函数
function errorsToMarkdown(list) {
  if (!list || !list.length) return '';
  return list.map((e, i) =>
    `**错误${i + 1}**  
错误名称：${e['错误名称'] || ''}  
典型错误说明：${e['典型错误说明'] || ''}  
正确表达模式：${e['正确表达模式'] || ''}  
`
  ).join('\n');
}

function vocabToMarkdown(list) {
  if (!list || !list.length) return '';
  return list.map((v, i) =>
    `**单词${i + 1}**  
词汇：${v['词汇'] || ''}  
读音：${v['读音'] || ''}  
中文解释：${v['中文解释'] || ''}  
例句：${v['例句'] || ''}  
`
  ).join('\n');
}
