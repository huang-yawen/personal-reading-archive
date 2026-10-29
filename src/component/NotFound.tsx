import { Link } from 'react-router-dom'
import { Button, Result } from 'antd'

function NotFound() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="这个页面不存在"
      extra={
        <Link to="/">
          <Button type="primary">回到统计面板</Button>
        </Link>
      }
    />
  )
}

export default NotFound
