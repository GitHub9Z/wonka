"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const client_1 = require("react-dom/client");
const antd_1 = require("antd");
const icons_1 = require("@ant-design/icons");
const axios_1 = __importDefault(require("axios"));
require("./login.less");
const Login = () => {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [form] = antd_1.Form.useForm();
    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const response = await axios_1.default.post('/api/admin-auth/login', values);
            const { token } = response.data.data;
            // 保存token
            localStorage.setItem('admin_token', token);
            antd_1.message.success('登录成功');
            // 跳转到管理页面
            window.location.href = '/admin/';
        }
        catch (error) {
            antd_1.message.error(error.response?.data?.message || '登录失败');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="login-container">
      <antd_1.Card className="login-card">
        <div className="login-header">
          <h1>数字艺术馆后台管理</h1>
        </div>

        <antd_1.Form form={form} onFinish={handleSubmit} size="large">
          <antd_1.Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <antd_1.Input prefix={<icons_1.UserOutlined />} placeholder="请输入管理员用户名"/>
          </antd_1.Form.Item>

          <antd_1.Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <antd_1.Input.Password prefix={<icons_1.LockOutlined />} placeholder="请输入密码"/>
          </antd_1.Form.Item>

          <antd_1.Form.Item>
            <antd_1.Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </antd_1.Button>
          </antd_1.Form.Item>
        </antd_1.Form>
      </antd_1.Card>
    </div>);
};
const container = document.getElementById('root');
if (container) {
    const root = (0, client_1.createRoot)(container);
    root.render(<Login />);
}
