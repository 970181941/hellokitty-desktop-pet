#!/usr/bin/env node

/**
 * 构建发布脚本
 * 用法:
 *   node scripts/build.js [patch|minor|major]
 *   node scripts/build.js patch "修复了XXX问题"
 *   node scripts/build.js minor "新增YYY功能"
 *
 * 流程:
 *   1. 版本号递增
 *   2. 更新 CHANGELOG.md
 *   3. 运行 electron-builder 构建 DMG
 *   4. 创建 git tag
 *   5. 输出推送指令
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PKG_PATH = path.join(ROOT, 'package.json');
const CHANGELOG_PATH = path.join(ROOT, 'CHANGELOG.md');

// === 工具函数 ===

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function bumpVersion(current, type) {
  const parts = current.split('.').map(Number);
  switch (type) {
    case 'major':
      return `${parts[0] + 1}.0.0`;
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`;
    case 'patch':
    default:
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
}

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function run(cmd, opts = {}) {
  console.log(`  > ${cmd}`);
  return execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim();
}

// === 主流程 ===

function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch';
  const customChangelog = args.slice(1).join(' ') || '';

  if (!['patch', 'minor', 'major'].includes(versionType)) {
    console.error(`错误: 无效的版本类型 "${versionType}"`);
    console.error('用法: node scripts/build.js [patch|minor|major] [更新说明]');
    process.exit(1);
  }

  // 1. 读取当前版本
  const pkg = readJSON(PKG_PATH);
  const oldVersion = pkg.version;
  const newVersion = bumpVersion(oldVersion, versionType);

  console.log(`\n=== 构建发布 ===`);
  console.log(`版本: v${oldVersion} -> v${newVersion} (${versionType})\n`);

  // 2. 更新 package.json 版本号
  console.log('[1/5] 更新版本号...');
  pkg.version = newVersion;
  writeJSON(PKG_PATH, pkg);
  console.log(`  package.json 已更新为 v${newVersion}`);

  // 3. 更新 CHANGELOG.md
  console.log('\n[2/5] 更新 CHANGELOG.md...');
  const changelogEntry = customChangelog || getDefaultChangelog(versionType);
  const newChangelogSection = `## [${newVersion}] - ${today()}\n\n### ${getVersionLabel(versionType)}\n${formatChangelogEntry(changelogEntry)}\n\n`;

  let changelogContent = '';
  if (fs.existsSync(CHANGELOG_PATH)) {
    changelogContent = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
  } else {
    changelogContent = '# Changelog\n\n';
  }

  // 在 "# Changelog\n\n" 之后插入新版本条目
  const headerMatch = changelogContent.match(/^# Changelog\n\n/);
  if (headerMatch) {
    const afterHeader = changelogContent.slice(headerMatch[0].length);
    changelogContent = headerMatch[0] + newChangelogSection + afterHeader;
  } else {
    changelogContent = '# Changelog\n\n' + newChangelogSection + changelogContent;
  }

  fs.writeFileSync(CHANGELOG_PATH, changelogContent, 'utf-8');
  console.log(`  CHANGELOG.md 已更新`);

  // 4. 构建 DMG
  console.log('\n[3/5] 构建 DMG 安装包...');
  try {
    run('npx electron-builder --mac dmg');
    // 清除 DMG 的 quarantine 属性
    try {
      run('xattr -cr dist/*.dmg', { stdio: 'ignore' });
    } catch (e) {
      // ignore
    }
    console.log('  DMG 构建完成');
  } catch (e) {
    console.error('  构建失败! 回滚版本号...');
    pkg.version = oldVersion;
    writeJSON(PKG_PATH, pkg);
    // 回滚 CHANGELOG
    if (headerMatch) {
      const afterHeader = changelogContent.slice(headerMatch[0].length);
      const removed = afterHeader.replace(newChangelogSection, '');
      changelogContent = headerMatch[0] + removed;
    }
    fs.writeFileSync(CHANGELOG_PATH, changelogContent, 'utf-8');
    console.error('  已回滚到 v' + oldVersion);
    process.exit(1);
  }

  // 5. Git 操作
  console.log('\n[4/5] 创建 Git 标签...');
  const isGitRepo = fs.existsSync(path.join(ROOT, '.git'));
  if (isGitRepo) {
    try {
      run('git add package.json CHANGELOG.md');
      run(`git commit -m "release: v${newVersion}"`);
      run(`git tag -a v${newVersion} -m "v${newVersion}"`);
      console.log(`  Git 标签 v${newVersion} 已创建`);
    } catch (e) {
      console.warn(`  Git 操作失败: ${e.message}`);
      console.warn('  你可以手动执行 git 命令');
    }
  } else {
    console.log('  未检测到 Git 仓库，跳过 Git 操作');
    console.log('  初始化 Git: git init && git add . && git commit -m "init"');
  }

  // 6. 输出推送指令
  console.log('\n[5/5] 发布指引...\n');
  console.log('=== 构建完成 ===');
  console.log(`版本: v${newVersion}`);
  console.log(`DMG: dist/ 目录下\n`);

  if (isGitRepo) {
    console.log('推送到 GitHub:');
    console.log('  git push origin main --tags\n');
    console.log('创建 GitHub Release (需要 gh CLI):');
    console.log(`  gh release create v${newVersion} dist/*.dmg dist/*.zip dist/latest-mac.yml --title "v${newVersion}" --notes "${changelogEntry}"\n`);
    console.log('或者手动:');
    console.log('  1. 前往 GitHub 仓库 -> Releases -> Create a new release');
    console.log(`  2. 选择标签 v${newVersion}`);
    console.log('  3. 上传 dist/ 下的 .dmg、.zip 文件和 latest-mac.yml');
    console.log('  4. 粘贴更新内容并发布');
  } else {
    console.log('初始化 Git 仓库后推送:');
    console.log('  git init');
    console.log('  git add .');
    console.log(`  git commit -m "release: v${newVersion}"`);
    console.log(`  git tag -a v${newVersion} -m "v${newVersion}"`);
    console.log('  git remote add origin https://github.com/你的用户名/hellokitty-desktop-pet.git');
    console.log('  git push origin main --tags');
  }
}

// === 辅助函数 ===

function getDefaultChangelog(type) {
  const defaults = {
    patch: '修复了一些小问题',
    minor: '新增功能和改进',
    major: '重大更新',
  };
  return defaults[type] || '更新内容';
}

function getVersionLabel(type) {
  const labels = {
    patch: '修复',
    minor: '新增',
    major: '重大更新',
  };
  return labels[type] || '更新';
}

function formatChangelogEntry(entry) {
  // 支持多条用分号分隔
  return entry.split(/[;；]/).map(item => `- ${item.trim()}`).join('\n');
}

// 仅在直接运行时执行
if (require.main === module) {
  main();
}
