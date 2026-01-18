import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Layout,
  Menu,
  Card,
  Statistic,
  Table,
  Input,
  InputNumber,
  Button,
  Avatar,
  Tag,
  message,
  Modal,
  Form,
  Select
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  PictureOutlined,
  AppstoreOutlined,
  CopyrightOutlined,
  ShareAltOutlined,
  BookOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  GiftOutlined
} from '@ant-design/icons';
import axios from 'axios';
import './admin.less';

const { Header, Sider, Content } = Layout;
const { Search } = Input;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

const Admin: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    accountUsers: 0,
    copyrights: 0,
    series: 0,
    shares: 0,
    boxes: 0
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [form] = Form.useForm();

  const menuItems: MenuItem[] = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '统计概览' },
    { key: 'users', icon: <UserOutlined />, label: '用户管理（微信）' },
    { key: 'account-users', icon: <UserOutlined />, label: '账号用户管理' },
    { key: 'copyrights', icon: <CopyrightOutlined />, label: '版权管理' },
    { key: 'series', icon: <AppstoreOutlined />, label: '系列管理' },
    { key: 'shares', icon: <ShareAltOutlined />, label: '份额管理' },
    { key: 'boxes', icon: <GiftOutlined />, label: '开箱记录' }
  ];

  useEffect(() => {
    checkAuth();
    loadData();
    if (activeTab === 'copyrights' || activeTab === 'shares') {
      loadSeriesList();
    }
  }, [activeTab, pagination.current, pagination.pageSize, searchKeyword]);

  useEffect(() => {
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
    } catch (error) {
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
    } else {
      await loadList();
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const responses = await Promise.all([
        apiRequest('/api/admin/users/count'),
        apiRequest('/api/admin/account-users/count').catch(() => ({ data: { data: { count: 0 } } })),
        apiRequest('/api/admin/copyrights/count'),
        apiRequest('/api/admin/series/count'),
        apiRequest('/api/admin/shares/stats').catch(() => ({ data: { data: { popular: [] } } })),
        apiRequest('/api/admin/stats').catch(() => ({ data: { data: { total: { boxes: 0 } } } }))
      ]);

      // 计算总份额数
      const sharesCount = responses[4].data.data?.popular?.reduce((sum: number, item: any) => sum + (item.count || 0), 0) || 0;
      // 获取开箱记录总数
      const boxesCount = responses[5].data.data?.total?.boxes || 0;

      setStats({
        users: responses[0].data.data.count,
        accountUsers: responses[1].data.data.count,
        copyrights: responses[2].data.data.count,
        series: responses[3].data.data.count,
        shares: sharesCount,
        boxes: boxesCount
      });
    } catch (error) {
      message.error('加载统计数据失败');
    } finally {
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
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const apiRequest = async (url: string, options: any = {}) => {
    const token = localStorage.getItem('admin_token');
    return axios({
      url,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      ...options
    });
  };

  const handleMenuClick = (key: string) => {
    setActiveTab(key);
    setPagination(prev => ({ ...prev, current: 1 }));
    setSearchKeyword('');
  };

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      onOk() {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login.html';
      }
    });
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    const formValues: any = {
      image: record.image,
      name: record.name,
      description: record.description
    };
    
    if (activeTab === 'series') {
      formValues.hourlyBonusCoins = record.hourlyBonusCoins || 0;
    } else if (activeTab === 'copyrights') {
      formValues.seriesId = record.seriesId?._id || record.seriesId;
      formValues.totalShares = record.totalShares;
      formValues.price = record.price;
      formValues.merchandiseStatus = record.merchandiseStatus;
    } else if (activeTab === 'shares') {
      formValues.userId = record.userId?._id || record.userId;
      formValues.copyrightId = record.copyrightId?._id || record.copyrightId;
      formValues.blockchainHash = record.blockchainHash;
      formValues.inLotteryPool = record.inLotteryPool;
    } else if (activeTab === 'account-users') {
      formValues.email = record.email;
      formValues.phone = record.phone;
      formValues.nickname = record.nickname;
      formValues.avatar = record.avatar;
      formValues.coins = record.coins;
      formValues.galleryCoins = record.galleryCoins;
      formValues.level = record.level;
      formValues.experience = record.experience;
      formValues.isMinor = record.isMinor;
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
      } else if (activeTab === 'copyrights') {
        updateUrl = `/api/admin/copyrights/${editingRecord._id}`;
      } else if (activeTab === 'shares') {
        updateUrl = `/api/admin/shares/${editingRecord._id}`;
      } else if (activeTab === 'account-users') {
        updateUrl = `/api/admin/account-users/${editingRecord._id}`;
      }

      await axios.put(updateUrl, values, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      message.success('更新成功');
      setEditModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
      loadList();
    } catch (error: any) {
      if (error.response) {
        message.error(error.response.data?.message || '更新失败');
      } else {
        message.error('更新失败');
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
      } else if (activeTab === 'copyrights') {
        createUrl = '/api/admin/copyrights';
      } else if (activeTab === 'shares') {
        createUrl = '/api/admin/shares';
        // 生成假的区块链hash
        values.blockchainHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      }

      await axios.post(createUrl, values, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      message.success('创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadList();
    } catch (error: any) {
      if (error.response) {
        message.error(error.response.data?.message || '创建失败');
      } else {
        message.error('创建失败');
      }
    }
  };

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: activeTab === 'users' 
        ? `确定要删除用户"${record.nickname || record.openId || record._id}"吗？此操作将同时删除该用户的所有相关数据（版权份额、开箱记录等），且不可恢复！`
        : activeTab === 'account-users'
        ? `确定要删除账号用户"${record.nickname || record.email || record.phone || record._id}"吗？此操作将同时删除该用户的所有相关数据（版权份额、开箱记录等），且不可恢复！`
        : `确定要删除"${record.name || record._id}"吗？`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const token = localStorage.getItem('admin_token');
          let deleteUrl = '';
          if (activeTab === 'series') {
            deleteUrl = `/api/admin/series/${record._id}`;
          } else if (activeTab === 'copyrights') {
            deleteUrl = `/api/admin/copyrights/${record._id}`;
          } else if (activeTab === 'shares') {
            deleteUrl = `/api/admin/shares/${record._id}`;
          } else if (activeTab === 'users') {
            deleteUrl = `/api/admin/users/${record._id}`;
          } else if (activeTab === 'account-users') {
            deleteUrl = `/api/admin/account-users/${record._id}`;
          }

          if (!deleteUrl) {
            message.error('不支持删除此类型的数据');
            return;
          }

          await axios.delete(deleteUrl, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          message.success('删除成功');
          loadList();
        } catch (error: any) {
          if (error.response) {
            message.error(error.response.data?.message || '删除失败');
          } else {
            message.error('删除失败');
          }
        }
      }
    });
  };

  const handleViewDetail = async (record: any) => {
    try {
      const token = localStorage.getItem('admin_token');
      let detailUrl = '';
      if (activeTab === 'series') {
        detailUrl = `/api/admin/series/${record._id}`;
      } else if (activeTab === 'copyrights') {
        detailUrl = `/api/admin/copyrights/${record._id}`;
      } else if (activeTab === 'shares') {
        detailUrl = `/api/admin/shares/${record._id}`;
      } else if (activeTab === 'account-users') {
        detailUrl = `/api/admin/account-users/${record._id}`;
      }

      const response = await axios.get(detailUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setDetailRecord(response.data.data);
      setDetailModalVisible(true);
    } catch (error: any) {
      message.error('获取详情失败');
    }
  };

  const getTableColumns = () => {
    switch (activeTab) {
      case 'users':
        return [
          {
            title: '头像',
            dataIndex: 'avatar',
            render: (avatar: string) => <Avatar src={avatar} />
          },
          { title: '昵称', dataIndex: 'nickname' },
          { title: 'WTC', dataIndex: 'galleryCoins', sorter: true, render: (coins: number) => coins || 0 },
          {
            title: '免费盲盒状态',
            dataIndex: 'freeBoxClaimed',
            render: (claimed: boolean) => (
              <Tag color={claimed ? 'orange' : 'green'}>
                {claimed ? '今日已领取' : '今日未领取'}
              </Tag>
            )
          },
          {
            title: '注册时间',
            dataIndex: 'createdAt',
            sorter: true,
            render: (date: string) => new Date(date).toLocaleString('zh-CN')
          },
          {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_: any, record: any) => (
              <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                删除
              </Button>
            )
          }
        ];
      case 'account-users':
        return [
          {
            title: '头像',
            dataIndex: 'avatar',
            render: (avatar: string) => <Avatar src={avatar || '/default-avatar.png'} />
          },
          { title: '昵称', dataIndex: 'nickname' },
          { 
            title: '邮箱', 
            dataIndex: 'email',
            render: (email: string) => email || '-'
          },
          { 
            title: '手机号', 
            dataIndex: 'phone',
            render: (phone: string) => phone || '-'
          },
          { title: 'WTC', dataIndex: 'coins', sorter: true, render: (coins: number) => coins || 0 },
          { title: '馆币', dataIndex: 'galleryCoins', sorter: true, render: (coins: number) => coins || 0 },
          { title: '等级', dataIndex: 'level', sorter: true },
          { title: '经验值', dataIndex: 'experience', sorter: true },
          {
            title: '注册时间',
            dataIndex: 'createdAt',
            sorter: true,
            render: (date: string) => new Date(date).toLocaleString('zh-CN')
          },
          {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_: any, record: any) => (
              <>
                <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
                  详情
                </Button>
                <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                  编辑
                </Button>
                <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                  删除
                </Button>
              </>
            )
          }
        ];
      case 'artworks':
        return [
          {
            title: '图片',
            dataIndex: 'image',
            render: (image: string) => (
              <img
                src={image}
                alt="藏品图片"
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9'
                }}
              />
            )
          },
          { title: '名称', dataIndex: 'name' },
          { title: '艺术家', dataIndex: 'artist' },
          {
            title: '稀有度',
            dataIndex: 'rarity',
            render: (rarity: string) => {
              const colors = { common: 'default', rare: 'blue', epic: 'purple', legendary: 'gold' };
              const texts = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传奇' };
              return <Tag color={colors[rarity as keyof typeof colors]}>{texts[rarity as keyof typeof texts]}</Tag>;
            }
          },
          { title: '价格', dataIndex: 'price', render: (price: number) => `¥${price}`, sorter: true },
          {
            title: '创建时间',
            dataIndex: 'createdAt',
            sorter: true,
            render: (date: string) => new Date(date).toLocaleString('zh-CN')
          },
          {
            title: '操作',
            key: 'action',
            width: 200,
            render: (_: any, record: any) => (
              <>
                <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
                  详情
                </Button>
                <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                  编辑
                </Button>
                <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                  删除
                </Button>
              </>
            )
          }
        ];
      case 'series':
        return [
          {
            title: '图片',
            dataIndex: 'image',
            render: (image: string) => (
              <img
                src={image}
                alt="系列图片"
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9'
                }}
              />
            )
          },
          { title: '名称', dataIndex: 'name' },
          { title: '描述', dataIndex: 'description' },
          {
            title: 'Buff效果（每小时额外WTC）',
            dataIndex: 'hourlyBonusCoins',
            render: (coins: number) => coins ? `+${coins.toLocaleString()} WTC/小时` : '0 WTC/小时',
            sorter: true
          },
          {
            title: '创建时间',
            dataIndex: 'createdAt',
            sorter: true,
            render: (date: string) => new Date(date).toLocaleString('zh-CN')
          },
          {
            title: '操作',
            key: 'action',
            width: 200,
            render: (_: any, record: any) => (
              <>
                <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
                  详情
                </Button>
                <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                  编辑
                </Button>
                <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                  删除
                </Button>
              </>
            )
          }
        ];
      case 'copyrights':
        return [
          {
            title: '图片',
            dataIndex: 'image',
            render: (image: string) => (
              <img
                src={image}
                alt="版权图片"
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9'
                }}
              />
            )
          },
          { title: '名称', dataIndex: 'name' },
          { title: '总份额', dataIndex: 'totalShares' },
          { title: '已售份额', dataIndex: 'soldShares' },
          { title: '价格', dataIndex: 'price', render: (price: number) => `¥${price}`, sorter: true },
          {
            title: '商品状态',
            dataIndex: 'merchandiseStatus',
            render: (status: string) => {
              const badges = {
                undeveloped: <Tag color="default">未开发</Tag>,
                developing: <Tag color="orange">开发中</Tag>,
                online: <Tag color="green">已上线</Tag>
              };
              return badges[status as keyof typeof badges];
            }
          },
          {
            title: '操作',
            key: 'action',
            width: 200,
            render: (_: any, record: any) => (
              <>
                <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
                  详情
                </Button>
                <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                  编辑
                </Button>
                <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                  删除
                </Button>
              </>
            )
          }
        ];
      case 'shares':
        return [
          {
            title: '用户',
            dataIndex: 'user',
            render: (user: any, record: any) => {
              let displayText = '';
              if (typeof user === 'object' && user !== null) {
                displayText = user.nickname || user.openId || user._id?.toString() || '';
              } else if (user) {
                displayText = String(user);
              } else {
                displayText = record.user?.nickname || record.user?.openId || record.userId?.toString() || '未知用户';
              }
              return (
                <Button type="link" onClick={() => {
                  setActiveTab('users');
                }}>
                  {displayText}
                </Button>
              );
            }
          },
          {
            title: '版权',
            dataIndex: 'copyright',
            render: (copyright: any, record: any) => {
              let displayText = '';
              let copyrightIdValue = '';
              
              if (typeof copyright === 'object' && copyright !== null) {
                displayText = copyright.name || copyright._id?.toString() || '';
                copyrightIdValue = copyright._id?.toString() || '';
              } else if (copyright) {
                copyrightIdValue = String(copyright);
                displayText = record.copyright?.name || copyrightIdValue;
              } else {
                displayText = record.copyright?.name || '';
                copyrightIdValue = record.copyrightId?.toString() || record.copyright?._id?.toString() || '';
              }
              
              return (
                <Button type="link" onClick={() => {
                  setActiveTab('copyrights');
                  handleViewDetail({ _id: copyrightIdValue });
                }}>
                  {displayText || copyrightIdValue || '未知版权'}
                </Button>
              );
            }
          },
          {
            title: '系列',
            dataIndex: 'series',
            render: (series: any, record: any) => {
              let displayText = '';
              let seriesIdValue = '';
              
              if (typeof series === 'object' && series !== null) {
                displayText = series.name || series._id?.toString() || '';
                seriesIdValue = series._id?.toString() || '';
              } else if (series) {
                seriesIdValue = String(series);
                displayText = record.series?.name || seriesIdValue;
              } else {
                displayText = record.series?.name || '';
                seriesIdValue = record.series?._id?.toString() || '';
              }
              
              if (displayText) {
                return (
                  <Button type="link" onClick={() => {
                    setActiveTab('series');
                    handleViewDetail({ _id: seriesIdValue });
                  }}>
                    {displayText}
                  </Button>
                );
              }
              return '-';
            }
          },
          {
            title: '区块链Hash',
            dataIndex: 'blockchainHash',
            render: (hash: string) => (
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {hash ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}` : '-'}
              </span>
            )
          },
          {
            title: '是否在奖池',
            dataIndex: 'inLotteryPool',
            render: (inPool: boolean) => (
              <Tag color={inPool ? 'green' : 'default'}>
                {inPool ? '是' : '否'}
              </Tag>
            )
          },
          {
            title: '获得时间',
            dataIndex: 'createdAt',
            sorter: true,
            render: (date: string) => new Date(date).toLocaleString('zh-CN')
          },
          {
            title: '操作',
            key: 'action',
            width: 200,
            render: (_: any, record: any) => (
              <>
                <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
                  详情
                </Button>
                <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                  编辑
                </Button>
                <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                  删除
                </Button>
              </>
            )
          }
        ];
      case 'boxes':
        return [
          {
            title: '用户',
            dataIndex: 'userId',
            render: (userId: any, record: any) => {
              let displayText = '';
              if (typeof userId === 'object' && userId !== null) {
                displayText = userId.nickname || userId.openId || userId._id?.toString() || '';
              } else if (userId) {
                displayText = String(userId);
              } else {
                displayText = record.userId?.nickname || record.userId?.openId || record.userId?._id?.toString() || '未知用户';
              }
              return (
                <Button type="link" onClick={() => {
                  setActiveTab('users');
                }}>
                  {displayText}
                </Button>
              );
            }
          },
          {
            title: '盲盒类型',
            dataIndex: 'boxType',
            render: (type: string) => {
              const types: { [key: string]: { text: string; color: string } } = {
                normal: { text: '常规盲盒', color: 'blue' },
                free: { text: '免费盲盒', color: 'green' },
                series: { text: '系列盲盒', color: 'purple' }
              };
              const typeInfo = types[type] || { text: type, color: 'default' };
              return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
            }
          },
          {
            title: '奖励类型',
            dataIndex: 'rewardType',
            render: (type: string) => {
              const types: { [key: string]: { text: string; color: string } } = {
                coins: { text: 'WTC', color: 'gold' },
                fragment: { text: '版权碎片', color: 'cyan' },
                adCard: { text: '广告卡', color: 'orange' },
                buffCard: { text: 'Buff卡', color: 'purple' },
                coupon: { text: '优惠券', color: 'green' }
              };
              const typeInfo = types[type] || { text: type, color: 'default' };
              return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
            }
          },
          {
            title: '奖励数值',
            dataIndex: 'rewardValue',
            render: (value: number, record: any) => {
              if (record.rewardType === 'coins') {
                return `${value.toLocaleString()} WTC`;
              } else if (record.rewardType === 'fragment') {
                return `${value} 碎片`;
              } else {
                return value;
              }
            }
          },
          {
            title: '关联版权',
            dataIndex: 'copyrightId',
            render: (copyrightId: any, record: any) => {
              let displayText = '';
              let copyrightIdValue = '';
              
              if (typeof copyrightId === 'object' && copyrightId !== null) {
                displayText = copyrightId.name || copyrightId._id?.toString() || '';
                copyrightIdValue = copyrightId._id?.toString() || '';
              } else if (copyrightId) {
                copyrightIdValue = String(copyrightId);
                displayText = record.copyrightId?.name || copyrightIdValue;
              } else {
                displayText = record.copyrightId?.name || '';
                copyrightIdValue = record.copyrightId?._id?.toString() || record.copyrightId || '';
              }
              
              if (displayText) {
                return (
                  <Button type="link" onClick={() => {
                    setActiveTab('copyrights');
                    handleViewDetail({ _id: copyrightIdValue });
                  }}>
                    {displayText}
                  </Button>
                );
              }
              return '-';
            }
          },
          {
            title: '开箱时间',
            dataIndex: 'createdAt',
            sorter: true,
            render: (date: string) => new Date(date).toLocaleString('zh-CN')
          },
          {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_: any, record: any) => (
              <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
                详情
              </Button>
            )
          }
        ];
      default:
        return [];
    }
  };

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <div className="stats-grid">
          <Card>
            <Statistic title="总用户数（微信）" value={stats.users} />
          </Card>
          <Card>
            <Statistic title="总账号用户数" value={stats.accountUsers} />
          </Card>
          <Card>
            <Statistic title="总版权数" value={stats.copyrights} />
          </Card>
          <Card>
            <Statistic title="总系列数" value={stats.series} />
          </Card>
          <Card>
            <Statistic title="总份额数" value={stats.shares} />
          </Card>
          <Card>
            <Statistic title="总开箱数" value={stats.boxes} />
          </Card>
        </div>
      );
    }

    return (
      <Card>
        <div className="table-toolbar">
          <h2>{menuItems.find(item => item.key === activeTab)?.label}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab !== 'users' && activeTab !== 'boxes' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                新建
              </Button>
            )}
            <Search
              placeholder="搜索..."
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
          </div>
        </div>
        <Table
          columns={getTableColumns()}
          dataSource={data}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          onChange={handleTableChange}
          rowKey="_id"
        />
      </Card>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo">
          数字艺术馆
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeTab]}
          onClick={({ key }) => handleMenuClick(key)}
        >
          {menuItems.map(item => (
            <Menu.Item key={item.key} icon={item.icon}>
              {item.label}
            </Menu.Item>
          ))}
        </Menu>
      </Sider>

      <Layout>
        <Header className="header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="trigger-btn"
          />
          <div className="header-title">
            {menuItems.find(item => item.key === activeTab)?.label}
          </div>
          <Button
            type="primary"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </Header>

        <Content className="content">
          {renderContent()}
        </Content>
      </Layout>

      {/* 编辑模态框 */}
      <Modal
        title="编辑"
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          {activeTab === 'account-users' && (
            <>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { type: 'email', message: '邮箱格式不正确' }
                ]}
              >
                <Input placeholder="请输入邮箱（可选）" />
              </Form.Item>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确（应为11位数字）' }
                ]}
              >
                <Input placeholder="请输入手机号（可选）" />
              </Form.Item>
              <Form.Item
                name="nickname"
                label="昵称"
                rules={[{ required: true, message: '请输入昵称' }]}
              >
                <Input placeholder="请输入昵称" />
              </Form.Item>
              <Form.Item
                name="avatar"
                label="头像URL"
              >
                <Input placeholder="请输入头像URL（可选）" />
              </Form.Item>
              <Form.Item
                name="coins"
                label="WTC"
                rules={[{ required: true, message: '请输入WTC' }]}
              >
                <InputNumber min={0} placeholder="请输入WTC" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="galleryCoins"
                label="馆币"
                rules={[{ required: true, message: '请输入馆币' }]}
              >
                <InputNumber min={0} placeholder="请输入馆币" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="level"
                label="等级"
                rules={[{ required: true, message: '请输入等级' }]}
              >
                <InputNumber min={1} placeholder="请输入等级" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="experience"
                label="经验值"
                rules={[{ required: true, message: '请输入经验值' }]}
              >
                <InputNumber min={0} placeholder="请输入经验值" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="isMinor"
                label="是否未成年人"
              >
                <Select placeholder="请选择">
                  <Select.Option value={false}>否</Select.Option>
                  <Select.Option value={true}>是</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}
          {(activeTab === 'series' || activeTab === 'copyrights') && (
            <>
              <Form.Item
                name="image"
                label="图片URL"
                rules={[{ required: true, message: '请输入图片URL' }]}
              >
                <Input placeholder="请输入图片URL" />
              </Form.Item>
              <Form.Item
                name="name"
                label="名称"
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input placeholder="请输入名称" />
              </Form.Item>
              {activeTab !== 'copyrights' && (
                <Form.Item
                  name="description"
                  label="描述"
                >
                  <Input.TextArea rows={4} placeholder="请输入描述" />
                </Form.Item>
              )}
              {activeTab === 'copyrights' && (
                <>
                  <Form.Item
                    name="seriesId"
                    label="系列"
                    rules={[{ required: true, message: '请选择系列' }]}
                  >
                    <Select placeholder="请选择系列" showSearch>
                      {seriesList.map(series => (
                        <Select.Option key={series._id} value={series._id}>
                          {series.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="description"
                    label="描述"
                  >
                    <Input.TextArea rows={4} placeholder="请输入描述" />
                  </Form.Item>
                  <Form.Item
                    name="totalShares"
                    label="总份额"
                    rules={[{ required: true, message: '请输入总份额' }]}
                  >
                    <Input type="number" placeholder="请输入总份额" />
                  </Form.Item>
                  <Form.Item
                    name="price"
                    label="价格"
                    rules={[{ required: true, message: '请输入价格' }]}
                  >
                    <Input type="number" placeholder="请输入价格" />
                  </Form.Item>
                  <Form.Item
                    name="merchandiseStatus"
                    label="商品状态"
                  >
                    <Select>
                      <Select.Option value="undeveloped">未开发</Select.Option>
                      <Select.Option value="developing">开发中</Select.Option>
                      <Select.Option value="online">已上线</Select.Option>
                    </Select>
                  </Form.Item>
                </>
              )}
              {activeTab === 'series' && (
                <Form.Item
                  name="hourlyBonusCoins"
                  label="Buff效果（每小时额外WTC）"
                  rules={[
                    { required: true, message: '请输入每小时额外WTC数量' },
                    { type: 'number', min: 0, message: 'WTC数量不能小于0' }
                  ]}
                >
                  <InputNumber 
                    style={{ width: '100%' }}
                    placeholder="请输入每小时额外WTC数量"
                    min={0}
                    step={100}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                    addonAfter="WTC/小时"
                  />
                </Form.Item>
              )}
            </>
          )}
          {activeTab === 'shares' && (
            <>
              <Form.Item
                name="userId"
                label="用户ID"
                rules={[{ required: true, message: '请输入用户ID' }]}
              >
                <Input placeholder="请输入用户ID" />
              </Form.Item>
              <Form.Item
                name="copyrightId"
                label="版权ID"
                rules={[{ required: true, message: '请输入版权ID' }]}
              >
                <Input placeholder="请输入版权ID" />
              </Form.Item>
              <Form.Item
                name="blockchainHash"
                label="区块链Hash"
                rules={[{ required: true, message: '请输入区块链Hash' }]}
              >
                <Input placeholder="请输入区块链Hash" />
              </Form.Item>
              <Form.Item
                name="inLotteryPool"
                label="是否在奖池"
                valuePropName="checked"
              >
                <Input type="checkbox" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* 创建模态框 */}
      <Modal
        title="新建"
        open={createModalVisible}
        onOk={handleCreateSave}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        okText="创建"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          {activeTab === 'series' && (
            <>
              <Form.Item
                name="image"
                label="图片URL"
                rules={[{ required: true, message: '请输入图片URL' }]}
              >
                <Input placeholder="请输入图片URL" />
              </Form.Item>
              <Form.Item
                name="name"
                label="名称"
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input placeholder="请输入名称" />
              </Form.Item>
              <Form.Item
                name="description"
                label="描述"
                rules={[{ required: true, message: '请输入描述' }]}
              >
                <Input.TextArea rows={4} placeholder="请输入描述" />
              </Form.Item>
              <Form.Item
                name="hourlyBonusCoins"
                label="Buff效果（每小时额外WTC）"
                rules={[
                  { required: true, message: '请输入每小时额外WTC数量' },
                  { type: 'number', min: 0, message: 'WTC数量不能小于0' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  placeholder="请输入每小时额外WTC数量"
                  min={0}
                  step={100}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="WTC/小时"
                />
              </Form.Item>
            </>
          )}
          {activeTab === 'copyrights' && (
            <>
              <Form.Item
                name="image"
                label="图片URL"
                rules={[{ required: true, message: '请输入图片URL' }]}
              >
                <Input placeholder="请输入图片URL" />
              </Form.Item>
              <Form.Item
                name="name"
                label="名称"
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input placeholder="请输入名称" />
              </Form.Item>
              <Form.Item
                name="description"
                label="描述"
                rules={[{ required: true, message: '请输入描述' }]}
              >
                <Input.TextArea rows={4} placeholder="请输入描述" />
              </Form.Item>
              <Form.Item
                name="seriesId"
                label="系列"
                rules={[{ required: true, message: '请选择系列' }]}
              >
                <Select placeholder="请选择系列" showSearch>
                  {seriesList.map(series => (
                    <Select.Option key={series._id} value={series._id}>
                      {series.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="merchandiseStatus"
                label="商品状态"
                initialValue="undeveloped"
              >
                <Select>
                  <Select.Option value="undeveloped">未开发</Select.Option>
                  <Select.Option value="developing">开发中</Select.Option>
                  <Select.Option value="online">已上线</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="totalShares"
                label="总份额"
                rules={[{ required: true, message: '请输入总份额' }]}
              >
                <Input type="number" placeholder="请输入总份额" />
              </Form.Item>
              <Form.Item
                name="price"
                label="价格"
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <Input type="number" placeholder="请输入价格" />
              </Form.Item>
              <Form.Item
                name="merchandiseStatus"
                label="商品状态"
                initialValue="undeveloped"
              >
                <Input placeholder="undeveloped, developing, online" />
              </Form.Item>
            </>
          )}
          {activeTab === 'shares' && (
            <>
              <Form.Item
                name="userId"
                label="用户ID"
                rules={[{ required: true, message: '请输入用户ID' }]}
              >
                <Input placeholder="请输入用户ID" />
              </Form.Item>
              <Form.Item
                name="copyrightId"
                label="版权ID"
                rules={[{ required: true, message: '请输入版权ID' }]}
              >
                <Input placeholder="请输入版权ID" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* 详情模态框 */}
      <Modal
        title="详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setDetailRecord(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalVisible(false);
            setDetailRecord(null);
          }}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {detailRecord && (
          <div>
            {detailRecord.image && (
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <img
                  src={detailRecord.image}
                  alt={detailRecord.name}
                  style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px' }}>
              {Object.entries(detailRecord).map(([key, value]: [string, any]) => {
                if (key === '_id' || key === '__v' || key === 'image') return null;
                if (typeof value === 'object' && value !== null) {
                  if (value._id) {
                    return (
                      <React.Fragment key={key}>
                        <div style={{ fontWeight: 'bold' }}>{key}:</div>
                        <div>
                          <Button type="link" onClick={() => {
                            if (key === 'seriesId' || key === 'series') {
                              setActiveTab('series');
                              handleViewDetail({ _id: value._id });
                            } else if (key === 'copyrightId' || key === 'copyright') {
                              setActiveTab('copyrights');
                              handleViewDetail({ _id: value._id });
                            } else if (key === 'userId' || key === 'user') {
                              setActiveTab('users');
                            }
                          }}>
                            {value.name || value.nickname || value._id}
                          </Button>
                        </div>
                      </React.Fragment>
                    );
                  }
                  return null;
                }
                return (
                  <React.Fragment key={key}>
                    <div style={{ fontWeight: 'bold' }}>{key}:</div>
                    <div>{String(value)}</div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Admin />);
}
