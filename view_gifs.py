#!/usr/bin/env python3
"""
查看GIF图片内容并显示预览
使用macOS内置的qlmanage工具生成缩略图预览
"""

import os
import subprocess
import sys

# 图片目录
IMAGE_DIR = "/Users/wangkai/Desktop/桌面宠物"

# 获取所有GIF文件
gif_files = sorted([f for f in os.listdir(IMAGE_DIR) if f.endswith('.gif')])

print(f"找到 {len(gif_files)} 个GIF文件\n")
print("=" * 60)

for i, gif_file in enumerate(gif_files, 1):
    filepath = os.path.join(IMAGE_DIR, gif_file)
    file_size = os.path.getsize(filepath) / 1024  # KB
    
    print(f"\n[{i}] {gif_file} ({file_size:.1f} KB)")
    print("-" * 40)
    
    # 使用qlmanage生成预览并打开
    try:
        # 在macOS上使用预览打开GIF
        subprocess.run(['open', filepath], check=False)
        print(f"  已打开预览: {gif_file}")
        print(f"  请观察图片内容,记录情绪和动作...")
        
        # 等待用户确认
        input(f"  按Enter继续下一张...")
        
    except Exception as e:
        print(f"  错误: {e}")

print("\n" + "=" * 60)
print("所有图片查看完成!")
