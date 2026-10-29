// 前后端共享的领域类型。
// 前端在 src/api/types.ts 里保留一份同名结构，两边字段必须一致。

export type MediaType = "book" | "movie";

export type MediaStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "paused"
  | "dropped";

// 标签（列表用于多选框和筛选栏）
export interface Tag {
  id: number;
  name: string;
  color: string;
}

// 新增条目时，请求体经过校验后的形态。
// 注意：这里全部是「已校验」的原始类型，不再有空字符串，空值一律为 null。
// 列表页返回的条目摘要（不含详情字段）。
export interface ActivityLog {
  id: number;
  activityDate: string;
  progressValue: number | null;
  note: string | null;
  createdAt: string;
}

export interface ItemDetail {
  id: number;
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
  tags: Tag[];
  logs: ActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ItemSummary {
  id: number;
  mediaType: MediaType;
  title: string;
  creator: string | null;
  coverUrl: string | null;
  status: MediaStatus;
  rating: number | null;
  tags: Tag[];
  completedOn: string | null;
  createdAt: string;
}

export interface ListItemsParams {
  userId: number;
  type?: MediaType;
  status?: MediaStatus;
  tagId?: number;
  q?: string;
  sort?: string;
  page: number;
  pageSize: number;
}

export interface ListItemsResult {
  data: ItemSummary[];
  pagination: { page: number; pageSize: number; total: number };
}

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
