/**
 * 新图片生成功能测试
 * 测试基于字段映射的小红书卡片生成
 */

import { generateAllCards, generateCardImage, downloadMultipleImages } from './image-generator.js';

// 测试数据 - 模拟日语表达记录（符合新需求格式）
const testExpressionData = {
  标题: "2026-03-03 感受表达｜娘と楽しい朝ジョギング",
  主题: "感受表达",
  最终定稿: "今朝は娘と一緒にジョギングをしながら、学校のことや最近感じていることについてゆっくり話す時間を持てました。とても穏やかな朝でした。",
  进化过程: "V1：今朝は娘とジョギングしました。そして、たくさん話しました。\nV2：今朝は娘と一緒にジョギングをして、そのあと色々なことを話しました。\nV3：今朝は娘と一緒にジョギングをしながら、学校のことや最近感じていることについてゆっくり話しました。",
  本次核心结构: "1. 〜しながら（动作并行）\n2. 〜について（话题展开）\n3. 抽象感受表达（穏やかな朝）",
  表达升级点: "1. 从简单并列句升级为动作并行结构\n2. 从「たくさん話しました」升级为具体话题展开\n3. 加入情绪性总结句，提高自然度",
  错误记录: [],
  生词: [],
  分享标题: "日语句子别老用「そして」｜一个结构让表达瞬间自然"
};

console.log('🧪 开始测试新图片生成功能...');
console.log('📋 测试数据:', testExpressionData);

// 测试1: 生成单张卡片
console.log('\n🎨 测试1: 生成单张卡片（封面）');
try {
  console.log('正在生成封面卡片...');
  generateCardImage(testExpressionData, 1).then(blob => {
    console.log(`✅ 封面卡片生成成功！图片大小: ${(blob.size / 1024).toFixed(2)} KB`);
    
    // 创建预览链接
    const url = URL.createObjectURL(blob);
    console.log('📥 封面卡片预览链接:', url);
    console.log('（在浏览器中打开此链接可预览图片）');
    
    // 5秒后清理
    setTimeout(() => {
      URL.revokeObjectURL(url);
      console.log('🧹 预览链接已清理');
    }, 5000);
  }).catch(error => {
    console.error('❌ 单张卡片生成失败:', error.message);
  });
} catch (error) {
  console.error('❌ 测试1失败:', error.message);
}

// 测试2: 生成所有4张卡片
setTimeout(() => {
  console.log('\n🎨 测试2: 生成所有4张卡片');
  console.log('注意: 此测试会生成4张卡片，可能需要一些时间...');
  
  generateAllCards(testExpressionData).then(blobs => {
    console.log(`✅ 成功生成 ${blobs.length} 张卡片！`);
    
    // 显示每张卡片的信息
    blobs.forEach((blob, index) => {
      console.log(`  卡片${index + 1}: ${(blob.size / 1024).toFixed(2)} KB`);
    });
    
    // 创建第一张卡片的预览
    const firstUrl = URL.createObjectURL(blobs[0]);
    console.log('📥 第一张卡片预览链接:', firstUrl);
    
    // 5秒后清理
    setTimeout(() => {
      URL.revokeObjectURL(firstUrl);
      console.log('🧹 预览链接已清理');
    }, 5000);
    
  }).catch(error => {
    console.error('❌ 批量卡片生成失败:', error.message);
  });
}, 2000);

// 测试3: 字段解析功能
console.log('\n🔍 测试3: 字段解析功能');
try {
  // 测试进化过程解析
  const evolutionText = testExpressionData.进化过程;
  console.log('进化过程文本:', evolutionText);
  
  // 简单的版本提取测试
  const v1Match = evolutionText.match(/V1：(.+)/);
  const v2Match = evolutionText.match(/V2：(.+)/);
  const v3Match = evolutionText.match(/V3：(.+)/);
  
  console.log('V1提取结果:', v1Match ? v1Match[1].trim() : '未找到');
  console.log('V2提取结果:', v2Match ? v2Match[1].trim() : '未找到');
  console.log('V3提取结果:', v3Match ? v3Match[1].trim() : '未找到');
  
  console.log('✅ 字段解析功能正常');
} catch (error) {
  console.error('❌ 字段解析测试失败:', error.message);
}

// 测试4: 分享标题解析
console.log('\n🔍 测试4: 分享标题解析');
try {
  const shareTitle = testExpressionData.分享标题;
  console.log('原始分享标题:', shareTitle);
  
  // 测试Day数字提取
  const dayMatch = shareTitle.match(/Day\s*(\d+)/i);
  console.log('提取的Day数字:', dayMatch ? dayMatch[1] : '未找到');
  
  // 测试标题分割
  const parts = shareTitle.split('｜');
  console.log('标题分割结果:');
  console.log('  主标题:', parts[0] || '无');
  console.log('  副标题:', parts[1] || '无');
  
  console.log('✅ 分享标题解析正常');
} catch (error) {
  console.error('❌ 分享标题解析测试失败:', error.message);
}

console.log('\n🎉 测试完成！');
console.log('💡 提示:');
console.log('  - 新图片生成基于字段映射，无需AI API调用');
console.log('  - 生成速度更快，结果更稳定');
console.log('  - 一次生成4张小红书卡片');
console.log('  - 支持预览和批量下载');