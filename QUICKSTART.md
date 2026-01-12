# 快速开始指南

## 5分钟快速启动

### 方法一：使用Docker（最简单）
```bash
# 1. 启动所有服务
docker-compose up -d

# 2. 访问应用
# 前端：http://localhost:3000
# 后端API：http://localhost:3001

# 3. 停止服务
docker-compose down
```

### 方法二：手动启动（开发模式）
```bash
# 1. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 2. 配置环境
cp backend/.env.example backend/.env

# 3. 启动数据库（需要Docker）
docker-compose up postgres -d

# 4. 启动后端
cd backend && npm run dev

# 5. 启动前端（新终端）
cd frontend && npm run dev

# 6. 访问 http://localhost:3000
```

### 方法三：使用启动脚本
```bash
# 一键启动所有服务
./start-dev.sh
```

## 系统功能概览

### 1. 用户注册和登录
- 注册新用户并填写健康信息
- 登录后进入仪表板
- 查看个人风险评估

### 2. 日常对话系统
- 与AI进行自然对话
- 实时分析认知指标
- 记录情绪和参与度
- 生成对话报告

### 3. 认知评估工具
- **快速评估**：7个核心问题（5-10分钟）
- **MMSE评估**：标准化简易精神状态检查
- **MoCA评估**：蒙特利尔认知评估
- 自动评分和风险分级

### 4. 数据分析仪表板
- 认知分数趋势图
- 各领域表现分析
- 对话频率统计
- 个性化建议

### 5. 个人资料管理
- 基本信息维护
- 健康数据更新
- 风险评估查看
- 账户安全设置

## 测试账户

系统预置了一个测试账户：
- **邮箱**: zhang@example.com
- **密码**: 需要查看数据库初始化脚本中的哈希值

或者您可以注册新账户。

## API快速测试

使用curl测试API：

```bash
# 健康检查
curl http://localhost:3001/health

# 用户注册
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "测试",
    "lastName": "用户",
    "dateOfBirth": "1960-01-01",
    "gender": "male"
  }'

# 用户登录
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 开发命令

### 后端开发
```bash
cd backend

# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 运行生产版本
npm start

# 运行测试
npm test

# 代码检查
npm run lint
```

### 前端开发
```bash
cd frontend

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 代码格式化
npm run format

# 代码检查
npm run lint
```

### 数据库管理
```bash
# 启动数据库
docker-compose up postgres -d

# 进入数据库命令行
docker-compose exec postgres psql -U postgres alzheimer_prevention

# 查看数据库日志
docker-compose logs postgres

# 备份数据库
docker-compose exec postgres pg_dump -U postgres alzheimer_prevention > backup.sql
```

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :3001
   lsof -i :5432

   # 修改端口（在docker-compose.yml或.env中）
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose ps

   # 查看数据库日志
   docker-compose logs postgres

   # 重启数据库
   docker-compose restart postgres
   ```

3. **依赖安装失败**
   ```bash
   # 清除npm缓存
   npm cache clean --force

   # 删除node_modules重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **前端无法连接后端**
   ```bash
   # 检查后端是否运行
   curl http://localhost:3001/health

   # 检查CORS配置
   # 在backend/.env中设置CORS_ORIGIN
   ```

### 日志查看
```bash
# 后端日志
cd backend && npm run dev  # 在终端中查看

# 前端日志
cd frontend && npm run dev  # 在终端中查看

# 数据库日志
docker-compose logs postgres

# Docker容器日志
docker-compose logs
```

## 下一步

### 1. 自定义配置
- 修改`backend/.env`文件配置数据库连接
- 更新`frontend/vite.config.ts`中的代理设置
- 调整`docker-compose.yml`中的服务配置

### 2. 添加新功能
- 在`backend/src/models/`中添加新数据模型
- 在`backend/src/services/`中实现业务逻辑
- 在`frontend/src/pages/`中创建新页面
- 在`frontend/src/components/`中创建可复用组件

### 3. 部署到生产环境
1. 配置生产环境变量
2. 构建Docker镜像
3. 设置SSL证书
4. 配置域名和反向代理
5. 设置监控和告警

### 4. 数据分析和优化
1. 收集用户使用数据
2. 分析系统性能指标
3. 优化算法准确率
4. 改进用户体验

## 获取帮助

1. **查看详细文档**: 阅读[README.md](README.md)
2. **检查代码结构**: 查看各目录的代码注释
3. **运行测试**: 使用测试脚本验证功能
4. **查看日志**: 分析运行时的错误信息

## 系统架构图

```
用户浏览器
    ↓
前端 (React) ←→ 后端 (Node.js/Express)
    ↓                    ↓
HTTP请求          业务逻辑处理
    ↓                    ↓
API响应          数据库操作 (PostgreSQL)
    ↓                    ↓
页面渲染          数据持久化
```

## 技术特点

- **全TypeScript**: 类型安全，更好的开发体验
- **模块化设计**: 易于维护和扩展
- **响应式界面**: 支持桌面和移动设备
- **实时分析**: 对话过程中实时计算认知指标
- **数据可视化**: 直观展示趋势和变化
- **容器化部署**: 一键部署，环境一致

---

**提示**: 这是一个完整的全栈应用，包含了从数据库到前端的完整实现。您可以根据需要调整和扩展功能。