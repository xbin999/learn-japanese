# 🚨 常见问题排查指南

## 1. HTTP服务器400错误

**现象**: `code 400, message Bad request version ('zz\x13\x01\x13\x02...')`

**原因**: 客户端尝试通过HTTPS访问，但Python HTTP服务器只支持HTTP

**解决**: 
- 确保访问 `http://localhost:8080` (不是 https://)
- 清除浏览器缓存和HSTS设置
- 检查是否有浏览器插件强制HTTPS

**验证**:
```bash
# 测试HTTP访问
curl http://localhost:8080

# 检查端口状态
lsof -i :8080
```

## 2. 端口被占用

**现象**: `Address already in use`

**解决**:
```bash
# 找到占用进程
lsof -ti:8080

# 强制终止
lsof -ti:8080 | xargs kill -9
```

## 3. CORS错误

**现象**: `Failed to fetch` 或 `CORS policy`

**解决**: 确保后端服务已启动并包含CORS头
```bash
# 启动后端服务
npx wrangler dev --port 8787 --local-protocol http
```

## 4. 历史记录加载失败

**现象**: `Failed to construct 'URL': Invalid URL`

**原因**: WORKER_URL配置问题

**解决**: 检查config.js配置，确保正确处理空字符串情况

## 5. 服务启动顺序

**推荐顺序**:
1. 先启动后端: `npx wrangler dev --port 8787 --local-protocol http`
2. 再启动前端: `python3 -m http.server 8080`
3. 访问: `http://localhost:8080`

## 6. 环境变量问题

**检查**:
```bash
# 验证环境变量
echo $NOTION_TOKEN
echo $DATABASE_ID

# 测试API连接
node tests/test_parse.js
```

## 🔧 快速重启命令

```bash
# 一键停止所有服务
lsof -ti:8080 | xargs kill -9; lsof -ti:8787 | xargs kill -9

# 重新启动
python3 -m http.server 8080 &
npx wrangler dev --port 8787 --local-protocol http
```