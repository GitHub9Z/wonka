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
import UserBuff from '../models/UserBuff';
import Box from '../models/Box';
import CopyrightFragment from '../models/CopyrightFragment';
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
    await UserBuff.deleteMany({});
    await Box.deleteMany({});
    await CopyrightFragment.deleteMany({});
    console.log('[INFO] 已清空现有数据');
    
    // 1. 创建系列数据
    const seriesData = [
      {
        name: '起源',
        description: '中华文明的五大朝代，承载着深厚的历史文化底蕴，每一件作品都展现着不同朝代的独特魅力。',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop',
        hourlyBonusCoins: 2000,
        copyrightIds: []
      },
      {
        name: '脸谱',
        description: '京剧脸谱艺术的数字呈现，每一张脸谱都蕴含着独特的文化故事和角色性格。',
        image: 'https://wonka.oss-cn-beijing.aliyuncs.com/nft/faces/3729c6bd4ed0fa2373ec2d1d6673b6c2.jpg',
        hourlyBonusCoins: 1500,
        copyrightIds: []
      }
    ];
    
    const createdSeries = await Series.insertMany(seriesData);
    console.log(`[INFO] 成功创建 ${createdSeries.length} 个系列`);
    
    // 2. 创建版权（图案）数据
    const copyrightsData = [];
    const seriesCopyrightCounts: Map<string, number> = new Map(); // 记录每个系列创建的版权数量
    
    // 起源系列的版权名称和描述
    const originNames = ['唐', '宋', '元', '明', '清'];
    const originDescriptions = {
      '唐': '盛唐气象，开放包容，展现了中华文明的巅峰时刻。',
      '宋': '文化繁荣，经济发达，诗词书画达到新的高度。',
      '元': '多元融合，疆域辽阔，不同文化相互交融。',
      '明': '复兴传统，郑和下西洋，展现了大明王朝的雄心。',
      '清': '康乾盛世，文化集大成，传统与现代的完美结合。'
    };
    
    // 脸谱系列的版权名称、图片和描述
    const faceImages = [
      'https://wonka.oss-cn-beijing.aliyuncs.com/nft/faces/3729c6bd4ed0fa2373ec2d1d6673b6c2.jpg',
      'https://wonka.oss-cn-beijing.aliyuncs.com/nft/faces/3e4672e263dc8bb45c8f5091a28af694.jpg',
      'https://wonka.oss-cn-beijing.aliyuncs.com/nft/faces/5e09bbbeb8909ee657bd7500f99e765d.jpg',
      'https://wonka.oss-cn-beijing.aliyuncs.com/nft/faces/71c15331a2030e2df65e90b15f3fa3b9.jpg'
    ];
    const faceNames = ['生', '旦', '净', '丑'];
    const faceDescriptions = {
      '生': '生行，扮演男性角色，分为老生、小生、武生等，展现男性角色的刚毅与智慧。',
      '旦': '旦行，扮演女性角色，分为青衣、花旦、老旦等，展现女性角色的柔美与坚韧。',
      '净': '净行，又称花脸，扮演性格鲜明的男性角色，通过脸谱展现角色的性格特征。',
      '丑': '丑行，扮演滑稽幽默的角色，通过夸张的脸谱和表演带来欢乐。'
    };

    for (let i = 0; i < createdSeries.length; i++) {
      const series = createdSeries[i];
      let copyrightCount = 0;
      let copyrightNames: string[] = [];
      let copyrightImages: string[] = [];
      let copyrightDescs: { [key: string]: string } = {};

      // 根据系列名称确定版权数量和名称
      if (series.name === '起源') {
        copyrightCount = 5; // 起源系列：唐/宋/元/明/清
        copyrightNames = originNames;
        copyrightDescs = originDescriptions;
        // 为起源系列生成图片URL
        copyrightImages = originNames.map((_, idx) => 
          `https://images.unsplash.com/photo-${1600000000 + idx * 100000}?w=800&h=800&fit=crop`
        );
      } else if (series.name === '脸谱') {
        copyrightCount = 4; // 脸谱系列：生/旦/净/丑
        copyrightNames = faceNames;
        copyrightImages = faceImages;
        copyrightDescs = faceDescriptions;
      }

      // 记录该系列创建的版权数量
      seriesCopyrightCounts.set(series._id.toString(), copyrightCount);

      for (let j = 0; j < copyrightCount; j++) {
        const name = copyrightNames[j] || `${series.name} - 图案${j + 1}`;
        const image = copyrightImages[j] || `https://images.unsplash.com/photo-${1550000000 + i * 1000000 + j * 100000}?w=800&h=800&fit=crop`;
        const description = copyrightDescs[name] || `属于${series.name}的独特图案设计，展现了系列的核心美学理念。`;

        const totalShares = 400 + Math.floor(Math.random() * 601); // 400-1000份
        const soldShares = Math.floor(Math.random() * totalShares * 0.2); // 已售0-20%
        const price = 100 + Math.floor(Math.random() * 400); // 100-500元

        copyrightsData.push({
          name,
          description,
          image,
          seriesId: series._id,
          totalShares,
          soldShares,
          price,
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
        nickname: '历史收藏家',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
        coins: 100000,
        galleryCoins: 50000,
        level: 10,
        experience: 15000
      },
      {
        openId: 'test_user_2',
        nickname: '文化探索者',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
        coins: 80000,
        galleryCoins: 40000,
        level: 8,
        experience: 10000
      },
      {
        openId: 'test_user_3',
        nickname: '艺术爱好者',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
        coins: 120000,
        galleryCoins: 60000,
        level: 12,
        experience: 20000
      },
      {
        openId: 'test_user_4',
        nickname: '新手上路',
        avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&h=200&fit=crop',
        coins: 20000,
        galleryCoins: 5000,
        level: 2,
        experience: 500
      },
      {
        openId: 'test_user_5',
        nickname: '资深玩家',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
        coins: 200000,
        galleryCoins: 150000,
        level: 20,
        experience: 50000
      }
    ];
    
    const createdUsers = await User.insertMany(testUsers);
    console.log(`[INFO] 成功创建 ${createdUsers.length} 个测试用户`);
    
    // 4. 为用户分配版权份额
    for (const user of createdUsers) {
      // 每个用户随机拥有2-6个不同版权，每个版权1-5份
      const copyrightCount = 2 + Math.floor(Math.random() * 5);
      const selectedCopyrights = createdCopyrights
        .sort(() => Math.random() - 0.5)
        .slice(0, copyrightCount);
      
      for (const copyright of selectedCopyrights) {
        const shareCount = 1 + Math.floor(Math.random() * 5); // 1-5份
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
        coins: user.galleryCoins || 0,
        lastClaimTime: new Date(Date.now() - Math.random() * 86400000), // 随机时间（过去24小时内）
        lastOfflineTime: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 43200000) : null // 50%概率有离线时间
      });
    }
    
    console.log('[INFO] 成功为用户分配版权份额和馆币');
    
    // 5. 为用户创建一些开箱记录
    for (const user of createdUsers) {
      // 每个用户随机创建3-10条开箱记录
      const boxCount = 3 + Math.floor(Math.random() * 8);
      const boxTypes: ('normal' | 'free')[] = ['normal', 'free'];
      
      for (let i = 0; i < boxCount; i++) {
        const boxType = boxTypes[Math.floor(Math.random() * boxTypes.length)];
        const randomReward = Math.random();
        let rewardType: 'coins' | 'copyright' = 'coins';
        let rewardValue = 0;
        let copyrightId = null;
        
        if (boxType === 'free') {
          // 免费盲盒只出WTC
          rewardType = 'coins';
          rewardValue = Math.floor(Math.random() * 50000 + 10000); // 1万-6万
        } else {
          // 常规盲盒：70%WTC，30%版权
          if (randomReward < 0.7) {
            rewardType = 'coins';
            rewardValue = Math.floor(Math.random() * 50000 + 10000); // 1万-6万
          } else {
            rewardType = 'copyright';
            rewardValue = 1; // 1份版权
            const randomCopyright = createdCopyrights[Math.floor(Math.random() * createdCopyrights.length)];
            copyrightId = randomCopyright._id;
          }
        }
        
        // 创建开箱记录（过去30天内）
        const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        await Box.create({
          userId: user._id,
          boxType,
          rewardType,
          rewardValue,
          copyrightId,
          createdAt
        });
      }
    }
    
    console.log('[INFO] 成功创建开箱记录');
    
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
