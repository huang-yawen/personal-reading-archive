import { request } from './client';
import type { CreateItemPayload, Tag } from './types';

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
