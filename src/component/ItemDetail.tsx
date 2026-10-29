import { Link, Outlet, useParams } from 'react-router-dom'
import { Button, Space, Typography } from 'antd'

const { Title, Paragraph } = Typography

function ItemDetail() {
  const { id } = useParams()

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Link to="/items">← 返回列表</Link>

      <Title level={3} style={{ margin: 0 }}>
        条目详情 #{id}
      </Title>

      <Paragraph type="secondary">
        阶段 3：封面、标题、简介、短评、阅读/观影记录。
      </Paragraph>

      <div>
        {/* 相对路径：/items/12 -> /items/12/edit */}
        <Link to="edit">
          <Button type="primary">编辑</Button>
        </Link>
      </div>

      {/* 编辑弹窗挂在这里 */}
      <Outlet />
    </Space>
  )
}

export default ItemDetail
