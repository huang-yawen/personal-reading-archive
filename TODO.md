# TODO · 个人阅读与观影档案

> 用途：这是本项目的唯一执行计划。**建功能时按本文件的阶段顺序写，审代码时按本文件的验收标准和评审清单逐条过。**
> 每次评审后，在文末「评审记录」里追加一条，并勾掉已完成的项。

## 目标与范围

练习 Node.js + TypeScript 后端、React + TypeScript 前端。设计已被提前定死，不需要做视觉决策。

**核心需求（验收总纲）**

- [ ] 用户管理书籍和电影：新增、编辑、删除、查看详情
- [ ] 支持状态、评分、标签、短评和完成日期
- [ ] 列表支持搜索、类型/状态/标签筛选、排序和分页
- [ ] 详情页展示条目内容和阅读/观影记录
- [ ] 统计面板展示每月完成数量、评分分布和常用标签
- [ ] 数据库保存所有条目；前端正确显示加载、空结果和请求失败状态

**明确不做（防范围膨胀）**

- 登录 / 注册 / 用户管理页面
- 设置页、独立标签管理页
- 图表库、状态管理库、React Query（UI 组件用已安装的 antd）
- 封面图片上传（`cover_url` 只存外链或留空）

## 已定决策（改动需先讨论）

| 项 | 决定 |
|---|---|
| 用户身份 | 后端集中常量 `DEMO_USER_ID = 1`，每条 SQL 都带 `user_id` |
| 列表响应 | `{ data: [], pagination: { page, pageSize, total } }` |
| 错误响应 | `{ error: { message } }` + 恰当的 4xx / 5xx |
| 分页 | `page` + `pageSize`；排序必须有唯一兜底（如 `completed_on DESC, id DESC`） |
| 类型共享 | 后端 `types.ts`，前端手动对齐一份，不做共享包 |
| 路由 | `react-router-dom` v7 `createBrowserRouter`，`/items` 等见下方页面地图 |
| 弹窗 | **路由驱动**：`/items/new`、`/items/:id/edit` 是子路由，渲染在父页面的 `<Outlet />` 里；关闭用 `navigate('..', { replace: true })`，这样可深链、可刷新、返回键即关闭 |
| 列表状态源 | 筛选/排序/页码全部放 URL query（`useSearchParams`），不放 `useState` |
| 请求层 | `src/api.ts` 里一个 `request<T>()`，页面用 `useEffect + useState` 管三态 |
| 样式 | UI 用 antd v6，配合 `theme.useToken()`；不额外引图表库 |
| 列表布局 | 卡片网格 `repeat(auto-fill, minmax(220px, 1fr))` |
| 评分展示 | 直接显示数字（如 `9.5`），不做星星 |

## 页面地图

| 路由 | 页面 | 对应需求 | 依赖接口 |
|---|---|---|---|
| `/` | 统计面板 | 每月完成、评分分布、常用标签 | `GET /api/stats` |
| `/items` | 条目列表 | 搜索/筛选/排序/分页 | `GET /api/items`、`GET /api/tags` |
| `/items/new` | 新增条目 · **弹窗**（挂在 `/items` 上） | 新增 | `POST /api/items` |
| `/items/:id` | 条目详情 | 详情、短评、记录、编辑/删除入口 | `GET /api/items/:id`、`POST /api/items/:id/logs`、`DELETE /api/items/:id` |
| `/items/:id/edit` | 编辑条目 · **弹窗**（挂在 `/items/:id` 上） | 编辑（含状态/评分/标签/完成日期） | `GET /api/items/:id`、`PUT /api/items/:id` |
| `*` | 404 | — | — |

## 组件清单

- [x] `AppShell` — 左侧导航 + 内容区，含 `Outlet`
- [ ] `StateView` — 统一 loading / error(带重试) / empty 三态，所有页面复用
- [ ] `ItemCard` — 列表卡片
- [ ] `ItemFilters` — 筛选栏，只负责写回 URL
- [ ] `Pagination` — 页码控制
- [ ] `TagChip` — 带颜色的标签
- [ ] `Rating` — 评分数字展示
- [ ] `ItemForm` — 新增/编辑共用，放在 `ItemDialog` 里
- [x] `ItemDialog` — 路由驱动的新增/编辑弹窗（骨架已建，阶段 4/5 填表单）
- [ ] `UnsavedChangesGuard` — 表单有改动时，Esc/点遮罩关闭前确认
- [ ] `ActivityTimeline` / `ActivityForm` — 记录展示与新增
- [ ] `StatBar` — 统计横条
- [ ] `ConfirmDialog` — 删除确认（可复用 antd `Modal.confirm`）

---

## 阶段 0 · 环境与配置

- [x] `server/.env` 修正拼写 `DN_NAME` → `DB_NAME`
- [ ] 在 `.gitignore` 追加 `.env`（当前数据库密码未被忽略）
- [ ] 新增 `server/.env.example`（只放键名）
- [x] `vite.config.ts` 配置代理 `/api` → `http://localhost:3000`（端口已定为 5175 + `strictPort`）
- [ ] 用 `server/database/schema.sql` 建库并确认种子数据可查
- [ ] 后端 `GET /api/health` 能通，并确认连接池真的能查库（现在连接池建了但没人用）
- [ ] 待确认：`rating DECIMAL(2,1)` 上限只有 9.9，无法存 10.0 → 是否改 `DECIMAL(3,1)`
- [ ] 待确认：README 仍是 Vite 模板，是否改写为项目说明
- [ ] 待确认：`ant-design@1.0.0` 疑似误装（实际用的是 `antd`），是否 `pnpm remove ant-design`
- [ ] 待确认：`src/main.tsx` 里 `import './index.css'` 被注释，是否恢复（目前页面没有全局基础样式）

## 阶段 1 · 前端骨架

- [x] 安装 `react-router-dom`（v7）
- [x] `AppShell`：antd `Layout` + `Sider` 折叠导航（统计面板 / 全部条目），含 `Outlet`
- [x] 路由配置：`src/router/index.tsx`，`createBrowserRouter` + 嵌套子路由（新增/编辑为弹窗）
- [x] 404 页面（`NotFound`，antd `Result`）
- [x] 删掉 `App.tsx` 里的 Vite 模板欢迎页内容，改为 `RouterProvider`
- [ ] 移动端把 Sider 折叠为顶部导航（当前只有手动折叠，没有响应式）

**验收**

- [x] 每个路由都能直接访问（刷新不白屏）
- [x] 导航高亮跟随当前路由（`/items/:id` 也归到「全部条目」）
- [ ] 手动验证：`/`、`/items`、`/items/new`、`/items/1`、`/items/1/edit`、`/xxx` 六个地址

## 阶段 2 · 列表页（第一条垂直切片）

**后端**

- [ ] `GET /api/items`：支持 `type`、`status`、`tag`、`q`、`sort`、`page`、`pageSize`
- [ ] 返回 `{ data, pagination }`；导航类字段（tags）一次查完，禁止 N+1
- [ ] 全部 SQL 参数化；`page`/`pageSize` 做上下限校验
- [x] `GET /api/tags` 返回当前用户标签（`routes/tags.ts` → `database/tags.ts`）
- [ ] 不传筛选条件时的默认排序明确（建议 `created_at DESC, id DESC`）

**前端**

- [ ] `api.ts` 的 `request<T>()`：非 2xx 解析错误信息并抛出
- [ ] `StateView` 三态组件
- [ ] `ItemCard` + 卡片网格
- [ ] `Pagination`：上一页 / 第 x 页 / 下一页
- [ ] URL 作为筛选状态唯一来源，刷新与回退都不丢

**验收**

- [ ] 加载中 / 空结果 / 请求失败 / 有数据 四种状态都能人为复现
- [ ] 空结果文案区分「没有任何条目」与「筛选无结果」
- [ ] 断网或后端关闭时显示失败态且可重试
- [ ] 翻页时不会出现重复或漏数据

## 阶段 3 · 详情页

**后端**

- [ ] `GET /api/items/:id` 返回条目 + 标签 + 记录（按日期倒序）
- [ ] 不存在返回 404，非法 id 返回 400

**前端**

- [ ] 头部：封面、标题、作者/导演、类型、状态、评分、标签、起止日期
- [ ] 正文：简介、短评
- [ ] 元信息按 `media_type` 切换（书=页数；影=时长+年份）
- [ ] `ActivityTimeline`：日期 + 进度 + 备注，进度单位随类型切换（页 / 分钟）
- [ ] `ActivityForm`：提交后只刷新时间线
- [ ] 编辑 / 删除按钮（删除接 `ConfirmDialog`）

**验收**

- [ ] 条目不存在时显示 404 样式而非空白
- [ ] 记录为空时有「还没有记录」
- [ ] 记录进度单位不会出现「看了 156 页电影」

## 阶段 4 · 新增条目

**后端**

- [x] `POST /api/items`：字段校验（必填、枚举、评分 0–9.9、日期先后、类型与页数/时长互斥）
- [x] 写条目 + 写标签关联放在**同一事务**里（含标签归属校验）
- [x] 校验失败返回 400 且信息可读（带 `fields` 字段级错误）

**前端**

- [x] `ItemForm`：类型切换时联动显示页数 / 时长+年份（切类型时 `resetFields` 清空另一侧，不只做显隐）
- [x] 状态选「已完成」时完成日期变必填，完成日期不能早于开始日期
- [x] 标签多选（`Select mode="multiple"`，只选已有标签，不支持现场新建）
- [x] 字段级错误文案 + 提交中 `confirmLoading` + 提交失败顶部 `Alert`
- [x] 保存成功后 `navigate(\`/items/${id}\`, { replace: true })` 跳详情页（原定回父路由，改为跳详情，用户能立刻看到成果）
- [x] 关闭弹窗（Esc / 遮罩 / 取消）前，若 `form.isFieldsTouched()` 有改动则二次确认

**验收**

- [x] 点「新增条目」后 URL 变为 `/items/new`，刷新后弹窗仍在（路由驱动，结构性保证）
- [x] 直接访问 `/items/new` 能打开弹窗（HTTP 200）
- [ ] 按浏览器返回键 = 关闭弹窗，不会离开列表页（**需你在浏览器里点**）
- [ ] 重复提交（连点）不会产生两条记录（**需你在浏览器里点**）
- [ ] 提交一条不存在的标签 id，确认错误被摆回标签输入框（**需你在浏览器里点**）

## 阶段 5 · 编辑与删除

**后端**

- [ ] `PUT /api/items/:id`（或 PATCH）：同样走事务更新条目与标签关联
- [ ] `DELETE /api/items/:id`：只删主表，关联由外键级联
- [ ] 越权/不存在分别返回 403 / 404

**前端**

- [ ] `ItemForm` 进入编辑态时用 `GET /api/items/:id` 回填
- [ ] 类型字段编辑时置灰不可改
- [ ] 删除二次确认，成功后返回列表
- [ ] 关闭弹窗前，若有改动需二次确认

**验收**

- [ ] 点「编辑」后 URL 变为 `/items/:id/edit`，刷新后弹窗仍在
- [ ] 编辑保存后详情页与列表页数据一致（弹窗关闭时父页面重新挂载并重新请求）
- [ ] 取消删除不会发请求

## 阶段 6 · 列表搜索 / 筛选 / 排序补全

- [ ] 关键词输入 300ms 防抖，改动即重置 `page=1`
- [ ] 类型 Segmented、状态下拉、标签多选、排序下拉
- [ ] 任一筛选变化都把 `page` 重置为 1
- [ ] `共 N 条` 结果信息
- [ ] 浏览器返回键能正确回到上一个筛选组合

**验收**

- [ ] URL 可直接分享/收藏，打开即同样结果
- [ ] 搜索 `三体` 命中，`LIKE '%x%'` 不要求走索引（数据量小，不做全文索引）

## 阶段 7 · 统计面板

**后端**

- [ ] `GET /api/stats`：每月完成数量（近 12 个月）、评分分布、Top 10 标签
- [ ] 空月份要补 0，不能缺格
- [ ] 三条统计用聚合 SQL 完成，不要拉全表到内存算

**前端**

- [ ] 三块都用 `StatBar`，长度按各自最大值归一化
- [ ] 无数据时提示去新增

## 阶段 8 · 收尾

- [ ] 全站回查：6 条需求 × 每页 4 种状态
- [ ] 无 TypeScript `any`（必要时用 `unknown` + 收窄）
- [ ] 控制台无报错、无未处理 Promise 拒绝
- [ ] 所有列表/详情页在空数据、单条数据、多页数据下都正常
- [ ] 后端错误不泄露 SQL / 堆栈给前端

---

## 每页完成的定义（DoD）

一个页面算「写完」，必须同时满足：

- [ ] 加载中、空结果、请求失败、有数据 四种状态都实现
- [ ] 失败态有重试入口
- [ ] 所有请求参数做校验，错误路径有对应 UI
- [ ] 列表页状态与 URL 同步
- [ ] 无 `any`，无 `console.log` 残留
- [ ] 删除/提交类操作有防重复点击

## 评审清单（每次审代码逐条过）

1. **功能正确性**：对照上面 6 条核心需求，能否真的跑通
2. **数据层**：SQL 全参数化；标签写入用事务；分页排序稳定；无 N+1
3. **接口设计**：状态码、错误结构、参数边界（`page=0`、不存在 id、非法 status）
4. **前端状态**：每条数据流是否覆盖 加载 / 空 / 失败 / 有数据
5. **可维护性**：命名、分层、类型复用、无复制粘贴

输出约定：

- 🔴 必须改（会出错 / 有安全隐患 / 不满足需求）
- 🟡 建议改（能跑但有坑）
- 🔵 可以更好（风格与可读性）
- 每条都说明「为什么」，不直接给完整答案（点名要代码时才给）

## 评审记录

> 格式：`日期 · 阶段 · 涉及文件 · 🔴/🟡/🔵 数量 · 结论`

| 日期 | 阶段 | 文件 | 🔴 | 🟡 | 🔵 | 结论 |
|---|---|---|---|---|---|---|
| 2026-10-28 | 阶段 0 | `server/.env` | 0 | 0 | 0 | 修正 `DN_NAME` → `DB_NAME`，已通过 |
| 2026-10-29 | 阶段 1 | `src/App.tsx`、`src/router/index.tsx`、`src/component/AppShell.tsx`、`ItemList`、`ItemDetail`、`ItemDialog`、`DashBoard`、`NotFound` | 0 | 0 | 1 | 补齐路由：嵌套路由 + 路由驱动弹窗；`tsc` 与 `eslint` 均通过。🔵 单包体积 723 kB（antd 全量），暂不处理 |
| 2026-10-29 | 阶段 4 后端 | `server/constants.ts`、`types.ts`、`lib/errors.ts`、`lib/item-input.ts`、`database/items.ts`、`routes/items.ts`、`app.ts` | 0 | 0 | 1 | `POST /api/items` 全绿：11 条 HTTP 用例通过，事务回滚自测通过。🔵 评分上限暂定 9.9（`DECIMAL(2,1)` 限制），待改列类型 |
| 2026-10-29 | 阶段 0/2 | `vite.config.ts`、`server/routes/tags.ts`、`server/database/tags.ts` | 0 | 0 | 0 | Vite 代理打通；`GET /api/tags` 经 5175 代理链路实测 200，POST 经代理 201、400、404 均正确 |
| 2026-10-29 | 阶段 4 前端 | `src/api/{client,types,items}.ts`、`src/component/ItemForm.tsx`、`ItemDialog.tsx`、`eslint.config.js` | 0 | 0 | 1 | 请求层 + 表单完成，`tsc`/`vite build`/`eslint` 全绿。🔵 `eslint.config.js` 加了 `^_` 未使用参数白名单（Express 错误中间件必须 4 参）。⚠️ 编辑模式需 `GET /api/items/:id`，后端尚无 |
