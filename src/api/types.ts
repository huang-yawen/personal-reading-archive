// 手动与 server/types.ts 对齐。两边字段必须一致，改一边要同步改另一边。

export type MediaType = 'book' | 'movie';

export type MediaStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'paused'
  | 'dropped';

export interface Tag {
  id: number;
  name: string;
  color: string;
}

// 发给 POST /api/items 的请求体（userId 由后端自己决定，不发）
export interface CreateItemPayload {
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
