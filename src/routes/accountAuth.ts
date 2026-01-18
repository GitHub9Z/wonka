/**
 * 账号认证路由（邮箱/手机号+密码）
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import AccountUser from '../models/AccountUser';
import { generateToken } from '../utils/jwt';

const router = Router();

/**
 * 登录/注册（自动注册）
 * 如果账户不存在，则自动创建新账户
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, phone, password, nickname, avatar } = req.body;

    // 验证必填字段
    if (!password || password.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '密码长度至少6位',
        data: null
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        code: 400,
        message: '邮箱和手机号至少需要填写一个',
        data: null
      });
    }

    // 查找用户
    const user = await AccountUser.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : [])
      ]
    });

    // 如果用户不存在，自动注册
    if (!user) {
      // 加密密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 创建新用户
      const newUser = await AccountUser.create({
        email: email || undefined,
        phone: phone || undefined,
        password: hashedPassword,
        nickname: nickname || '艺术收藏家',
        avatar: avatar || '',
        coins: 1000,
        galleryCoins: 0,
        level: 1,
        experience: 0,
        popularity: 0,
        lastOnlineTime: new Date(),
        isMinor: false
      });

      // 生成 token
      const token = generateToken(newUser._id.toString());

      return res.status(201).json({
        code: 200,
        message: '注册成功',
        data: {
          token,
          user: {
            id: newUser._id.toString(),
            email: newUser.email,
            phone: newUser.phone,
            nickname: newUser.nickname,
            avatar: newUser.avatar,
            coins: newUser.coins,
            galleryCoins: newUser.galleryCoins,
            level: newUser.level,
            experience: newUser.experience
          },
          isNewUser: true // 标识是新注册的用户
        }
      });
    }

    // 用户存在，验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '账号或密码错误',
        data: null
      });
    }

    // 更新最后在线时间
    user.lastOnlineTime = new Date();
    await user.save();

    // 生成 token
    const token = generateToken(user._id.toString());

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          coins: user.coins,
          galleryCoins: user.galleryCoins,
          level: user.level,
          experience: user.experience
        },
        isNewUser: false // 标识是已存在的用户
      }
    });
  } catch (error: any) {
    console.error('[AccountAuth] 登录/注册错误:', error);
    
    // 处理唯一索引冲突
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        code: 400,
        message: field === 'email' ? '该邮箱已被注册' : '该手机号已被注册',
        data: null
      });
    }

    res.status(500).json({
      code: 500,
      message: error.message || '登录/注册失败',
      data: null
    });
  }
});

export default router;

