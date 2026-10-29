// 前后端共享的领域类型。
// 前端在 src/api/types.ts 里保留一份同名结构，两边字段必须一致。

export type MediaType = "book" | "movie";

export type MediaStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "paused"
  | "dropped";

// 新增条目时，请求体经过校验后的形态。
// 注意：这里全部是「已校验」的原始类型，不再有空字符串，空值一律为 null。
export interface CreateItemInput {
  userId: number;
  mediaType: MediaType;
  title: string;
  creator: string | null;
  description: string | null;
  coverUrl: string | null;
  status: MediaStatus;
  rating: number | null;
  review: string | null;
  startedOn: string | null;
  completedOn: string | null;
  pageCount: number | null;
  runtimeMinutes: number | null;
  releaseYear: number | null;
  tagIds: number[];
}
