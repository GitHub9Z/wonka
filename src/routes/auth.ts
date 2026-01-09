/**
 * 认证路由
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import User from '../models/User';
import { generateToken } from '../utils/jwt';

const router = Router();

/**
 * 微信登录
 */
router.post('/login', async (req: Request, res: Response) => {
  const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  console.log(`[Auth:${requestId}] ========== 收到登录请求 ==========`);
  console.log(`[Auth:${requestId}] 请求时间:`, new Date().toISOString());
  console.log(`[Auth:${requestId}] 请求IP:`, req.ip || req.connection.remoteAddress);
  console.log(`[Auth:${requestId}] 请求头:`, {
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent'],
    'authorization': req.headers['authorization'] ? '已设置' : '未设置'
  });
  
  try {
    console.log(`[Auth:${requestId}] 请求体:`, {
      hasCode: !!req.body.code,
      codeLength: req.body.code ? req.body.code.length : 0,
      codePreview: req.body.code ? req.body.code.substring(0, 10) + '...' : '无',
      hasUserInfo: !!req.body.userInfo,
      userInfo: req.body.userInfo ? {
        hasNickName: !!req.body.userInfo.nickName,
        hasAvatarUrl: !!req.body.userInfo.avatarUrl
      } : '无'
    });

    const { code, userInfo } = req.body;

    if (!code) {
      console.error(`[Auth:${requestId}] ❌ 缺少登录凭证 code`);
      return res.status(400).json({
        code: 400,
        message: '缺少登录凭证',
        data: null
      });
    }

    console.log(`[Auth:${requestId}] ✅ 登录凭证验证通过`);

    // 调用微信 API 获取 openId
    const appId = 'wxe6fbb3434a93e0e0';
    const appSecret = '55ac8bd065ce603f2868c8a3bdc4807f';

    console.log(`[Auth:${requestId}] 微信配置检查:`, {
      hasAppId: !!appId,
      appIdLength: appId ? appId.length : 0,
      appIdPreview: appId ? appId.substring(0, 10) + '...' : '无',
      hasAppSecret: !!appSecret,
      appSecretLength: appSecret ? appSecret.length : 0,
      appSecretPreview: appSecret ? appSecret.substring(0, 5) + '...' : '无'
    });

    if (!appId || !appSecret) {
      console.error(`[Auth:${requestId}] ❌ 微信配置未设置`);
      return res.status(500).json({
        code: 500,
        message: '微信配置未设置',
        data: null
      });
    }

    console.log(`[Auth:${requestId}] 准备调用微信 API...`);
    const wechatApiUrl = `https://api.weixin.qq.com/sns/jscode2session`;
    const wechatParams = {
      appid: appId,
      secret: appSecret,
      js_code: code,
      grant_type: 'authorization_code'
    };
    console.log(`[Auth:${requestId}] 微信 API URL:`, wechatApiUrl);
    console.log(`[Auth:${requestId}] 微信 API 参数:`, {
      appid: wechatParams.appid,
      secret: wechatParams.secret ? '***' : '无',
      js_code: wechatParams.js_code ? wechatParams.js_code.substring(0, 10) + '...' : '无',
      grant_type: wechatParams.grant_type
    });

    // 调用微信接口获取 openId
    let wechatResponse;
    try {
      wechatResponse = await axios.get(wechatApiUrl, {
        params: wechatParams,
        timeout: 10000
      });
      console.log(`[Auth:${requestId}] ✅ 微信 API 调用成功`);
      console.log(`[Auth:${requestId}] 微信 API 响应状态:`, wechatResponse.status);
    } catch (axiosError: any) {
      console.error(`[Auth:${requestId}] ❌ 微信 API 调用失败:`, {
        message: axiosError.message,
        code: axiosError.code,
        response: axiosError.response ? {
          status: axiosError.response.status,
          data: axiosError.response.data
        } : '无响应'
      });
      throw new Error(`微信 API 调用失败: ${axiosError.message}`);
    }

    const wechatData = wechatResponse.data;
    console.log(`[Auth:${requestId}] 微信 API 响应数据:`, {
      hasErrcode: !!wechatData.errcode,
      errcode: wechatData.errcode,
      errmsg: wechatData.errmsg,
      hasOpenid: !!wechatData.openid,
      openidLength: wechatData.openid ? wechatData.openid.length : 0,
      openidPreview: wechatData.openid ? wechatData.openid.substring(0, 10) + '...' : '无',
      hasSessionKey: !!wechatData.session_key
    });

    if (wechatData.errcode) {
      console.error(`[Auth:${requestId}] ❌ 微信登录失败:`, wechatData);
      return res.status(400).json({
        code: 400,
        message: `微信登录失败: ${wechatData.errmsg || '未知错误'}`,
        data: null
      });
    }

    const { openid } = wechatData;

    if (!openid) {
      console.error(`[Auth:${requestId}] ❌ 获取 openId 失败`);
      return res.status(400).json({
        code: 400,
        message: '获取 openId 失败',
        data: null
      });
    }

    const openId = openid;
    console.log(`[Auth:${requestId}] ✅ 成功获取 openId`);

    // 查找或创建用户
    console.log(`[Auth:${requestId}] 查询用户，openId:`, openId.substring(0, 10) + '...');
    let user = await User.findOne({ openId });
    
    if (!user) {
      console.log(`[Auth:${requestId}] 用户不存在，创建新用户`);
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
      console.log(`[Auth:${requestId}] ✅ 新用户创建成功，userId:`, user._id.toString());
    } else {
      console.log(`[Auth:${requestId}] 用户已存在，userId:`, user._id.toString());
      // 更新用户信息
      if (userInfo) {
        console.log(`[Auth:${requestId}] 更新用户信息`);
        user.nickname = userInfo.nickName || user.nickname;
        user.avatar = userInfo.avatarUrl || user.avatar;
        await user.save();
        console.log(`[Auth:${requestId}] ✅ 用户信息更新成功`);
      }
    }

    // 生成 token
    const userId = user._id.toString();
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    console.log(`[Auth:${requestId}] 生成 token，userId:`, userId);
    console.log(`[Auth:${requestId}] JWT_SECRET 检查:`, {
      hasSecret: !!JWT_SECRET,
      secretLength: JWT_SECRET.length,
      secretPreview: JWT_SECRET.substring(0, 10) + '...'
    });
    
    const token = generateToken(userId);
    
    console.log(`[Auth:${requestId}] ✅ Token 生成成功:`, {
      userId: userId,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 30) + '...',
      jwtSecretLength: JWT_SECRET.length
    });

    const responseData = {
      code: 200,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: userId,
          nickname: user.nickname,
          avatar: user.avatar,
          coins: user.coins,
          level: user.level,
          experience: user.experience
        }
      }
    };

    console.log(`[Auth:${requestId}] ========== 登录成功，返回响应 ==========`);
    console.log(`[Auth:${requestId}] 响应数据:`, {
      code: responseData.code,
      message: responseData.message,
      hasToken: !!responseData.data.token,
      tokenLength: responseData.data.token.length,
      hasUserInfo: !!responseData.data.userInfo,
      userInfo: responseData.data.userInfo
    });

    res.json(responseData);
  } catch (error: any) {
    console.error(`[Auth:${requestId}] ❌ ========== 登录错误 ==========`);
    console.error(`[Auth:${requestId}] 错误类型:`, error.constructor.name);
    console.error(`[Auth:${requestId}] 错误消息:`, error.message);
    console.error(`[Auth:${requestId}] 错误堆栈:`, error.stack);
    console.error(`[Auth:${requestId}] 完整错误对象:`, error);
    
    res.status(500).json({
      code: 500,
      message: error.message || '登录失败',
      data: null
    });
  }
});

export default router;


