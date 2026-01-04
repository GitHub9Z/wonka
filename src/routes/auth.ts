/**
 * 认证路由
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { generateToken } from '../utils/jwt';

const router = Router();

/**
 * 微信登录
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { code, userInfo } = req.body;

    if (!code) {
      return res.status(400).json({
        code: 400,
        message: '缺少登录凭证',
        data: null
      });
    }

    // 调用微信 API 获取 openId 和 session_key
    const appId = process.env.WECHAT_APPID;
    const appSecret = process.env.WECHAT_SECRET;

    if (!appId || !appSecret) {
      return res.status(500).json({
        code: 500,
        message: '微信配置未设置',
        data: null
      });
    }

    // 调用微信接口获取 openId
    const wechatResponse = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
    );

    const wechatData = await wechatResponse.json();

    if (wechatData.errcode) {
      console.error('微信登录失败:', wechatData);
      return res.status(400).json({
        code: 400,
        message: `微信登录失败: ${wechatData.errmsg || '未知错误'}`,
        data: null
      });
    }

    const { openid, session_key } = wechatData;

    if (!openid) {
      return res.status(400).json({
        code: 400,
        message: '获取 openId 失败',
        data: null
      });
    }

    const openId = openid;

    // 查找或创建用户
    let user = await User.findOne({ openId });
    
    if (!user) {
      // 创建新用户
      user = new User({
        openId,
        nickname: userInfo?.nickName || '艺术收藏家',
        avatar: userInfo?.avatarUrl || 'https://via.placeholder.com/200',
        coins: 1000,
        level: 1,
        experience: 0
      });
      await user.save();
    } else {
      // 更新用户信息
      if (userInfo) {
        user.nickname = userInfo.nickName || user.nickname;
        user.avatar = userInfo.avatarUrl || user.avatar;
        await user.save();
      }
    }

    // 生成 token
    const token = generateToken(user._id.toString());

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: user._id.toString(),
          nickname: user.nickname,
          avatar: user.avatar,
          coins: user.coins,
          level: user.level,
          experience: user.experience
        }
      }
    });
  } catch (error: any) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '登录失败',
      data: null
    });
  }
});

export default router;


