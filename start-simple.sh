#!/bin/bash

echo "=== 阿兹海默预防对话系统 - 简化启动 ==="
echo ""

echo "1. 启动数据库..."
docker-compose up postgres -d
sleep 3

echo "2. 检查数据库状态..."
if docker-compose ps | grep -q "Up"; then
    echo "✓ 数据库启动成功"
else
    echo "✗ 数据库启动失败，尝试重新启动..."
    docker-compose down
    docker-compose up postgres -d
    sleep 5
fi

echo ""
echo "3. 启动后端服务（新终端）..."
echo "   请在新终端中运行："
echo "   cd /Users/eva/workspace/alzheimer/backend"
echo "   npm run dev"
echo ""
echo "4. 启动前端服务（另一个新终端）..."
echo "   请在另一个新终端中运行："
echo "   cd /Users/eva/workspace/alzheimer/frontend"
echo "   npm run dev"
echo ""
echo "5. 访问应用："
echo "   前端：http://localhost:3000"
echo "   后端API：http://localhost:3001/health"
echo ""
echo "6. 快速测试："
echo "   curl http://localhost:3001/health"
echo ""
echo "注意：如果依赖尚未安装，请先运行："
echo "   cd backend && npm install"
echo "   cd ../frontend && npm install"
