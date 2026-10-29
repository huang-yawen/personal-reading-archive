// 统一的业务错误。
// 只有它会把 message 直接回给前端，其它错误一律转成 500 且不泄露细节。
export class ApiError extends Error {
  readonly statusCode: number;
  // 字段级错误，例如 { title: "标题不能为空" }，前端据此把错误渲染到对应输入框
  readonly fields?: Record<string, string>;

  constructor(statusCode: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.fields = fields;
  }
}
