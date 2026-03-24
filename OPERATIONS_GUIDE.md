# 🚀 项目运维操作指南

> 日常开发必备命令、快速参考、服务启动与排查

---

## 🎯 快速参考

### 🚀 一键启动
```bash
# 启动前端
python3 -m http.server 8080

# 启动后端
npx wrangler dev --port 8787 --local-protocol http
```
```bash
# 避免每次提示安装 wrangler
npm i -D wrangler
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

### 🌐 访问地址
- **前端应用**: http://localhost:8080
- **后端 API**: http://localhost:8787
- **分享页面**: http://localhost:8080/share.html
- **导出复盘**: http://localhost:8080/export.html

### 🧊 Trae sandbox 与刷新说明
- Trae sandbox 只是命令执行的包装器，不是热刷新服务
- 前端静态页面不会自动刷新，需要手动刷新浏览器
- 看到改动没生效时，用硬刷新：macOS 是 `⌘ + Shift + R`

## 📋 服务概览

本项目包含两个主要服务：
- **前端服务**: Python HTTP Server (端口 8080)
- **后端服务**: Cloudflare Wrangler (端口 8787)

---

## 🎯 日常操作命令

### 服务管理

#### 启动前端服务
```bash
# 启动前端开发服务器 (端口 8080)
cd /Users/yangbin/Documents/trae_projects/learn-japanese && python3 -m http.server 8080

# 或者使用简写
python3 -m http.server 8080
```

#### 启动后端服务
```bash
# 启动 Cloudflare Worker 开发服务器 (端口 8787)
cd /Users/yangbin/Documents/trae_projects/learn-japanese && npx wrangler dev --port 8787 --local-protocol http

# 或者使用简写
npx wrangler dev --port 8787 --local-protocol http
```

#### 同时启动两个服务
```bash
# 在新终端启动前端
python3 -m http.server 8080

# 在另一个新终端启动后端
npx wrangler dev --port 8787 --local-protocol http
```

### 停止服务

#### 停止指定端口的服务
```bash
# 停止 8080 端口的服务
lsof -ti:8080 | xargs kill -9

# 停止 8787 端口的服务
lsof -ti:8787 | xargs kill -9

# 一键停止所有相关服务
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:8787 | xargs kill -9 2>/dev/null || true
```

#### 查看服务状态
```bash
# 检查端口占用情况
lsof -i :8080
lsof -i :8787

# 或者使用 netstat
netstat -an | grep 8080
netstat -an | grep 8787
```

---

## 📦 Git 工作流程

### 日常开发流程
```bash
# 1. 查看当前状态
git status

# 2. 添加修改的文件
git add .
# 或者只添加特定文件
git add index.html parse.js

# 3. 提交代码 (遵循约定式提交)
git commit -m "feat: 添加图片生成功能"
git commit -m "fix: 修复解析器bug"
git commit -m "docs: 更新使用说明"

# 4. 推送到远程仓库
git push origin main
```

### 分支管理
```bash
# 创建新功能分支
git checkout -b feature/image-generation

# 切换到主分支
git checkout main

# 合并分支
git merge feature/image-generation

# 删除已合并的分支
git branch -d feature/image-generation
```

### 紧急修复流程
```bash
# 1. 创建热修复分支
git checkout -b hotfix/critical-bug

# 2. 修复问题并提交
git add .
git commit -m "fix: 紧急修复关键bug"

# 3. 合并到主分支
git checkout main
git merge hotfix/critical-bug

# 4. 推送到远程
git push origin main
```

---

## 🔧 项目迁移指南

### 迁移到新电脑

#### 1. 环境准备
```bash
# 安装 Node.js (推荐使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node

# 安装 Python3 (macOS 通常已预装)
python3 --version

# 安装 Wrangler CLI
npm install -g wrangler
```

#### 2. 克隆项目
```bash
# 克隆仓库
git clone https://github.com/your-username/learn-japanese.git
cd learn-japanese

# 安装依赖
npm install
```

#### 3. 配置环境变量
```bash
# 创建本地配置文件
cp .env.example .dev.vars

# 编辑配置文件，填入你的 API 密钥等
nano .dev.vars
```

#### 4. 验证环境
```bash
# 运行测试
node tests/test_parse.js

# 启动服务测试
python3 -m http.server 8080
# 在浏览器访问 http://localhost:8080
```

### 部署到生产环境

#### 1. 配置生产环境变量
```bash
# 在 Cloudflare Dashboard 设置环境变量
wrangler secret put NOTION_TOKEN
wrangler secret put DATABASE_ID
```

#### 2. 部署到 Cloudflare
```bash
# 部署 Worker
npx wrangler deploy

# 查看部署状态
npx wrangler tail
```

---

## 🚨 常见问题排查

### 端口被占用
```bash
# 错误：Address already in use
# 解决：找到占用进程并杀死
lsof -ti:8080 | xargs kill -9
```

### 前端无法连接后端
```bash
# 检查 CORS 配置
# 确保 wrangler 启动时包含 --local-protocol http
npx wrangler dev --port 8787 --local-protocol http
```

### Notion API 错误
```bash
# 检查环境变量
echo $NOTION_TOKEN
echo $DATABASE_ID

# 验证数据库连接
node tests/test_parse.js
```

### Git 冲突解决
```bash
# 拉取最新代码
git pull origin main

# 如果有冲突，手动解决后
git add .
git commit -m "resolve: 解决合并冲突"
git push origin main
```

---

## 📱 快捷命令别名

添加到 `~/.bashrc` 或 `~/.zshrc`：
```bash
# 项目快捷命令
alias lj-start='cd /Users/yangbin/Documents/trae_projects/learn-japanese && python3 -m http.server 8080 &'
alias lj-worker='cd /Users/yangbin/Documents/trae_projects/learn-japanese && npx wrangler dev --port 8787 --local-protocol http'
alias lj-stop='lsof -ti:8080 | xargs kill -9; lsof -ti:8787 | xargs kill -9'
alias lj-status='lsof -i :8080; lsof -i :8787'

# Git 快捷命令
alias gs='git status'
alias ga='git add .'
alias gc='git commit -m'
alias gp='git push origin main'
alias gl='git log --oneline -10'
```

---

## 🎨 小贴士

1. **服务启动后**
   - 前端访问：http://localhost:8080
   - 后端 API：http://localhost:8787

2. **开发建议**
   - 保持两个服务同时运行
   - 经常提交代码，小步快跑
   - 测试通过后再推送

3. **监控日志**
   - 前端：查看终端输出
   - 后端：`npx wrangler tail`

---

*最后更新：2026年3月7日*
*适用于：learn-japanese 项目*
