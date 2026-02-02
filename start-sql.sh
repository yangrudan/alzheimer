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

# 启动数据库
print_message "prepare 启动数据库服务..." "$YELLOW"
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
