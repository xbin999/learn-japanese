
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const cursor = url.searchParams.get('cursor');
  const title = url.searchParams.get('title');

  // 处理 CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Expose-Headers': 'X-Next-Cursor, X-Has-More'
  };

  try {
    const { NOTION_TOKEN, DATABASE_ID } = env;
    if (!NOTION_TOKEN || !DATABASE_ID) {
      throw new Error('Missing NOTION_TOKEN or DATABASE_ID');
    }

    // 构建查询请求体
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

    // 添加标题过滤
    if (title) {
      queryBody.filter = {
        property: '标题',
        title: {
          contains: title
        }
      };
    }

    // 调用 Notion API 查询数据库
    // 注意：查询数据库使用的是 POST 方法
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

    // 转换 Notion 数据为前端可用格式
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

    return Response.json({
      results,
      next_cursor: data.next_cursor,
      has_more: data.has_more
    }, { headers: corsHeaders });

  } catch (err) {
    console.error('History query error:', err);
    return Response.json({ ok: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

// 处理 OPTIONS 请求
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
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
