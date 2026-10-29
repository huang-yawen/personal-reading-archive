# 路由传递 prop

- 日期：2026-10-29
- 标签：React、react-router-dom

## 能不能传

能。`element` 收的就是普通 JSX，想传什么 prop 就传什么。

```tsx
{ path: 'items/new', element: <ItemDialog mode="create" /> },
{ path: 'items/:id/edit', element: <ItemDialog mode="edit" /> },
```

同一个组件、两个路由、靠 `mode` 区分行为，不用写两套代码。

v5 的 `component={X}` 和 `render={() => <X />}` 在 v6+ 已删除，只剩 `element`。

## 判断标准

**不是「字面量 vs 变量」，而是「模块加载时是否已确定、之后是否需要变」。**

路由配置在 import 时执行一次，`element` 连同它的 props 在那一刻就固定了。

**可以传**

- 字面量：`mode="create"`
- 模块级常量：`pageSize={PAGE_SIZE}`、`mode={MODE.EDIT}`
- 从别处 import 的静态配置

变量完全可以写，模块加载时已求值，和字面量运行时没区别，只是可读性和复用性更好。

**不能传**

- 路由参数：`id={params.id}`，配置时还不存在
- hook 结果：`items={useItems()}`，配置里不能调 hook
- 组件内 state / Context：会冻结成加载那一刻的值
- 在组件里建 router：每次渲染都重建，路由状态被重置
- `Date.now()` 这类快照值：跑起来不报错，但永远停在首次加载的时间

## 一句话判据

> 这个值需要跟着 URL、状态、Context、请求结果变化吗？
> - 不需要 → 写进配置（字面量或模块级常量都行）
> - 需要 → 让组件自己用 `useParams` / `useSearchParams` / `useLoaderData` / `useContext` 取

## 可变对象

配置里的值当**只读快照**对待。

```tsx
const opts = { sort: 'desc' }
element: <ItemList opts={opts} />
```

语法没问题，但因为是同一个引用，事后 `opts.sort = 'asc'` 去改「配置」，组件不会重渲染。

## 想把参数变成 prop

包一层：

```tsx
function ItemDetailRoute() {
  const { id } = useParams()
  return <ItemDetail id={id!} />
}

// 配置里
{ path: 'items/:id', element: <ItemDetailRoute /> }
```

除非组件要脱离路由单独复用（Storybook、单测），直接 `useParams()` 更干净。

## 另外两个配置期传值的出口

- **`handle`**：非渲染用的元数据（面包屑标题、权限标记），配合 `useMatches()` 读
- **`loader` + `useLoaderData()`**：页面数据，渲染前备好，可配 `errorElement`
