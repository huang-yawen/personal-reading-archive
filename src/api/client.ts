// 后端统一的错误结构：{ error: { message, fields? } }
// 这里把它还原成一个带 message 的错误对象，页面才能 catch 到可读信息。

export class ApiError extends Error {
  readonly status: number;
  // 字段级错误，例如 { title: '标题不能为空' }
  readonly fields?: Record<string, string>;

  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

interface ErrorBody {
  error?: {
    message?: string;
    fields?: Record<string, string>;
  };
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch {
    // fetch 只在「连不上 / 断网」时 reject，这里统一成 0 状态码
    throw new ApiError(0, '网络连接失败，请检查网络后重试');
  }

  const text = await response.text();
  let body: unknown = null;
  if (text !== '') {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const error = (body as ErrorBody | null)?.error;
    throw new ApiError(
      response.status,
      error?.message ?? `请求失败（${response.status}）`,
      error?.fields,
    );
  }

  return body as T;
}
