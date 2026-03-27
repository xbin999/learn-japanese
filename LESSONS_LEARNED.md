# 📚 项目经验教训总结

> 记录从零到线上踩过的坑，下次不再掉进去。

---

## ✅ 做对的事情（Keep）

1. **先写 REQUIREMENTS.md**  
n   每次改需求前先更新文档，避免“口头需求”导致的返工。

2. **配置分离 + 环境变量**  
   把 `NOTION_TOKEN`、`DATABASE_ID`、`FRONTEND_URL` 全部抽出来，本地用 `.dev.vars`，生产用 Cloudflare Dashboard，零硬编码。

3. **TDD 小步快跑**  
   用 `test_parse.js` 先把 INTERFACE.md 的金牌示例跑通，再改 Worker，保证重构不翻车。

4. **一开始就定目录规范**  
   先确定前后端边界与目录布局（public/server），后续改动成本最低、协作最清晰。

5. **CORS 前置处理**  
   Worker 层统一返回 `Access-Control-Allow-Origin`，避免浏览器拦截，前后端端口不同也能愉快联调。

6. **Notion 字段类型对齐**  
   先打印数据库 schema，再决定用 `rich_text` / `multi_select` / `select`，避免 400 validation_error。

---

## ⚠️ 踩过的坑（Problem & Solution）

| 现象 | 根因 | 解决 |
|----|----|----|
| 点击同步→Failed to fetch | 端口不同触发 CORS | Worker 统一加 `corsHeaders` |
| Notion 404 object_not_found | 数据库未分享给 Integration | 数据库右上角 `···` → Add connections → 选自己的 Integration |
| Notion 400 validation_error | 字段类型写错 | 把“主题”从 `rich_text` 改成 `multi_select`，缺失字段先注释 |
| 前端图片生成失败 | API 密钥硬编码 + 无降级 | 用环境变量注入，失败时提示用户手动复制分享链接 |
| 本地端口冲突 | 8080/8787 被占用 | `lsof -ti:8080 | xargs kill -9` 一键清 |

---

## 🎯 给下一次的 Checklist

- [ ] 新建 Notion Integration 后，**立即分享数据库**给它，再开始编码。  
- [ ] 任何“新字段”先确认数据库里是否存在，再写代码。  
- [ ] 前端 fetch 报错时，**先看 Network 面板**，确认是 CORS 还是业务 500。  
- [ ] 部署前跑一次 `test_parse.js`，确保金牌示例仍通过。  
- [ ] 把 `.dev.vars` 加入 `.gitignore`，避免密钥误提交。  

---

## 🌈 彩蛋：让产品“有温度”的小技巧

1. **小烟花庆祝**  
   同步成功后在屏幕中心放 30 个彩色火花，0.6s 消失，用户成就感瞬间拉满。

2. **和纸纹理背景**  
   用 1 行 SVG 实现低调纹理，比纯色更“手写笔记”的触感。

3. **墨迹扩散按钮**  
   `:hover` 时圆形遮罩从中心放大，模拟毛笔蘸墨，零 JS 纯 CSS。

4. **行号装饰**  
   `linear-gradient` 做 38px 宽竖条，让多行文本输入区像真笔记本。

---

## 📌 一句话总结
> **“先让需求落地，再让体验发光。”**  
> 功能跑通 → 测试覆盖 → 配置抽离 → 视觉惊喜，按顺序做，每一步都有可见成果，就不会焦虑。
