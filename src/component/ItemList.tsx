import { Link, Outlet } from 'react-router-dom'
import { Button, Space, Typography } from 'antd'

const { Title, Paragraph } = Typography

function ItemList() {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Title level={3} style={{ margin: 0 }}>
          全部条目
        </Title>
        {/* 相对路径：/items -> /items/new */}
        <Link to="new">
          <Button type="primary">新增条目</Button>
        </Link>
      </Space>

      <Paragraph type="secondary">阶段 2：这里放筛选栏、卡片网格和分页。</Paragraph>

      {/* 新增弹窗挂在这里 */}
      <Outlet />
    </Space>
  )
}

export default ItemList
