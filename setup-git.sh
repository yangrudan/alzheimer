#!/bin/bash

echo "=== 阿兹海默预防对话系统 - Git仓库设置 ==="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_message() {
    echo -e "${2}${1}${NC}"
}

# 检查是否在Git仓库中
if [ -d ".git" ]; then
    print_message "✓ Git仓库已初始化" "$GREEN"
else
    print_message "初始化Git仓库..." "$YELLOW"
    git init
    if [ $? -eq 0 ]; then
        print_message "✓ Git仓库初始化成功" "$GREEN"
    else
        print_message "✗ Git仓库初始化失败" "$RED"
        exit 1
    fi
fi

echo ""

# 检查.gitignore文件
if [ -f ".gitignore" ]; then
    print_message "✓ .gitignore文件存在" "$GREEN"
else
    print_message "✗ 缺少.gitignore文件" "$RED"
    exit 1
fi

# 检查GitHub配置文件
if [ -d ".github" ]; then
    print_message "✓ GitHub配置文件存在" "$GREEN"

    # 检查关键文件
    github_files=(
        ".github/ISSUE_TEMPLATE/bug_report.md"
        ".github/ISSUE_TEMPLATE/feature_request.md"
        ".github/CONTRIBUTING.md"
        ".github/SECURITY.md"
        ".github/workflows/ci.yml"
    )

    for file in "${github_files[@]}"; do
        if [ -f "$file" ]; then
            print_message "  ✓ $file" "$GREEN"
        else
            print_message "  ✗ 缺少文件: $file" "$RED"
        fi
    done
else
    print_message "✗ 缺少.github目录" "$RED"
    exit 1
fi

echo ""

# 检查许可证文件
if [ -f "LICENSE" ]; then
    print_message "✓ LICENSE文件存在" "$GREEN"
else
    print_message "✗ 缺少LICENSE文件" "$RED"
fi

# 检查变更日志
if [ -f "CHANGELOG.md" ]; then
    print_message "✓ CHANGELOG.md文件存在" "$GREEN"
else
    print_message "✗ 缺少CHANGELOG.md文件" "$RED"
fi

echo ""
print_message "=== Git状态检查 ===" "$YELLOW"

# 检查是否有未提交的更改
if git status --porcelain | grep -q "."; then
    print_message "有未提交的更改：" "$YELLOW"
    git status --porcelain
else
    print_message "✓ 没有未提交的更改" "$GREEN"
fi

echo ""
print_message "=== 下一步操作 ===" "$YELLOW"
echo ""
echo "1. 添加所有文件到Git："
echo "   git add ."
echo ""
echo "2. 提交初始版本："
echo "   git commit -m \"feat: 初始版本 - 阿兹海默预防对话系统\""
echo ""
echo "3. 在GitHub上创建新仓库："
echo "   - 访问 https://github.com/new"
echo "   - 仓库名: alzheimer"
echo "   - 描述: 通过日常对话进行阿兹海默症预防和预判的智能系统"
echo "   - 选择公开或私有"
echo "   - 不要初始化README、.gitignore或许可证"
echo ""
echo "4. 添加远程仓库并推送："
echo "   git remote add origin https://github.com/YOUR-USERNAME/alzheimer.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "5. 设置分支保护规则（推荐）："
echo "   - 要求Pull Request审查"
echo "   - 要求状态检查通过"
echo "   - 要求线性历史"
echo ""
echo "6. 配置GitHub Secrets（用于CI/CD）："
echo "   - SNYK_TOKEN (可选，用于安全扫描)"
echo "   - DOCKERHUB_TOKEN (可选，用于Docker镜像推送)"
echo ""
print_message "=== 重要文件说明 ===" "$YELLOW"
echo ""
echo "已创建的关键Git配置文件："
echo "📁 .gitignore - 忽略不必要的文件（node_modules、.env、dist等）"
echo "📁 .github/ - GitHub特定配置"
echo "   ├── ISSUE_TEMPLATE/ - Issue模板"
echo "   ├── workflows/ - GitHub Actions工作流"
echo "   ├── CONTRIBUTING.md - 贡献指南"
echo "   ├── SECURITY.md - 安全策略"
echo "   └── CODEOWNERS - 代码所有者"
echo "📄 LICENSE - MIT许可证"
echo "📄 CHANGELOG.md - 变更日志"
echo "📄 .github/PULL_REQUEST_TEMPLATE.md - PR模板"
echo ""
print_message "=== 最佳实践建议 ===" "$YELLOW"
echo ""
echo "1. 提交频率："
echo "   - 每个功能或修复单独提交"
echo "   - 使用有意义的提交消息"
echo "   - 遵循约定式提交格式"
echo ""
echo "2. 分支策略："
echo "   - main: 生产就绪代码"
echo "   - develop: 开发分支"
echo "   - feature/*: 功能开发分支"
echo "   - bugfix/*: bug修复分支"
echo ""
echo "3. Pull Request流程："
echo "   - 从功能分支创建PR到develop"
echo "   - 确保所有测试通过"
echo "   - 至少需要一个审查者批准"
echo "   - 解决所有审查意见"
echo ""
echo "4. 版本发布："
echo "   - 使用语义化版本"
echo "   - 更新CHANGELOG.md"
echo "   - 创建Git标签"
echo ""
print_message "=== 医疗数据注意事项 ===" "$RED"
echo ""
echo "⚠️  重要：本系统处理健康相关数据"
echo "1. 确保遵守数据保护法规（如GDPR）"
echo "2. 生产环境必须启用HTTPS"
echo "3. 用户数据需要加密存储"
echo "4. 实现用户数据访问和删除功能"
echo "5. 获取用户明确的数据使用同意"
echo ""
print_message "✅ Git配置完成！现在可以上传到GitHub了。" "$GREEN"
echo ""
echo "运行以下命令开始："
echo "1. git add ."
echo "2. git commit -m \"feat: 初始版本 - 阿兹海默预防对话系统\""
echo "3. 按照上面的说明添加远程仓库并推送"