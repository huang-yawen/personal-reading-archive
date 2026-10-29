import { Typography } from 'antd'

const { Title, Paragraph } = Typography

function DashBoard() {
  return (
    <>
      <Title level={3}>统计面板</Title>
      <Paragraph type="secondary">
        阶段 7：每月完成数量、评分分布、常用标签。
      </Paragraph>
    </>
  )
}

export default DashBoard
