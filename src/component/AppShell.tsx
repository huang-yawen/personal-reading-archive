import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BarChartOutlined, ReadOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Layout, Menu, theme } from 'antd'

const { Content, Sider } = Layout

const navItems: MenuProps['items'] = [
  { key: '/', icon: <BarChartOutlined />, label: '统计面板' },
  { key: '/items', icon: <ReadOutlined />, label: '全部条目' },
]

function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  // /items/new、/items/:id、/items/:id/edit 都归到「全部条目」下高亮
  const selectedKey = pathname.startsWith('/items') ? '/items' : '/'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 48,
            margin: 16,
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.15)',
          }}
        />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={navItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Content style={{ margin: 16 }}>
          <div
            style={{
              padding: 24,
              minHeight: '100%',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {/* 子路由（页面 + 弹窗）都渲染在这里 */}
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppShell
