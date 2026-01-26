# 阿兹海默预防对话系统

通过日常对话进行阿兹海默症的预防和预判的智能系统。

## 项目概述

这是一个全栈应用，通过自然对话监测用户的认知健康状态，结合标准化认知评估工具，提供个性化的预防建议和风险评估。

### 核心功能

1. **日常对话监测** - 通过自然对话分析认知指标
2. **认知评估** - 支持MMSE、MoCA等标准化评估
3. **风险评估** - 基于多维度数据评估认知衰退风险
4. **趋势分析** - 可视化展示认知健康变化趋势
5. **个性化建议** - 提供针对性的预防和干预建议

## 技术栈

### 后端 (Node.js + TypeScript)
- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: PostgreSQL + Sequelize ORM
- **认证**: JWT + bcrypt
- **实时通信**: Socket.IO
- **日志**: Winston
- **验证**: Joi

### 前端 (React + TypeScript)
- **框架**: React 18 + TypeScript
- **路由**: React Router 6
- **样式**: Tailwind CSS
- **图表**: Recharts
- **表单**: React Hook Form + Zod
- **通知**: React Hot Toast
- **图标**: Lucide React

### 基础设施
- **容器化**: Docker + Docker Compose
- **数据库**: PostgreSQL 15
- **缓存**: Redis (可选)
- **Web服务器**: Nginx

## 快速开始

### 前提条件
- Node.js 18+
- PostgreSQL 15+
- Docker 和 Docker Compose (可选)

### 使用Docker运行 (推荐)

1. 克隆项目
```bash
git clone <repository-url>
cd alzheimer
```

2. 启动所有服务
```bash
docker-compose up -d
```

3. 访问应用
- 前端: http://localhost:3000
- 后端API: http://localhost:3001
- 数据库: localhost:5432

### 手动安装

#### 后端设置
```bash
cd backend
npm install
cp .env.example .env
# 编辑.env文件配置数据库等信息
npm run dev
```

#### 前端设置
```bash
cd frontend
npm install
npm run dev
```

#### 数据库设置
```bash
# 创建数据库
createdb alzheimer_prevention

# 导入表结构
psql -d alzheimer_prevention -f database/init.sql
```

## 项目结构

```
alzheimer/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # API路由
│   │   ├── services/       # 业务逻辑
│   │   ├── middleware/     # 中间件
│   │   └── utils/          # 工具函数
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义Hook
│   │   ├── services/      # API服务
│   │   ├── types/         # TypeScript类型
│   │   └── utils/         # 工具函数
│   └── package.json
├── database/               # 数据库脚本
├── docker-compose.yml      # Docker编排
└── README.md              # 项目文档
```

## API文档

### 认证相关
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取用户信息
- `PUT /api/users/profile` - 更新用户信息

### 对话相关
- `POST /api/conversations` - 创建新对话
- `GET /api/conversations/user/:userId` - 获取用户对话列表
- `POST /api/conversations/:conversationId/messages` - 发送消息
- `POST /api/conversations/:conversationId/end` - 结束对话并分析
- `GET /api/conversations/:conversationId/messages` - 获取对话消息
- `POST /api/conversations/upload` - **新增：上传智能音响对话记录并分析** 📱
  - 支持智能音响设备批量上传对话记录
  - **支持多种格式**：标准格式和MoCA认知评估格式
  - 自动进行认知分析和评分
  - 详细文档：[智能音响对话上传API](docs/API_CONVERSATION_UPLOAD.md)
  - MoCA格式指南：[MoCA格式上传指南](docs/MOCA_FORMAT_GUIDE.md)

### 评估相关
- `POST /api/assessments` - 创建认知评估
- `GET /api/assessments/user/:userId` - 获取用户评估历史
- `POST /api/assessments/quick` - 快速认知评估
- `GET /api/assessments/templates/:type` - 获取评估模板

### 分析相关
- `GET /api/analytics/overview` - 系统概览数据
- `GET /api/analytics/user/:userId/detailed` - 用户详细分析
- `GET /api/analytics/trends/cognitive` - 认知趋势分析

## 认知评估算法

### 对话分析指标
1. **词汇复杂度** - 词汇多样性和丰富度
2. **响应时间** - 思考和反应速度
3. **情感分析** - 情绪状态识别
4. **连贯性评分** - 逻辑和结构连贯性
5. **记忆引用** - 对过去事件的回忆频率

### 风险评估模型
基于以下因素计算风险等级：
- 年龄因素
- 家族病史
- 教育程度
- 当前认知分数
- 历史趋势变化

### 评估标准
- **正常**: 认知分数 ≥ 80%
- **轻度风险**: 60% ≤ 认知分数 < 80%
- **中度风险**: 40% ≤ 认知分数 < 60%
- **高风险**: 认知分数 < 40%

## 部署指南

### 生产环境配置

1. **环境变量配置**
```bash
# 后端 .env.production
NODE_ENV=production
PORT=3001
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=alzheimer_production
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-secure-jwt-secret
CORS_ORIGIN=https://your-domain.com
```

2. **数据库备份**
```bash
# 定期备份
pg_dump alzheimer_production > backup_$(date +%Y%m%d).sql

# 恢复备份
psql alzheimer_production < backup_file.sql
```

3. **SSL配置**
```nginx
# nginx SSL配置
ssl_certificate /path/to/cert.pem;
ssl_certificate_key /path/to/key.pem;
ssl_protocols TLSv1.2 TLSv1.3;
```

### 监控和日志

1. **应用日志**
```bash
# 查看后端日志
docker logs alzheimer-backend

# 查看前端日志
docker logs alzheimer-frontend
```

2. **数据库监控**
```sql
-- 监控活跃连接
SELECT count(*) FROM pg_stat_activity;

-- 监控表大小
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 开发指南

### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint配置
- 使用Prettier格式化代码
- 提交前运行测试

### 测试
```bash
# 运行后端测试
cd backend
npm test

# 运行前端测试
cd frontend
npm test
```

### 数据库迁移
```bash
# 创建迁移文件
npx sequelize-cli migration:generate --name migration-name

# 运行迁移
npx sequelize-cli db:migrate

# 回滚迁移
npx sequelize-cli db:migrate:undo
```

## 安全考虑

### 数据保护
- 所有密码使用bcrypt哈希存储
- 敏感数据加密存储
- 定期数据备份
- 访问日志记录

### API安全
- JWT认证和授权
- 请求速率限制
- SQL注入防护
- XSS攻击防护
- CORS配置

### 合规性
- 用户数据隐私保护
- 医疗数据安全标准
- 数据访问审计
- 用户同意管理

## 上传到GitHub

### 快速上传步骤
```bash
# 1. 初始化Git仓库（如果尚未初始化）
git init

# 2. 添加所有文件
git add .

# 3. 提交初始版本
git commit -m "feat: 初始版本 - 阿兹海默预防对话系统"

# 4. 重命名主分支（如果需要）
git branch -M main

# 5. 在GitHub上创建新仓库（不要初始化文件）
#    访问 https://github.com/new
#    仓库名: alzheimer
#    描述: 通过日常对话进行阿兹海默症预防和预判的智能系统

# 6. 添加远程仓库并推送
git remote add origin https://github.com/YOUR-USERNAME/alzheimer.git
git push -u origin main
```

### 使用提供的脚本
```bash
# 运行Git设置脚本
./setup-git.sh

# 然后按照脚本输出的步骤操作
```

## 贡献指南

详细贡献指南请查看 [CONTRIBUTING.md](.github/CONTRIBUTING.md)

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 支持

如有问题或建议，请：
1. 查看 [Issues](https://github.com/your-repo/issues)
2. 提交新的Issue
3. 联系维护团队

## 致谢

- 感谢所有贡献者
- 基于医学研究和认知心理学原理
- 参考了MMSE和MoCA等标准化评估工具

---

**重要提示**: 本系统为辅助工具，不能替代专业医疗诊断。如有健康问题，请咨询专业医生。