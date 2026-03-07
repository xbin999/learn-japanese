# 📁 推荐的项目目录结构

## 🎯 核心理念：按功能组织，不是按文件类型

```
learn-japanese/
├── 📁 src/                      # 源代码目录
│   ├── 📁 components/           # 可复用的组件
│   │   ├── image-generator.js
│   │   ├── parse-engine.js
│   │   └── share-button.js
│   ├── 📁 utils/                # 工具函数
│   │   ├── config.js
│   │   ├── history-client.js
│   │   └── api-client.js
│   └── 📁 styles/               # 样式文件
│       └── main.css
│
├── 📁 tests/                    # 测试文件
│   ├── 📁 unit/                 # 单元测试
│   ├── 📁 integration/          # 集成测试
│   └── 📁 e2e/                  # 端到端测试
│
├── 📁 public/                   # 静态资源
│   ├── 📁 images/
│   ├── 📁 fonts/
│   └── index.html
│
├── 📁 functions/                # 云函数（特殊需求）
├── 📁 docs/                     # 文档
└── 📁 config/                   # 配置文件
```

## 🚀 渐进式改进计划

### Phase 1: 快速整理（现在就能做）
- ✅ 测试文件已经移到 tests/ 目录
- 🔄 把核心功能文件按类型分组

### Phase 2: 模块化（等你觉得需要时）
- 创建 src/components/ 目录
- 把可复用的功能提取成组件

### Phase 3: 工程化（项目变大后）
- 添加构建工具
- 引入模块化系统

## 💡 记住：YAGNI 原则

**You Aren't Gonna Need It** - 不需要过度设计！

现在的结构对于个人项目来说已经很好了。只有当项目真正需要更复杂的结构时，才考虑进一步重构。