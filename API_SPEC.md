# 接口规范

本文件用于定义工具侧的接口与字段契约，基于“AI 输出 JSON → 前端解析 → 后端同步Notion”的流程。

***

## 一、AI 输出 JSON（输入）

```
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
```

***

## 二、解析输出（工具内部统一结构）

```
{
  "标题": "",
  "主题": "",
  "我想表达": "",
  "进化过程": "",
  "最终定稿": "",
  "本次核心结构": "",
  "表达升级点": "",
  "错误记录": [{ "错误名称": "", "典型错误说明": "", "正确表达模式": "" }],
  "生词": [{ "词汇": "", "读音": "", "中文解释": "", "例句": "" }],
  "学习总结": "",
  "分享标题": ""
}
```

***

## 三、字段映射规则

| JSON 字段               | 内部字段   |
| --------------------- | ------ |
| title                 | 标题     |
| topic                 | 主题     |
| intent                | 我想表达   |
| versions              | 进化过程   |
| final                 | 最终定稿   |
| coreStructure         | 本次核心结构 |
| improvement           | 表达升级点  |
| errors.name           | 错误名称   |
| errors.description    | 典型错误说明 |
| errors.correctPattern | 正确表达模式 |
| vocab.word            | 词汇     |
| vocab.reading         | 读音     |
| vocab.meaning         | 中文解释   |
| vocab.example         | 例句     |
| summary               | 学习总结   |
| shareTitle            | 分享标题   |

进化过程字段拼接顺序：v1 → v2 → v3 → v4，缺失版本跳过。

***

## 四、接口定义

### 1) POST /sync

用途：将解析后的内部字段写入 Notion 数据库。

请求体：解析输出结构（内部字段）

成功响应：

```
{ "ok": true, "message": "已同步到 Notion！" }
```

失败响应：

```
{ "ok": false, "error": "错误信息" }
```

### 2) GET /history

用途：查询历史记录。

Query 参数：

| 参数          | 说明    |
| ----------- | ----- |
| limit       | 返回条数  |
| cursor      | 分页游标  |
| title       | 标题包含  |
| start\_date | 起始日期  |
| end\_date   | 结束日期  |
| learner     | 学习者昵称 |

响应：

```
{
  "results": [],
  "next_cursor": "",
  "has_more": true
}
```

***

## 五、Notion 字段映射

| Notion字段名 | Notion 字段类型  | 内部字段值    |
| --------- | ------------ | -------- |
| 标题        | Title        | 标题       |
| 主题        | Multi Select | 主题       |
| 我想表达      | Rich Text    | 我想表达     |
| 进化过程      | Rich Text    | 进化过程     |
| 最终定稿      | Rich Text    | 最终定稿     |
| 本次核心结构    | Rich Text    | 本次核心结构   |
| 表达升级点     | Rich Text    | 表达升级点    |
| 错误记录      | Rich Text    | 错误记录     |
| 生词        | Rich Text    | 生词       |
| 学习总结      | Rich Text    | 学习总结     |
| 分享标题      | Rich Text    | 分享标题     |
| 日期        | Date         | 当前系统日期   |
| 来源        | Select       | 固定值："同步" |
| 学习者       | Select       | 学习者      |

