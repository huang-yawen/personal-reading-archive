import { useNavigate, useParams } from 'react-router-dom'
import { Modal } from 'antd'

type ItemDialogProps = {
  mode: 'create' | 'edit'
}

function ItemDialog({ mode }: ItemDialogProps) {
  const navigate = useNavigate()
  const { id } = useParams()

  // 关闭弹窗 = 回到父路由（/items 或 /items/:id）。
  // 用 replace 避免按浏览器返回键又把弹窗打开。
  const close = () => navigate('..', { replace: true })

  return (
    <Modal
      open
      title={mode === 'create' ? '新增条目' : `编辑条目 #${id}`}
      onCancel={close}
      footer={null}
      width={640}
    >
      <p>阶段 {mode === 'create' ? '4' : '5'}：这里放 ItemForm。</p>
    </Modal>
  )
}

export default ItemDialog
