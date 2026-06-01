#!/bin/bash
# Hello Kitty GIF 重命名脚本
# 根据情绪和动作重命名

cd "/Users/wangkai/Desktop/桌面宠物"

# 备份原始文件名
echo "开始重命名..."
echo "=================="

# 创建重命名映射
declare -A rename_map

rename_map["1.gif"]="HelloKitty_爱心_比心.gif"
rename_map["2.gif"]="HelloKitty_开心_跳舞.gif"
rename_map["3.gif"]="HelloKitty_微笑_站立.gif"
rename_map["4.gif"]="HelloKitty_期待_星星眼.gif"
rename_map["5.gif"]="HelloKitty_开心_双手举起.gif"
rename_map["6.gif"]="HelloKitty_害羞_捂脸.gif"
rename_map["7.gif"]="HelloKitty_紧张_捂嘴.gif"
rename_map["8.gif"]="HelloKitty_睡觉_侧卧.gif"
rename_map["9.gif"]="HelloKitty_写字_记录.gif"
rename_map["10.gif"]="HelloKitty_惊讶_呆坐.gif"
rename_map["11.gif"]="HelloKitty_微笑_站立02.gif"
rename_map["12.gif"]="HelloKitty_开心_抱小熊.gif"
rename_map["13.gif"]="HelloKitty_医疗_急救箱.gif"
rename_map["14.gif"]="HelloKitty_偷看_探头.gif"
rename_map["15.gif"]="HelloKitty_唱歌_喇叭.gif"
rename_map["16.gif"]="HelloKitty_哭泣_流泪.gif"
rename_map["17.gif"]="HelloKitty_惊讶_感叹号.gif"
rename_map["18.gif"]="HelloKitty_点头_嗯嗯.gif"
rename_map["19.gif"]="HelloKitty_思考_灯泡.gif"
rename_map["20.gif"]="HelloKitty_开心_转圈.gif"
rename_map["21.gif"]="HelloKitty_溜冰_OK.gif"
rename_map["22.gif"]="HelloKitty_好的_小熊.gif"
rename_map["24.gif"]="HelloKitty_拒绝_NO.gif"

# 执行重命名
for old_name in "${!rename_map[@]}"; do
    new_name="${rename_map[$old_name]}"
    if [ -f "$old_name" ]; then
        mv -n "$old_name" "$new_name"
        echo "✓ $old_name → $new_name"
    else
        echo "✗ $old_name 不存在，跳过"
    fi
done

echo "=================="
echo "重命名完成！"
echo ""
echo "剩余未处理的文件："
ls -1 *.gif 2>/dev/null | sort
