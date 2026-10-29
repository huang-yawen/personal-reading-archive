import { createBrowserRouter } from 'react-router-dom'
import AppShell from '../component/AppShell'
import DashBoard from '../component/DashBoard'
import ItemList from '../component/ItemList'
import ItemDetail from '../component/ItemDetail'
import ItemDialog from '../component/ItemDialog'
import NotFound from '../component/NotFound'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      // 统计面板
      { index: true, element: <DashBoard /> },

      // 列表 + 新增弹窗（弹窗渲染在 ItemList 的 <Outlet /> 里）
      {
        path: 'items',
        element: <ItemList />,
        children: [{ path: 'new', element: <ItemDialog mode="create" /> }],
      },

      // 详情 + 编辑弹窗（弹窗渲染在 ItemDetail 的 <Outlet /> 里）
      {
        path: 'items/:id',
        element: <ItemDetail />,
        children: [{ path: 'edit', element: <ItemDialog mode="edit" /> }],
      },

      // 兜底
      { path: '*', element: <NotFound /> },
    ],
  },
])
