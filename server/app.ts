import express from "express";
import itemsRouter from "./routes/items";
import tagsRouter from "./routes/tags";
import { ApiError } from "./lib/errors";

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/items", itemsRouter);
app.use("/api/tags", tagsRouter);

// 未知接口
app.use((_req, res) => {
  res.status(404).json({ error: { message: "接口不存在" } });
});

// 统一错误处理。
// Express 5 会自动把 async 处理函数里抛出的错误转交给这里。
// 必须是 4 个参数，少一个就不会被当成错误中间件。
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    // 业务错误：message 和字段错误可以回给前端
    if (err instanceof ApiError) {
      res.status(err.statusCode).json({
        error: {
          message: err.message,
          ...(err.fields ? { fields: err.fields } : {}),
        },
      });
      return;
    }

    // body 解析失败（非法 JSON）。body-parser 抛的错误带 body 字段，
    // 用它区分「请求体坏了」和「代码里真的抛了 SyntaxError」。
    if (err instanceof SyntaxError && "body" in err) {
      res.status(400).json({ error: { message: "请求体不是合法的 JSON" } });
      return;
    }

    // 其它错误：只打日志，不把细节回给前端
    console.error(err);
    res.status(500).json({ error: { message: "服务器内部错误" } });
  },
);

app.listen(3000, () => {
  console.log("listening on http://localhost:3000");
});
