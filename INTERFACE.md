# AI 交互参考手册

本文件仅用于与 AI 交互时的提示与输出参考，不再作为工具需求与接口规范。

---

## 一、AI 输出 JSON 结构
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

---

## 二、字段含义速查
| 字段 | 含义 |
| --- | --- |
| title | 标题 |
| topic | 主题 |
| intent | 我想表达 |
| versions | 进化过程 |
| final | 最终定稿 |
| coreStructure | 本次核心结构 |
| improvement | 表达升级点 |
| errors | 错误记录 |
| vocab | 生词 |
| summary | 学习总结 |
| shareTitle | 分享标题 |

---

## 三、AI 提示模板
```
请把以下内容整理为 JSON，字段必须与指定结构一致，缺失字段用空字符串或空数组填充：
【JSON结构】{...}
【输入内容】
```

---

## 四、示例输出
```
{
  "title": "2026-03-25 表达喜欢的电影类型｜何度〜ても 的使用",
  "topic": "表达对某类电影的喜好 + 评价电影特点",
  "intent": "我喜欢像《海街diary》这样的电影。我觉得这是看多少次都不会腻的电影。",
  "versions": {
    "v1": "「海街diary」のような映画が好きです。何回を見ても嫌じゃない。",
    "v2": "「海街diary」のような映画が好きで、何度見ても飽きません。",
    "v3": "「海街diary」のような映画が好きです。何度見ても飽きない映画です。",
    "v4": "「海街diary」のような映画が好きです。何度見ても飽きない映画だと思います。"
  },
  "final": "「海街diary」のような映画が好きです。何度見ても飽きない映画だと思います。",
  "coreStructure": "何度見ても飽きない\n何度聞いてもいい\n何度行っても楽しい",
  "improvement": "1. 学会用「何度〜ても」表达“无论多少次都……”\n2. 使用「飽きない」表达“不腻”\n3. 用「〜と思います」表达个人感受和判断\n4. 从简单描述升级为“评价一种电影类型”",
  "errors": [
    {
      "name": "何回を見ても",
      "description": "错误用法",
      "correctPattern": "何度見ても / 何回見ても"
    },
    {
      "name": "嫌じゃない",
      "description": "语气不太自然",
      "correctPattern": "飽きない"
    }
  ],
  "vocab": [
    {
      "word": "飽きる",
      "reading": "あきる",
      "meaning": "厌倦、看腻、听腻",
      "example": "この曲は何度聞いても飽きません。"
    }
  ],
  "summary": "这次学会了一个很实用的表达结构：何度〜ても（无论多少次都……）",
  "shareTitle": "日语里表达“看多少次都不腻”的一个自然说法"
}
```
