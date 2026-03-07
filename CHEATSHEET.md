# 🎯 快速参考卡片

## 日常开发必用命令

### 🚀 一键启动
```bash
# 启动前端
python3 -m http.server 8080

# 启动后端
npx wrangler dev --port 8787 --local-protocol http
```

### ⏹️ 一键停止
```bash
# 停止所有服务
lsof -ti:8080 | xargs kill -9; lsof -ti:8787 | xargs kill -9
```

### 📊 查看状态
```bash
# 检查服务状态
lsof -i :8080; lsof -i :8787
```

### 📦 Git 快速提交
```bash
git add . && git commit -m "feat: 描述" && git push origin main
```

---

## 🌐 访问地址
- **前端应用**: http://localhost:8080
- **后端 API**: http://localhost:8787
- **分享页面**: http://localhost:8080/share.html

---

## 🆘 常见问题

| 问题 | 解决命令 |
|------|----------|
| 端口被占用 | `lsof -ti:8080 \| xargs kill -9` |
| 服务无响应 | 重启服务 |
| Git 冲突 | `git pull origin main` 后手动解决 |
| 404 错误 | 检查文件路径是否正确 |

---

## 📋 快捷别名（可选）
复制到 `~/.zshrc`：
```bash
alias lj='cd /Users/yangbin/Documents/trae_projects/learn-japanese'
alias lj-start='python3 -m http.server 8080 &'
alias lj-stop='lsof -ti:8080 | xargs kill -9; lsof -ti:8787 | xargs kill -9'
alias gs='git status'
alias gc='git commit -m'
```