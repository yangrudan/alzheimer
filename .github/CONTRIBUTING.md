# 贡献指南

感谢您有兴趣为阿兹海默预防对话系统做出贡献！以下是参与贡献的指南。

## 行为准则

请尊重所有贡献者，保持友好和专业的交流环境。

## 如何贡献

### 报告Bug
1. 使用GitHub Issues报告bug
2. 提供详细的bug描述和重现步骤
3. 包括环境信息和相关日志

### 请求功能
1. 使用GitHub Issues提出功能请求
2. 描述功能的使用场景和价值
3. 如果有的话，提供设计思路或参考

### 提交代码
1. Fork项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

## 开发环境设置

### 前提条件
- Node.js 18+
- PostgreSQL 15+ (或Docker)
- Git

### 设置步骤
```bash
# 1. Fork并克隆仓库
git clone https://github.com/YOUR-USERNAME/alzheimer.git
cd alzheimer

# 2. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 3. 配置环境
cp backend/.env.example backend/.env
# 编辑.env文件配置数据库连接

# 4. 启动数据库
docker-compose up postgres -d

# 5. 启动开发服务器
cd backend && npm run dev
cd ../frontend && npm run dev
```

## 代码规范

### TypeScript
- 使用严格模式 (`strict: true`)
- 为所有函数和组件添加类型注解
- 避免使用`any`类型

### 代码风格
- 使用2个空格缩进
- 使用单引号
- 行尾添加分号
- 最大行长度：100个字符

### 提交消息
使用约定式提交格式：
```
类型(范围): 描述

正文（可选）

脚注（可选）
```

类型包括：
- `feat`: 新功能
- `fix`: bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

## 测试

### 运行测试
```bash
# 后端测试
cd backend && npm test

# 前端测试
cd frontend && npm test
```

### 测试覆盖率
确保新代码有适当的测试覆盖率：
- 核心业务逻辑：≥80%
- 工具函数：≥70%
- 组件：≥60%

## 文档

### 更新文档
- 添加新功能时更新README
- 更新API文档（如果修改了API）
- 添加代码注释说明复杂逻辑

### 文档格式
- 使用Markdown格式
- 添加适当的标题层级
- 包含代码示例
- 添加相关链接

## Pull Request流程

### 创建PR前
1. 确保代码通过所有测试
2. 更新相关文档
3. 遵循代码规范
4. 添加适当的测试

### PR描述
PR描述应包含：
1. 更改的目的
2. 相关Issue链接
3. 测试结果
4. 截图（如果适用）

### 代码审查
- 至少需要一个维护者批准
- 解决所有审查意见
- 确保CI通过

## 项目结构

```
alzheimer/
├── backend/          # Node.js后端
│   ├── src/
│   │   ├── config/    # 配置文件
│   │   ├── models/    # 数据模型
│   │   ├── routes/    # API路由
│   │   ├── services/  # 业务逻辑
│   │   └── utils/     # 工具函数
│   └── tests/        # 后端测试
├── frontend/         # React前端
│   ├── src/
│   │   ├── components/ # 可复用组件
│   │   ├── pages/     # 页面组件
│   │   ├── hooks/     # 自定义Hook
│   │   └── utils/     # 工具函数
│   └── tests/        # 前端测试
└── docs/            # 项目文档
```

## 分支策略

- `main`: 生产就绪代码
- `develop`: 开发分支
- `feature/*`: 功能开发分支
- `bugfix/*`: bug修复分支
- `release/*`: 发布准备分支

## 发布流程

1. 从`develop`创建`release/*`分支
2. 进行最终测试和bug修复
3. 合并到`main`分支
4. 创建Git标签
5. 更新CHANGELOG

## 获取帮助

- 查看[README.md](../README.md)获取项目概述
- 查看[QUICKSTART.md](../QUICKSTART.md)获取快速开始指南
- 在GitHub Issues中提问
- 查看现有代码和文档

## 许可证

通过贡献代码，您同意您的贡献将根据项目的MIT许可证进行许可。