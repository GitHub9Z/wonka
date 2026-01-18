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
require("./admin.less");
const { Header, Sider, Content } = antd_1.Layout;
const { Search } = antd_1.Input;
const Admin = () => {
    const [collapsed, setCollapsed] = (0, react_1.useState)(false);
    const [activeTab, setActiveTab] = (0, react_1.useState)('dashboard');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [data, setData] = (0, react_1.useState)([]);
    const [stats, setStats] = (0, react_1.useState)({
        users: 0,
        copyrights: 0,
        series: 0,
        shares: 0,
        boxes: 0
    });
    const [pagination, setPagination] = (0, react_1.useState)({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [searchKeyword, setSearchKeyword] = (0, react_1.useState)('');
    const [editingRecord, setEditingRecord] = (0, react_1.useState)(null);
    const [editModalVisible, setEditModalVisible] = (0, react_1.useState)(false);
    const [createModalVisible, setCreateModalVisible] = (0, react_1.useState)(false);
    const [detailRecord, setDetailRecord] = (0, react_1.useState)(null);
    const [detailModalVisible, setDetailModalVisible] = (0, react_1.useState)(false);
    const [seriesList, setSeriesList] = (0, react_1.useState)([]);
    const [form] = antd_1.Form.useForm();
    const menuItems = [
        { key: 'dashboard', icon: <icons_1.DashboardOutlined />, label: '统计概览' },
        { key: 'users', icon: <icons_1.UserOutlined />, label: '用户管理' },
        { key: 'copyrights', icon: <icons_1.CopyrightOutlined />, label: '版权管理' },
        { key: 'series', icon: <icons_1.AppstoreOutlined />, label: '系列管理' },
        { key: 'shares', icon: <icons_1.ShareAltOutlined />, label: '份额管理' },
        { key: 'boxes', icon: <icons_1.GiftOutlined />, label: '开箱记录' }
    ];
    (0, react_1.useEffect)(() => {
        checkAuth();
        loadData();
        if (activeTab === 'copyrights' || activeTab === 'shares') {
            loadSeriesList();
        }
    }, [activeTab, pagination.current, pagination.pageSize, searchKeyword]);
    (0, react_1.useEffect)(() => {
        if (activeTab === 'boxes') {
            loadList();
        }
    }, [activeTab]);
    const loadSeriesList = async () => {
        try {
            const response = await apiRequest('/api/admin/series', {
                params: { page: 1, pageSize: 100 }
            });
            setSeriesList(response.data.data.list || []);
        }
        catch (error) {
            console.error('加载系列列表失败:', error);
        }
    };
    const checkAuth = () => {
        if (!localStorage.getItem('admin_token')) {
            window.location.href = '/admin/login.html';
        }
    };
    const loadData = async () => {
        if (activeTab === 'dashboard') {
            await loadStats();
        }
        else {
            await loadList();
        }
    };
    const loadStats = async () => {
        setLoading(true);
        try {
            const responses = await Promise.all([
                apiRequest('/api/admin/users/count'),
                apiRequest('/api/admin/copyrights/count'),
                apiRequest('/api/admin/series/count'),
                apiRequest('/api/admin/shares/stats').catch(() => ({ data: { data: { popular: [] } } })),
                apiRequest('/api/admin/stats').catch(() => ({ data: { data: { total: { boxes: 0 } } } }))
            ]);
            // 计算总份额数
            const sharesCount = responses[3].data.data?.popular?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
            // 获取开箱记录总数
            const boxesCount = responses[4].data.data?.total?.boxes || 0;
            setStats({
                users: responses[0].data.data.count,
                copyrights: responses[1].data.data.count,
                series: responses[2].data.data.count,
                shares: sharesCount,
                boxes: boxesCount
            });
        }
        catch (error) {
            antd_1.message.error('加载统计数据失败');
        }
        finally {
            setLoading(false);
        }
    };
    const loadList = async () => {
        setLoading(true);
        try {
            const response = await apiRequest(`/api/admin/${activeTab}`, {
                params: {
                    page: pagination.current,
                    pageSize: pagination.pageSize,
                    keyword: searchKeyword
                }
            });
            setData(response.data.data.list);
            setPagination(prev => ({
                ...prev,
                total: response.data.data.total
            }));
        }
        catch (error) {
            antd_1.message.error('加载数据失败');
        }
        finally {
            setLoading(false);
        }
    };
    const apiRequest = async (url, options = {}) => {
        const token = localStorage.getItem('admin_token');
        return (0, axios_1.default)({
            url,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            ...options
        });
    };
    const handleMenuClick = (key) => {
        setActiveTab(key);
        setPagination(prev => ({ ...prev, current: 1 }));
        setSearchKeyword('');
    };
    const handleTableChange = (pagination) => {
        setPagination(pagination);
    };
    const handleSearch = (value) => {
        setSearchKeyword(value);
        setPagination(prev => ({ ...prev, current: 1 }));
    };
    const handleLogout = () => {
        antd_1.Modal.confirm({
            title: '确认退出',
            content: '确定要退出登录吗？',
            onOk() {
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login.html';
            }
        });
    };
    const handleEdit = (record) => {
        setEditingRecord(record);
        const formValues = {
            image: record.image,
            name: record.name,
            description: record.description
        };
        if (activeTab === 'series') {
            formValues.hourlyBonusCoins = record.hourlyBonusCoins || 0;
        }
        else if (activeTab === 'copyrights') {
            formValues.seriesId = record.seriesId?._id || record.seriesId;
            formValues.totalShares = record.totalShares;
            formValues.price = record.price;
            formValues.merchandiseStatus = record.merchandiseStatus;
        }
        else if (activeTab === 'shares') {
            formValues.userId = record.userId?._id || record.userId;
            formValues.copyrightId = record.copyrightId?._id || record.copyrightId;
            formValues.blockchainHash = record.blockchainHash;
            formValues.inLotteryPool = record.inLotteryPool;
        }
        form.setFieldsValue(formValues);
        setEditModalVisible(true);
    };
    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem('admin_token');
            let updateUrl = '';
            if (activeTab === 'series') {
                updateUrl = `/api/admin/series/${editingRecord._id}`;
            }
            else if (activeTab === 'copyrights') {
                updateUrl = `/api/admin/copyrights/${editingRecord._id}`;
            }
            else if (activeTab === 'shares') {
                updateUrl = `/api/admin/shares/${editingRecord._id}`;
            }
            await axios_1.default.put(updateUrl, values, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            antd_1.message.success('更新成功');
            setEditModalVisible(false);
            setEditingRecord(null);
            form.resetFields();
            loadList();
        }
        catch (error) {
            if (error.response) {
                antd_1.message.error(error.response.data?.message || '更新失败');
            }
            else {
                antd_1.message.error('更新失败');
            }
        }
    };
    const handleCreate = () => {
        form.resetFields();
        setCreateModalVisible(true);
    };
    const handleCreateSave = async () => {
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem('admin_token');
            let createUrl = '';
            if (activeTab === 'series') {
                createUrl = '/api/admin/series';
            }
            else if (activeTab === 'copyrights') {
                createUrl = '/api/admin/copyrights';
            }
            else if (activeTab === 'shares') {
                createUrl = '/api/admin/shares';
                // 生成假的区块链hash
                values.blockchainHash = `0x${Math.random().toString(16).substr(2, 64)}`;
            }
            await axios_1.default.post(createUrl, values, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            antd_1.message.success('创建成功');
            setCreateModalVisible(false);
            form.resetFields();
            loadList();
        }
        catch (error) {
            if (error.response) {
                antd_1.message.error(error.response.data?.message || '创建失败');
            }
            else {
                antd_1.message.error('创建失败');
            }
        }
    };
    const handleDelete = (record) => {
        antd_1.Modal.confirm({
            title: '确认删除',
            content: `确定要删除"${record.name || record._id}"吗？`,
            onOk: async () => {
                try {
                    const token = localStorage.getItem('admin_token');
                    let deleteUrl = '';
                    if (activeTab === 'series') {
                        deleteUrl = `/api/admin/series/${record._id}`;
                    }
                    else if (activeTab === 'copyrights') {
                        deleteUrl = `/api/admin/copyrights/${record._id}`;
                    }
                    else if (activeTab === 'shares') {
                        deleteUrl = `/api/admin/shares/${record._id}`;
                    }
                    await axios_1.default.delete(deleteUrl, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    antd_1.message.success('删除成功');
                    loadList();
                }
                catch (error) {
                    if (error.response) {
                        antd_1.message.error(error.response.data?.message || '删除失败');
                    }
                    else {
                        antd_1.message.error('删除失败');
                    }
                }
            }
        });
    };
    const handleViewDetail = async (record) => {
        try {
            const token = localStorage.getItem('admin_token');
            let detailUrl = '';
            if (activeTab === 'series') {
                detailUrl = `/api/admin/series/${record._id}`;
            }
            else if (activeTab === 'copyrights') {
                detailUrl = `/api/admin/copyrights/${record._id}`;
            }
            else if (activeTab === 'shares') {
                detailUrl = `/api/admin/shares/${record._id}`;
            }
            const response = await axios_1.default.get(detailUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setDetailRecord(response.data.data);
            setDetailModalVisible(true);
        }
        catch (error) {
            antd_1.message.error('获取详情失败');
        }
    };
    const getTableColumns = () => {
        switch (activeTab) {
            case 'users':
                return [
                    {
                        title: '头像',
                        dataIndex: 'avatar',
                        render: (avatar) => <antd_1.Avatar src={avatar}/>
                    },
                    { title: '昵称', dataIndex: 'nickname' },
                    { title: '金币', dataIndex: 'galleryCoins', sorter: true, render: (coins) => coins || 0 },
                    {
                        title: '免费盲盒状态',
                        dataIndex: 'freeBoxClaimed',
                        render: (claimed) => (<antd_1.Tag color={claimed ? 'orange' : 'green'}>
                {claimed ? '今日已领取' : '今日未领取'}
              </antd_1.Tag>)
                    },
                    {
                        title: '注册时间',
                        dataIndex: 'createdAt',
                        sorter: true,
                        render: (date) => new Date(date).toLocaleString('zh-CN')
                    }
                ];
            case 'artworks':
                return [
                    {
                        title: '图片',
                        dataIndex: 'image',
                        render: (image) => (<img src={image} alt="藏品图片" style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid #d9d9d9'
                            }}/>)
                    },
                    { title: '名称', dataIndex: 'name' },
                    { title: '艺术家', dataIndex: 'artist' },
                    {
                        title: '稀有度',
                        dataIndex: 'rarity',
                        render: (rarity) => {
                            const colors = { common: 'default', rare: 'blue', epic: 'purple', legendary: 'gold' };
                            const texts = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传奇' };
                            return <antd_1.Tag color={colors[rarity]}>{texts[rarity]}</antd_1.Tag>;
                        }
                    },
                    { title: '价格', dataIndex: 'price', render: (price) => `¥${price}`, sorter: true },
                    {
                        title: '创建时间',
                        dataIndex: 'createdAt',
                        sorter: true,
                        render: (date) => new Date(date).toLocaleString('zh-CN')
                    },
                    {
                        title: '操作',
                        key: 'action',
                        width: 200,
                        render: (_, record) => (<>
                <antd_1.Button type="link" icon={<icons_1.EyeOutlined />} onClick={() => handleViewDetail(record)}>
                  详情
                </antd_1.Button>
                <antd_1.Button type="link" icon={<icons_1.EditOutlined />} onClick={() => handleEdit(record)}>
                  编辑
                </antd_1.Button>
                <antd_1.Button type="link" danger icon={<icons_1.DeleteOutlined />} onClick={() => handleDelete(record)}>
                  删除
                </antd_1.Button>
              </>)
                    }
                ];
            case 'series':
                return [
                    {
                        title: '图片',
                        dataIndex: 'image',
                        render: (image) => (<img src={image} alt="系列图片" style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid #d9d9d9'
                            }}/>)
                    },
                    { title: '名称', dataIndex: 'name' },
                    { title: '描述', dataIndex: 'description' },
                    {
                        title: 'Buff效果（每小时额外金币）',
                        dataIndex: 'hourlyBonusCoins',
                        render: (coins) => coins ? `+${coins.toLocaleString()} 金币/小时` : '0 金币/小时',
                        sorter: true
                    },
                    {
                        title: '创建时间',
                        dataIndex: 'createdAt',
                        sorter: true,
                        render: (date) => new Date(date).toLocaleString('zh-CN')
                    },
                    {
                        title: '操作',
                        key: 'action',
                        width: 200,
                        render: (_, record) => (<>
                <antd_1.Button type="link" icon={<icons_1.EyeOutlined />} onClick={() => handleViewDetail(record)}>
                  详情
                </antd_1.Button>
                <antd_1.Button type="link" icon={<icons_1.EditOutlined />} onClick={() => handleEdit(record)}>
                  编辑
                </antd_1.Button>
                <antd_1.Button type="link" danger icon={<icons_1.DeleteOutlined />} onClick={() => handleDelete(record)}>
                  删除
                </antd_1.Button>
              </>)
                    }
                ];
            case 'copyrights':
                return [
                    {
                        title: '图片',
                        dataIndex: 'image',
                        render: (image) => (<img src={image} alt="版权图片" style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid #d9d9d9'
                            }}/>)
                    },
                    { title: '名称', dataIndex: 'name' },
                    { title: '总份额', dataIndex: 'totalShares' },
                    { title: '已售份额', dataIndex: 'soldShares' },
                    { title: '价格', dataIndex: 'price', render: (price) => `¥${price}`, sorter: true },
                    {
                        title: '商品状态',
                        dataIndex: 'merchandiseStatus',
                        render: (status) => {
                            const badges = {
                                undeveloped: <antd_1.Tag color="default">未开发</antd_1.Tag>,
                                developing: <antd_1.Tag color="orange">开发中</antd_1.Tag>,
                                online: <antd_1.Tag color="green">已上线</antd_1.Tag>
                            };
                            return badges[status];
                        }
                    },
                    {
                        title: '操作',
                        key: 'action',
                        width: 200,
                        render: (_, record) => (<>
                <antd_1.Button type="link" icon={<icons_1.EyeOutlined />} onClick={() => handleViewDetail(record)}>
                  详情
                </antd_1.Button>
                <antd_1.Button type="link" icon={<icons_1.EditOutlined />} onClick={() => handleEdit(record)}>
                  编辑
                </antd_1.Button>
                <antd_1.Button type="link" danger icon={<icons_1.DeleteOutlined />} onClick={() => handleDelete(record)}>
                  删除
                </antd_1.Button>
              </>)
                    }
                ];
            case 'shares':
                return [
                    {
                        title: '用户',
                        dataIndex: 'user',
                        render: (user, record) => {
                            let displayText = '';
                            if (typeof user === 'object' && user !== null) {
                                displayText = user.nickname || user.openId || user._id?.toString() || '';
                            }
                            else if (user) {
                                displayText = String(user);
                            }
                            else {
                                displayText = record.user?.nickname || record.user?.openId || record.userId?.toString() || '未知用户';
                            }
                            return (<antd_1.Button type="link" onClick={() => {
                                    setActiveTab('users');
                                }}>
                  {displayText}
                </antd_1.Button>);
                        }
                    },
                    {
                        title: '版权',
                        dataIndex: 'copyright',
                        render: (copyright, record) => {
                            let displayText = '';
                            let copyrightIdValue = '';
                            if (typeof copyright === 'object' && copyright !== null) {
                                displayText = copyright.name || copyright._id?.toString() || '';
                                copyrightIdValue = copyright._id?.toString() || '';
                            }
                            else if (copyright) {
                                copyrightIdValue = String(copyright);
                                displayText = record.copyright?.name || copyrightIdValue;
                            }
                            else {
                                displayText = record.copyright?.name || '';
                                copyrightIdValue = record.copyrightId?.toString() || record.copyright?._id?.toString() || '';
                            }
                            return (<antd_1.Button type="link" onClick={() => {
                                    setActiveTab('copyrights');
                                    handleViewDetail({ _id: copyrightIdValue });
                                }}>
                  {displayText || copyrightIdValue || '未知版权'}
                </antd_1.Button>);
                        }
                    },
                    {
                        title: '系列',
                        dataIndex: 'series',
                        render: (series, record) => {
                            let displayText = '';
                            let seriesIdValue = '';
                            if (typeof series === 'object' && series !== null) {
                                displayText = series.name || series._id?.toString() || '';
                                seriesIdValue = series._id?.toString() || '';
                            }
                            else if (series) {
                                seriesIdValue = String(series);
                                displayText = record.series?.name || seriesIdValue;
                            }
                            else {
                                displayText = record.series?.name || '';
                                seriesIdValue = record.series?._id?.toString() || '';
                            }
                            if (displayText) {
                                return (<antd_1.Button type="link" onClick={() => {
                                        setActiveTab('series');
                                        handleViewDetail({ _id: seriesIdValue });
                                    }}>
                    {displayText}
                  </antd_1.Button>);
                            }
                            return '-';
                        }
                    },
                    {
                        title: '区块链Hash',
                        dataIndex: 'blockchainHash',
                        render: (hash) => (<span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {hash ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}` : '-'}
              </span>)
                    },
                    {
                        title: '是否在奖池',
                        dataIndex: 'inLotteryPool',
                        render: (inPool) => (<antd_1.Tag color={inPool ? 'green' : 'default'}>
                {inPool ? '是' : '否'}
              </antd_1.Tag>)
                    },
                    {
                        title: '获得时间',
                        dataIndex: 'createdAt',
                        sorter: true,
                        render: (date) => new Date(date).toLocaleString('zh-CN')
                    },
                    {
                        title: '操作',
                        key: 'action',
                        width: 200,
                        render: (_, record) => (<>
                <antd_1.Button type="link" icon={<icons_1.EyeOutlined />} onClick={() => handleViewDetail(record)}>
                  详情
                </antd_1.Button>
                <antd_1.Button type="link" icon={<icons_1.EditOutlined />} onClick={() => handleEdit(record)}>
                  编辑
                </antd_1.Button>
                <antd_1.Button type="link" danger icon={<icons_1.DeleteOutlined />} onClick={() => handleDelete(record)}>
                  删除
                </antd_1.Button>
              </>)
                    }
                ];
            case 'boxes':
                return [
                    {
                        title: '用户',
                        dataIndex: 'userId',
                        render: (userId, record) => {
                            let displayText = '';
                            if (typeof userId === 'object' && userId !== null) {
                                displayText = userId.nickname || userId.openId || userId._id?.toString() || '';
                            }
                            else if (userId) {
                                displayText = String(userId);
                            }
                            else {
                                displayText = record.userId?.nickname || record.userId?.openId || record.userId?._id?.toString() || '未知用户';
                            }
                            return (<antd_1.Button type="link" onClick={() => {
                                    setActiveTab('users');
                                }}>
                  {displayText}
                </antd_1.Button>);
                        }
                    },
                    {
                        title: '盲盒类型',
                        dataIndex: 'boxType',
                        render: (type) => {
                            const types = {
                                normal: { text: '常规盲盒', color: 'blue' },
                                free: { text: '免费盲盒', color: 'green' },
                                series: { text: '系列盲盒', color: 'purple' }
                            };
                            const typeInfo = types[type] || { text: type, color: 'default' };
                            return <antd_1.Tag color={typeInfo.color}>{typeInfo.text}</antd_1.Tag>;
                        }
                    },
                    {
                        title: '奖励类型',
                        dataIndex: 'rewardType',
                        render: (type) => {
                            const types = {
                                coins: { text: '金币', color: 'gold' },
                                fragment: { text: '版权碎片', color: 'cyan' },
                                adCard: { text: '广告卡', color: 'orange' },
                                buffCard: { text: 'Buff卡', color: 'purple' },
                                coupon: { text: '优惠券', color: 'green' }
                            };
                            const typeInfo = types[type] || { text: type, color: 'default' };
                            return <antd_1.Tag color={typeInfo.color}>{typeInfo.text}</antd_1.Tag>;
                        }
                    },
                    {
                        title: '奖励数值',
                        dataIndex: 'rewardValue',
                        render: (value, record) => {
                            if (record.rewardType === 'coins') {
                                return `${value.toLocaleString()} 金币`;
                            }
                            else if (record.rewardType === 'fragment') {
                                return `${value} 碎片`;
                            }
                            else {
                                return value;
                            }
                        }
                    },
                    {
                        title: '关联版权',
                        dataIndex: 'copyrightId',
                        render: (copyrightId, record) => {
                            let displayText = '';
                            let copyrightIdValue = '';
                            if (typeof copyrightId === 'object' && copyrightId !== null) {
                                displayText = copyrightId.name || copyrightId._id?.toString() || '';
                                copyrightIdValue = copyrightId._id?.toString() || '';
                            }
                            else if (copyrightId) {
                                copyrightIdValue = String(copyrightId);
                                displayText = record.copyrightId?.name || copyrightIdValue;
                            }
                            else {
                                displayText = record.copyrightId?.name || '';
                                copyrightIdValue = record.copyrightId?._id?.toString() || record.copyrightId || '';
                            }
                            if (displayText) {
                                return (<antd_1.Button type="link" onClick={() => {
                                        setActiveTab('copyrights');
                                        handleViewDetail({ _id: copyrightIdValue });
                                    }}>
                    {displayText}
                  </antd_1.Button>);
                            }
                            return '-';
                        }
                    },
                    {
                        title: '开箱时间',
                        dataIndex: 'createdAt',
                        sorter: true,
                        render: (date) => new Date(date).toLocaleString('zh-CN')
                    },
                    {
                        title: '操作',
                        key: 'action',
                        width: 100,
                        render: (_, record) => (<antd_1.Button type="link" icon={<icons_1.EyeOutlined />} onClick={() => handleViewDetail(record)}>
                详情
              </antd_1.Button>)
                    }
                ];
            default:
                return [];
        }
    };
    const renderContent = () => {
        if (activeTab === 'dashboard') {
            return (<div className="stats-grid">
          <antd_1.Card>
            <antd_1.Statistic title="总用户数" value={stats.users}/>
          </antd_1.Card>
          <antd_1.Card>
            <antd_1.Statistic title="总版权数" value={stats.copyrights}/>
          </antd_1.Card>
          <antd_1.Card>
            <antd_1.Statistic title="总系列数" value={stats.series}/>
          </antd_1.Card>
          <antd_1.Card>
            <antd_1.Statistic title="总份额数" value={stats.shares}/>
          </antd_1.Card>
          <antd_1.Card>
            <antd_1.Statistic title="总开箱数" value={stats.boxes}/>
          </antd_1.Card>
        </div>);
        }
        return (<antd_1.Card>
        <div className="table-toolbar">
          <h2>{menuItems.find(item => item.key === activeTab)?.label}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab !== 'users' && activeTab !== 'boxes' && (<antd_1.Button type="primary" icon={<icons_1.PlusOutlined />} onClick={handleCreate}>
                新建
              </antd_1.Button>)}
            <Search placeholder="搜索..." onSearch={handleSearch} style={{ width: 300 }}/>
          </div>
        </div>
        <antd_1.Table columns={getTableColumns()} dataSource={data} loading={loading} pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }} onChange={handleTableChange} rowKey="_id"/>
      </antd_1.Card>);
    };
    return (<antd_1.Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo">
          数字艺术馆
        </div>
        <antd_1.Menu theme="dark" mode="inline" selectedKeys={[activeTab]} onClick={({ key }) => handleMenuClick(key)}>
          {menuItems.map(item => (<antd_1.Menu.Item key={item.key} icon={item.icon}>
              {item.label}
            </antd_1.Menu.Item>))}
        </antd_1.Menu>
      </Sider>

      <antd_1.Layout>
        <Header className="header">
          <antd_1.Button type="text" icon={collapsed ? <icons_1.MenuUnfoldOutlined /> : <icons_1.MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} className="trigger-btn"/>
          <div className="header-title">
            {menuItems.find(item => item.key === activeTab)?.label}
          </div>
          <antd_1.Button type="primary" icon={<icons_1.LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </antd_1.Button>
        </Header>

        <Content className="content">
          {renderContent()}
        </Content>
      </antd_1.Layout>

      {/* 编辑模态框 */}
      <antd_1.Modal title="编辑" open={editModalVisible} onOk={handleSave} onCancel={() => {
            setEditModalVisible(false);
            setEditingRecord(null);
            form.resetFields();
        }} okText="保存" cancelText="取消" width={600}>
        <antd_1.Form form={form} layout="vertical">
          {(activeTab === 'series' || activeTab === 'copyrights') && (<>
              <antd_1.Form.Item name="image" label="图片URL" rules={[{ required: true, message: '请输入图片URL' }]}>
                <antd_1.Input placeholder="请输入图片URL"/>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                <antd_1.Input placeholder="请输入名称"/>
              </antd_1.Form.Item>
              {activeTab !== 'copyrights' && (<antd_1.Form.Item name="description" label="描述">
                  <antd_1.Input.TextArea rows={4} placeholder="请输入描述"/>
                </antd_1.Form.Item>)}
              {activeTab === 'copyrights' && (<>
                  <antd_1.Form.Item name="seriesId" label="系列" rules={[{ required: true, message: '请选择系列' }]}>
                    <antd_1.Select placeholder="请选择系列" showSearch>
                      {seriesList.map(series => (<antd_1.Select.Option key={series._id} value={series._id}>
                          {series.name}
                        </antd_1.Select.Option>))}
                    </antd_1.Select>
                  </antd_1.Form.Item>
                  <antd_1.Form.Item name="description" label="描述">
                    <antd_1.Input.TextArea rows={4} placeholder="请输入描述"/>
                  </antd_1.Form.Item>
                  <antd_1.Form.Item name="totalShares" label="总份额" rules={[{ required: true, message: '请输入总份额' }]}>
                    <antd_1.Input type="number" placeholder="请输入总份额"/>
                  </antd_1.Form.Item>
                  <antd_1.Form.Item name="price" label="价格" rules={[{ required: true, message: '请输入价格' }]}>
                    <antd_1.Input type="number" placeholder="请输入价格"/>
                  </antd_1.Form.Item>
                  <antd_1.Form.Item name="merchandiseStatus" label="商品状态">
                    <antd_1.Select>
                      <antd_1.Select.Option value="undeveloped">未开发</antd_1.Select.Option>
                      <antd_1.Select.Option value="developing">开发中</antd_1.Select.Option>
                      <antd_1.Select.Option value="online">已上线</antd_1.Select.Option>
                    </antd_1.Select>
                  </antd_1.Form.Item>
                </>)}
              {activeTab === 'series' && (<antd_1.Form.Item name="hourlyBonusCoins" label="Buff效果（每小时额外金币）" rules={[
                    { required: true, message: '请输入每小时额外金币数量' },
                    { type: 'number', min: 0, message: '金币数量不能小于0' }
                ]}>
                  <antd_1.InputNumber style={{ width: '100%' }} placeholder="请输入每小时额外金币数量" min={0} step={100} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} addonAfter="金币/小时"/>
                </antd_1.Form.Item>)}
            </>)}
          {activeTab === 'shares' && (<>
              <antd_1.Form.Item name="userId" label="用户ID" rules={[{ required: true, message: '请输入用户ID' }]}>
                <antd_1.Input placeholder="请输入用户ID"/>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="copyrightId" label="版权ID" rules={[{ required: true, message: '请输入版权ID' }]}>
                <antd_1.Input placeholder="请输入版权ID"/>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="blockchainHash" label="区块链Hash" rules={[{ required: true, message: '请输入区块链Hash' }]}>
                <antd_1.Input placeholder="请输入区块链Hash"/>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="inLotteryPool" label="是否在奖池" valuePropName="checked">
                <antd_1.Input type="checkbox"/>
              </antd_1.Form.Item>
            </>)}
        </antd_1.Form>
      </antd_1.Modal>

      {/* 创建模态框 */}
      <antd_1.Modal title="新建" open={createModalVisible} onOk={handleCreateSave} onCancel={() => {
            setCreateModalVisible(false);
            form.resetFields();
        }} okText="创建" cancelText="取消" width={600}>
        <antd_1.Form form={form} layout="vertical">
          {activeTab === 'series' && (<>
              <antd_1.Form.Item name="image" label="图片URL" rules={[{ required: true, message: '请输入图片URL' }]}>
                <antd_1.Input placeholder="请输入图片URL"/>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                <antd_1.Input placeholder="请输入名称"/>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="description" label="描述" rules={[{ required: true, message: '请输入描述' }]}>
                <antd_1.Input.TextArea rows={4} placeholder="请输入描述"/>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="hourlyBonusCoins" label="Buff效果（每小时额外金币）" rules={[
                { required: true, message: '请输入每小时额外金币数量' },
                { type: 'number', min: 0, message: '金币数量不能小于0' }
            ]}>
                <antd_1.InputNumber style={{ width: '100%' }} placeholder="请输入每小时额外金币数量" min={0} step={100} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} addonAfter="金币/小时"/>
              </antd_1.Form.Item>
            </>)}
          {activeTab === 'copyrights' && (<>
              <antd_1.Form.Item name="image" label="图片URL" rules={[{ required: true, message: '请输入图片URL' }]}>
                <antd_1.Input placeholder="请输入图片URL"/>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                <antd_1.Input placeholder="请输入名称"/>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="description" label="描述" rules={[{ required: true, message: '请输入描述' }]}>
                <antd_1.Input.TextArea rows={4} placeholder="请输入描述"/>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="seriesId" label="系列" rules={[{ required: true, message: '请选择系列' }]}>
                <antd_1.Select placeholder="请选择系列" showSearch>
                  {seriesList.map(series => (<antd_1.Select.Option key={series._id} value={series._id}>
                      {series.name}
                    </antd_1.Select.Option>))}
                </antd_1.Select>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="merchandiseStatus" label="商品状态" initialValue="undeveloped">
                <antd_1.Select>
                  <antd_1.Select.Option value="undeveloped">未开发</antd_1.Select.Option>
                  <antd_1.Select.Option value="developing">开发中</antd_1.Select.Option>
                  <antd_1.Select.Option value="online">已上线</antd_1.Select.Option>
                </antd_1.Select>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="totalShares" label="总份额" rules={[{ required: true, message: '请输入总份额' }]}>
                <antd_1.Input type="number" placeholder="请输入总份额"/>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="price" label="价格" rules={[{ required: true, message: '请输入价格' }]}>
                <antd_1.Input type="number" placeholder="请输入价格"/>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="merchandiseStatus" label="商品状态" initialValue="undeveloped">
                <antd_1.Input placeholder="undeveloped, developing, online"/>
              </antd_1.Form.Item>
            </>)}
          {activeTab === 'shares' && (<>
              <antd_1.Form.Item name="userId" label="用户ID" rules={[{ required: true, message: '请输入用户ID' }]}>
                <antd_1.Input placeholder="请输入用户ID"/>
              </antd_1.Form.Item>
              <antd_1.Form.Item name="copyrightId" label="版权ID" rules={[{ required: true, message: '请输入版权ID' }]}>
                <antd_1.Input placeholder="请输入版权ID"/>
              </antd_1.Form.Item>
            </>)}
        </antd_1.Form>
      </antd_1.Modal>

      {/* 详情模态框 */}
      <antd_1.Modal title="详情" open={detailModalVisible} onCancel={() => {
            setDetailModalVisible(false);
            setDetailRecord(null);
        }} footer={[
            <antd_1.Button key="close" onClick={() => {
                    setDetailModalVisible(false);
                    setDetailRecord(null);
                }}>
            关闭
          </antd_1.Button>
        ]} width={800}>
        {detailRecord && (<div>
            {detailRecord.image && (<div style={{ textAlign: 'center', marginBottom: 20 }}>
                <img src={detailRecord.image} alt={detailRecord.name} style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}/>
              </div>)}
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px' }}>
              {Object.entries(detailRecord).map(([key, value]) => {
                if (key === '_id' || key === '__v' || key === 'image')
                    return null;
                if (typeof value === 'object' && value !== null) {
                    if (value._id) {
                        return (<react_1.default.Fragment key={key}>
                        <div style={{ fontWeight: 'bold' }}>{key}:</div>
                        <div>
                          <antd_1.Button type="link" onClick={() => {
                                if (key === 'seriesId' || key === 'series') {
                                    setActiveTab('series');
                                    handleViewDetail({ _id: value._id });
                                }
                                else if (key === 'copyrightId' || key === 'copyright') {
                                    setActiveTab('copyrights');
                                    handleViewDetail({ _id: value._id });
                                }
                                else if (key === 'userId' || key === 'user') {
                                    setActiveTab('users');
                                }
                            }}>
                            {value.name || value.nickname || value._id}
                          </antd_1.Button>
                        </div>
                      </react_1.default.Fragment>);
                    }
                    return null;
                }
                return (<react_1.default.Fragment key={key}>
                    <div style={{ fontWeight: 'bold' }}>{key}:</div>
                    <div>{String(value)}</div>
                  </react_1.default.Fragment>);
            })}
            </div>
          </div>)}
      </antd_1.Modal>
    </antd_1.Layout>);
};
const container = document.getElementById('root');
if (container) {
    const root = (0, client_1.createRoot)(container);
    root.render(<Admin />);
}
