import { request } from './client';
import type { CreateItemPayload, Tag, ItemListResponse, ItemDetail, MediaType, MediaStatus } from './types';

export async function fetchTags(): Promise<Tag[]> {
  const res = await request<{ data: Tag[] }>('/api/tags');
  return res.data;
}

export async function createItem(input: CreateItemPayload): Promise<{ id: number }> {
  const res = await request<{ data: { id: number } }>('/api/items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function fetchItem(id: number): Promise<ItemDetail> {
  const res = await request<{ data: ItemDetail }>(`/api/items/${id}`);
  return res.data;
}

export async function updateItem(id: number, input: CreateItemPayload): Promise<void> {
  await request(`/api/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteItem(id: number): Promise<void> {
  await request(`/api/items/${id}`, { method: 'DELETE' });
}

export interface FetchItemsParams {
  type?: MediaType;
  status?: MediaStatus;
  tag?: number;
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchItems(params: FetchItemsParams = {}): Promise<ItemListResponse> {
  const sp = new URLSearchParams();
  if (params.type) sp.set('type', params.type);
  if (params.status) sp.set('status', params.status);
  if (params.tag != null) sp.set('tag', String(params.tag));
  if (params.q) sp.set('q', params.q);
  if (params.sort) sp.set('sort', params.sort);
  if (params.page != null) sp.set('page', String(params.page));
  if (params.pageSize != null) sp.set('pageSize', String(params.pageSize));
  const qs = sp.toString();
  return request<ItemListResponse>(`/api/items${qs ? `?${qs}` : ''}`);
}
