# Express 路由拆分：父路由与子路由

- 日期：2026-10-29
- 标签：Node.js、Express、路由

## 核心写法

拆成两段：**子路由写相对路径，父路由给前缀**，最终 URL 是两者拼接。

```ts
// server/routes/items.ts  —— 子路由（Router）
const router = Router();
router.post("/", handler);        // 路径是 "/"
router.get("/:id", handler);      // 路径是 "/:id"

// server/app.ts  —— 父路由（app）
app.use("/api/items", itemsRouter);
```

拼接结果：`/api/items` + `/` = `/api/items`，`/api/items` + `/:id` = `/api/items/:id`。

## 为什么要拆

- **一个文件管一个资源**：`items.ts`、`tags.ts` 各自维护自己的接口，`app.ts` 只做组装、挂中间件、统一错误处理。
- **中间件可按组挂**：`router.use(auth)` 只作用于这一组路由；`app.use` 会作用于所有接口。
- **复用**：同一个 `Router` 可以挂到不同前缀，整套接口多一份 URL。

不拆的写法（小项目也能跑，但 `app.ts` 会越写越长）：

```ts
app.post("/api/items", ...);
app.get("/api/items", ...);
app.get("/api/items/:id", ...);
```

## 三种灵活搭配

| 场景 | 写法 |
|---|---|
| 同一个 router 挂到不同前缀（复用） | `app.use("/api/items", r)` + `app.use("/api/v2/items", r)` |
| 多个 router 挂到同一前缀（链式） | `app.use("/api/items", itemsRouter)` + `app.use("/api/items", tagsRouter)` |
| router 嵌套 router（父子） | `parent.use("/sub", child)`，再 `app.use("/api", parent)` |

## 不是「调用方法」，是「请求分派」

Router 里定义的不是方法，是「路径 → handler」的映射表。请求进来时，Express 先按前缀把请求转交给你挂载的 router，router 内部再按相对路径匹配、执行 handler。

## 一句话判据

> 子路由决定「这个资源内部有哪些接口」，挂载前缀决定「这个资源对外暴露在哪」——两者解耦，所以可以复用、嵌套、链式挂载。
