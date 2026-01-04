/**
 * 数据库种子数据脚本
 * 添加丰富的示例数据：版权、系列、用户等
 */

import dotenv from 'dotenv';
import Copyright from '../models/Copyright';
import Series from '../models/Series';
import CopyrightShare from '../models/CopyrightShare';
import User from '../models/User';
import GalleryCoin from '../models/GalleryCoin';
import { connectDatabase, disconnectDatabase } from '../config/database';

dotenv.config();

async function seed() {
  try {
    console.log('[INFO] 开始播种数据...');
    
    // 连接数据库
    await connectDatabase();
    
    // 清空现有数据
    await Copyright.deleteMany({});
    await Series.deleteMany({});
    await CopyrightShare.deleteMany({});
    await GalleryCoin.deleteMany({});
    await User.deleteMany({});
    console.log('[INFO] 已清空现有数据');
    
    // 1. 创建系列数据
    const seriesData = [
      {
        name: '数字星空系列',
        description: '探索数字世界中的无限可能，每一件作品都像星空中的一颗星，独特而闪耀。',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop',
        buffType: 'revenue' as const,
        buffEffect: '周边商品分红比例+5%'
      },
      {
        name: '量子花园系列',
        description: '量子美学与数字艺术的完美融合，展现微观世界的宏观美感。',
        image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=800&fit=crop',
        buffType: 'game' as const,
        buffEffect: '挂机产币速度+10%'
      },
      {
        name: '时间之河系列',
        description: '记录数字世界中的每一个瞬间，时间在虚拟空间中流淌。',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop',
        buffType: 'revenue' as const,
        buffEffect: '购买周边商品额外折扣5%'
      },
      {
        name: '代码之舞系列',
        description: '程序与艺术的和谐统一，每一行代码都像舞者的动作。',
        image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=800&fit=crop',
        buffType: 'game' as const,
        buffEffect: '开箱碎片掉落率+10%'
      },
      {
        name: '脸谱系列',
        description: '京剧脸谱艺术的数字呈现，每一张脸谱都蕴含着独特的文化故事。',
        image: 'https://wonka.oss-cn-beijing.aliyuncs.com/nft/faces/3729c6bd4ed0fa2373ec2d1d6673b6c2.jpg',
        buffType: 'revenue' as const,
        buffEffect: '周边商品分红比例+8%'
      }
    ];
    
    const createdSeries = await Series.insertMany(seriesData);
    console.log(`[INFO] 成功创建 ${createdSeries.length} 个系列`);
    
    // 2. 创建版权（图案）数据
    const copyrightsData = [];
    const seriesCopyrightCounts: Map<string, number> = new Map(); // 记录每个系列创建的版权数量
    
    // 为每个系列创建版权
    const faceImages = [
      'https://wonka.oss-cn-beijing.aliyuncs.com/nft/faces/3729c6bd4ed0fa2373ec2d1d6673b6c2.jpg',
      'https://wonka.oss-cn-beijing.aliyuncs.com/nft/faces/3e4672e263dc8bb45c8f5091a28af694.jpg',
      'https://wonka.oss-cn-beijing.aliyuncs.com/nft/faces/5e09bbbeb8909ee657bd7500f99e765d.jpg',
      'https://wonka.oss-cn-beijing.aliyuncs.com/nft/faces/71c15331a2030e2df65e90b15f3fa3b9.jpg'
    ];
    const faceNames = ['生', '旦', '净', '末'];

    for (let i = 0; i < createdSeries.length; i++) {
      const series = createdSeries[i];
      let copyrightCount = 6 + Math.floor(Math.random() * 3); // 6-8个

      // 脸谱系列特殊处理
      if (series.name === '脸谱系列') {
        copyrightCount = 4; // 脸谱系列只有4个版权
      }

      // 记录该系列创建的版权数量
      seriesCopyrightCounts.set(series._id.toString(), copyrightCount);

      for (let j = 0; j < copyrightCount; j++) {
        let name = `${series.name} - 图案${j + 1}`;
        let image = `https://images.unsplash.com/photo-${1550000000 + i * 1000000 + j * 100000}?w=800&h=800&fit=crop`;

        // 脸谱系列使用特定图片和名称
        if (series.name === '脸谱系列') {
          name = faceNames[j];
          image = faceImages[j];
        }

        const totalShares = 300 + Math.floor(Math.random() * 701); // 300-1000份
        const soldShares = Math.floor(Math.random() * totalShares * 0.3); // 已售0-30%

        copyrightsData.push({
          name,
          description: `属于${series.name}的独特图案设计，展现了系列的核心美学理念。`,
          image,
          seriesId: series._id,
          totalShares,
          soldShares,
          price: 50 + Math.floor(Math.random() * 200), // 50-250元
          blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          merchandiseStatus: ['undeveloped', 'developing', 'online'][Math.floor(Math.random() * 3)] as any
        });
      }
    }
    
    const createdCopyrights = await Copyright.insertMany(copyrightsData);
    console.log(`[INFO] 成功创建 ${createdCopyrights.length} 个版权`);
    
    // 更新系列的copyrightIds - 根据实际创建的版权数量分配
    let copyrightIndex = 0;
    for (const series of createdSeries) {
      const count = seriesCopyrightCounts.get(series._id.toString()) || 0;
      const seriesCopyrights = createdCopyrights.slice(copyrightIndex, copyrightIndex + count);
      await Series.findByIdAndUpdate(series._id, {
        copyrightIds: seriesCopyrights.map(c => c._id)
      });
      copyrightIndex += count;
      console.log(`[INFO] 系列 "${series.name}" 分配了 ${seriesCopyrights.length} 个版权`);
    }
    
    // 3. 创建测试用户
    const testUsers = [
      {
        openId: 'test_user_1',
        nickname: '数字艺术收藏家',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
        coins: 50000,
        level: 5,
        experience: 5000
      },
      {
        openId: 'test_user_2',
        nickname: '量子美学探索者',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
        coins: 30000,
        level: 3,
        experience: 2000
      },
      {
        openId: 'test_user_3',
        nickname: '代码艺术家',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
        coins: 80000,
        level: 8,
        experience: 12000
      }
    ];
    
    const createdUsers = await User.insertMany(testUsers);
    console.log(`[INFO] 成功创建 ${createdUsers.length} 个测试用户`);
    
    // 4. 为用户分配版权份额
    for (const user of createdUsers) {
      // 每个用户随机拥有3-8个版权份额
      const shareCount = 3 + Math.floor(Math.random() * 6);
      const selectedCopyrights = createdCopyrights
        .sort(() => Math.random() - 0.5)
        .slice(0, shareCount);
      
      for (const copyright of selectedCopyrights) {
        const shareCount = 1 + Math.floor(Math.random() * 10); // 1-10份
        // 每个份额一条记录
        for (let i = 0; i < shareCount; i++) {
          await CopyrightShare.create({
            userId: user._id,
            copyrightId: copyright._id,
            blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`, // 假的区块链hash
            inLotteryPool: Math.random() > 0.9, // 10%概率在奖池
            giftCount: 0
          });
        }
        
        // 更新版权已售份额
        await Copyright.findByIdAndUpdate(copyright._id, {
          $inc: { soldShares: shareCount }
        });
      }
      
      // 创建馆币记录
      await GalleryCoin.create({
        userId: user._id,
        coins: user.coins || 0,
        lastClaimTime: new Date(Date.now() - Math.random() * 86400000), // 随机时间
        lastOfflineTime: new Date(Date.now() - Math.random() * 43200000) // 随机离线时间
      });
    }
    
    console.log('[INFO] 成功为用户分配版权份额和馆币');
    
    // 断开连接
    await disconnectDatabase();
    console.log('[INFO] 数据播种完成！');
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] 数据播种失败:', error);
    process.exit(1);
  }
}

seed();
