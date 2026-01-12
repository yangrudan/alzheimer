#!/bin/bash

echo "=== 阿兹海默预防对话系统开发环境启动 ==="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数：打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

# 检查必要工具
print_message "1. 检查必要工具..." "$YELLOW"
check_tool() {
    if command -v $1 &> /dev/null; then
        print_message "  ✓ $1 已安装" "$GREEN"
        return 0
    else
        print_message "  ✗ $1 未安装" "$RED"
        return 1
    fi
}

check_tool node
check_tool npm
check_tool docker
check_tool docker-compose

echo ""

# 创建环境配置文件
print_message "2. 配置环境..." "$YELLOW"
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    print_message "  ✓ 创建后端环境配置文件" "$GREEN"
else
    print_message "  ✓ 后端环境配置文件已存在" "$GREEN"
fi

# 安装依赖
print_message "3. 安装依赖..." "$YELLOW"

# 后端依赖
if [ ! -d "backend/node_modules" ]; then
    print_message "  安装后端依赖..." "$YELLOW"
    cd backend && npm install
    if [ $? -eq 0 ]; then
        print_message "  ✓ 后端依赖安装成功" "$GREEN"
    else
        print_message "  ✗ 后端依赖安装失败" "$RED"
        exit 1
    fi
    cd ..
else
    print_message "  ✓ 后端依赖已安装" "$GREEN"
fi

# 前端依赖
if [ ! -d "frontend/node_modules" ]; then
    print_message "  安装前端依赖..." "$YELLOW"
    cd frontend && npm install
    if [ $? -eq 0 ]; then
        print_message "  ✓ 前端依赖安装成功" "$GREEN"
    else
        print_message "  ✗ 前端依赖安装失败" "$RED"
        exit 1
    fi
    cd ..
else
    print_message "  ✓ 前端依赖已安装" "$GREEN"
fi

echo ""

# 启动数据库
print_message "4. 启动数据库服务..." "$YELLOW"
if docker-compose ps | grep -q "postgres"; then
    print_message "  ✓ 数据库服务已在运行" "$GREEN"
else
    print_message "  启动PostgreSQL数据库..." "$YELLOW"
    docker-compose up postgres -d

    # 等待数据库启动
    print_message "  等待数据库启动..." "$YELLOW"
    sleep 5

    if docker-compose ps | grep -q "Up"; then
        print_message "  ✓ 数据库启动成功" "$GREEN"
    else
        print_message "  ✗ 数据库启动失败" "$RED"
        exit 1
    fi
fi

echo ""

# 启动后端服务
print_message "5. 启动后端服务..." "$YELLOW"
print_message "  后端服务将在 http://localhost:3001 运行" "$YELLOW"
print_message "  健康检查: http://localhost:3001/health" "$YELLOW"

# 检查后端是否已在运行
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    print_message "  ✓ 后端服务已在运行" "$GREEN"
else
    print_message "  启动后端服务（按Ctrl+C停止）..." "$YELLOW"
    cd backend && npm run dev &
    BACKEND_PID=$!
    cd ..

    # 等待后端启动
    sleep 3

    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
        print_message "  ✓ 后端服务启动成功" "$GREEN"
    else
        print_message "  ✗ 后端服务启动失败" "$RED"
        exit 1
    fi
fi

echo ""

# 启动前端服务
print_message "6. 启动前端服务..." "$YELLOW"
print_message "  前端应用将在 http://localhost:3000 运行" "$YELLOW"

# 检查前端是否已在运行
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    print_message "  ✓ 前端服务已在运行" "$GREEN"
else
    print_message "  启动前端服务（按Ctrl+C停止）..." "$YELLOW"
    cd frontend && npm run dev &
    FRONTEND_PID=$!
    cd ..

    # 等待前端启动
    sleep 5

    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        print_message "  ✓ 前端服务启动成功" "$GREEN"
    else
        print_message "  ✗ 前端服务启动失败" "$RED"
        exit 1
    fi
fi

echo ""
print_message "=== 启动完成！ ===" "$GREEN"
echo ""
echo "服务状态："
echo "  📊 前端应用: http://localhost:3000"
echo "  🔧 后端API:  http://localhost:3001"
echo "  🗄️  数据库:   localhost:5432"
echo ""
echo "默认登录信息："
echo "  邮箱: zhang@example.com"
echo "  密码: 请查看数据库初始化脚本"
echo ""
echo "核心功能页面："
echo "  📈 仪表板:      http://localhost:3000/"
echo "  💬 对话界面:    http://localhost:3000/conversation"
echo "  🧠 认知评估:    http://localhost:3000/assessment"
echo "  📊 数据分析:    http://localhost:3000/analytics"
echo "  👤 个人资料:    http://localhost:3000/profile"
echo ""
echo "API文档："
echo "  🔍 健康检查:    http://localhost:3001/health"
echo "  📝 用户注册:    POST http://localhost:3001/api/users/register"
echo "  🔐 用户登录:    POST http://localhost:3001/api/users/login"
echo "  💬 创建对话:    POST http://localhost:3001/api/conversations"
echo ""
echo "管理命令："
echo "  🛑 停止所有服务: docker-compose down"
echo "  📋 查看服务状态: docker-compose ps"
echo "  📜 查看后端日志: cd backend && npm run dev"
echo "  🎨 查看前端日志: cd frontend && npm run dev"
echo ""
echo "开发提示："
echo "  1. 首次使用需要注册用户或使用测试账户"
echo "  2. 对话数据会实时分析认知指标"
echo "  3. 评估结果会影响风险等级"
echo "  4. 所有数据都有可视化分析"
echo ""
print_message "🚀 系统已准备就绪，开始使用吧！" "$GREEN"

# 保存进程ID以便后续管理
echo $BACKEND_PID > .backend.pid 2>/dev/null
echo $FRONTEND_PID > .frontend.pid 2>/dev/null

# 等待用户中断
trap 'cleanup' INT
cleanup() {
    echo ""
    print_message "正在停止服务..." "$YELLOW"

    # 停止前端
    if [ -f ".frontend.pid" ]; then
        kill $(cat .frontend.pid) 2>/dev/null
        rm .frontend.pid
    fi

    # 停止后端
    if [ -f ".backend.pid" ]; then
        kill $(cat .backend.pid) 2>/dev/null
        rm .backend.pid
    fi

    print_message "服务已停止" "$GREEN"
    exit 0
}

# 保持脚本运行
echo "按 Ctrl+C 停止所有服务..."
wait