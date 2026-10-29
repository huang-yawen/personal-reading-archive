import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "./index";
import { ApiError } from "../lib/errors";
import type { CreateItemInput, ListItemsParams, ListItemsResult, ItemSummary, ItemDetail, ActivityLog, Tag, MediaType, MediaStatus } from "../types";

/**
 * 新增条目：写主表 + 写标签关联，必须在同一个事务里。
 *
 * 保证原子性的四件事：
 *  1. getConnection() 锁定一条连接（pool.query 每次可能换连接，事务不成立）
 *  2. commit()
 *  3. 出错时 rollback()
 *  4. finally 里 release()，否则连接会被占干，服务几次请求后就卡死
 */
export async function createItem(input: CreateItemInput): Promise<number> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 标签归属校验：外键只保证标签存在，不保证属于当前用户。
    // 放在同一个事务里，避免「查完到插入之间标签被删」的空窗。
    if (input.tagIds.length > 0) {
      const [tagRows] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM tags WHERE user_id = ? AND id IN (?)",
        [input.userId, input.tagIds],
      );
      const found = new Set(tagRows.map((row) => Number(row.id)));
      const missing = input.tagIds.filter((id) => !found.has(id));
      if (missing.length > 0) {
        throw new ApiError(400, "包含无效的标签", {
          tagIds: `标签不存在或不属于当前用户：${missing.join(", ")}`,
        });
      }
    }

    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO media_items
         (user_id, media_type, title, creator, description, cover_url, status, rating,
          review, started_on, completed_on, page_count, runtime_minutes, release_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.userId,
        input.mediaType,
        input.title,
        input.creator,
        input.description,
        input.coverUrl,
        input.status,
        input.rating,
        input.review,
        input.startedOn,
        input.completedOn,
        input.pageCount,
        input.runtimeMinutes,
        input.releaseYear,
      ],
    );

    // 以数据库返回的 insertId 为准，不接受前端传来的 id
    const itemId = result.insertId;

    if (input.tagIds.length > 0) {
      const rows = input.tagIds.map((tagId) => [itemId, tagId]);
      // 批量插入的 VALUES ? 数组展开只支持 query，不支持 execute
      await conn.query(
        "INSERT INTO media_item_tags (media_item_id, tag_id) VALUES ?",
        [rows],
      );
    }

    // 注意：不要在 commit 之前返回响应
    await conn.commit();
    return itemId;
  } catch (err) {
    // 回滚失败时不要盖掉原始错误
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

const ALLOWED_SORTS = new Set(["newest", "title", "rating", "completed"]);

function toIsoDate(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function toIsoDateTime(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export async function listItems(params: ListItemsParams): Promise<ListItemsResult> {
  const { userId, type, status, tagId, q, page, pageSize } = params;
  const sort = ALLOWED_SORTS.has(params.sort ?? "") ? params.sort! : "newest";

  const where: string[] = ["m.user_id = ?"];
  const whereParams: unknown[] = [userId];

  if (type) {
    where.push("m.media_type = ?");
    whereParams.push(type);
  }
  if (status) {
    where.push("m.status = ?");
    whereParams.push(status);
  }
  if (tagId != null) {
    where.push(
      "EXISTS (SELECT 1 FROM media_item_tags mit WHERE mit.media_item_id = m.id AND mit.tag_id = ?)",
    );
    whereParams.push(tagId);
  }
  if (q && q.trim() !== "") {
    const like = `%${q.trim()}%`;
    where.push("(m.title LIKE ? OR m.creator LIKE ?)");
    whereParams.push(like, like);
  }

  const whereSql = where.join(" AND ");

  let orderBy = "m.created_at DESC, m.id DESC";
  if (sort === "title") orderBy = "m.title ASC, m.id ASC";
  else if (sort === "rating") orderBy = "m.rating DESC, m.id DESC";
  else if (sort === "completed") orderBy = "m.completed_on DESC, m.id DESC";

  // 总数
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM media_items m WHERE ${whereSql}`,
    whereParams,
  );
  const total = Number(countRows[0]?.total ?? 0);

  const offset = (page - 1) * pageSize;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT m.id, m.media_type, m.title, m.creator, m.cover_url, m.status, m.rating,
            m.completed_on, m.created_at
       FROM media_items m
      WHERE ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?`,
    [...whereParams, pageSize, offset],
  );

  const itemIds = rows.map((r) => Number(r.id));
  const tagsByItem = new Map<number, Tag[]>();
  if (itemIds.length > 0) {
    const placeholders = itemIds.map(() => "?").join(",");
    const [tagRows] = await pool.query<RowDataPacket[]>(
      `SELECT mit.media_item_id, t.id, t.name, t.color
         FROM media_item_tags mit
         JOIN tags t ON t.id = mit.tag_id
        WHERE mit.media_item_id IN (${placeholders})`,
      itemIds,
    );
    for (const tr of tagRows) {
      const itemId = Number(tr.media_item_id);
      if (!tagsByItem.has(itemId)) tagsByItem.set(itemId, []);
      tagsByItem.get(itemId)!.push({
        id: Number(tr.id),
        name: String(tr.name),
        color: String(tr.color),
      });
    }
  }

  const data: ItemSummary[] = rows.map((r) => ({
    id: Number(r.id),
    mediaType: r.media_type as MediaType,
    title: String(r.title),
    creator: r.creator == null ? null : String(r.creator),
    coverUrl: r.cover_url == null ? null : String(r.cover_url),
    status: r.status as MediaStatus,
    rating: r.rating == null ? null : Number(r.rating),
    tags: tagsByItem.get(Number(r.id)) ?? [],
    completedOn: toIsoDate(r.completed_on),
    createdAt: toIsoDateTime(r.created_at),
  }));

  return { data, pagination: { page, pageSize, total } };
}

export async function getItemById(userId: number, id: number): Promise<ItemDetail> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, user_id, media_type, title, creator, description, cover_url, status, rating,
            review, started_on, completed_on, page_count, runtime_minutes, release_year,
            created_at, updated_at
       FROM media_items
      WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  if (rows.length === 0) {
    throw new ApiError(404, "条目不存在");
  }
  const r = rows[0];

  const [tagRows] = await pool.query<RowDataPacket[]>(
    `SELECT t.id, t.name, t.color
       FROM media_item_tags mit
       JOIN tags t ON t.id = mit.tag_id
      WHERE mit.media_item_id = ?`,
    [id],
  );
  const tags: Tag[] = tagRows.map((tr) => ({
    id: Number(tr.id),
    name: String(tr.name),
    color: String(tr.color),
  }));

  const [logRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, activity_date, progress_value, note, created_at
       FROM activity_logs
      WHERE media_item_id = ?
      ORDER BY activity_date DESC, id DESC`,
    [id],
  );
  const logs: ActivityLog[] = logRows.map((lr) => ({
    id: Number(lr.id),
    activityDate: toIsoDate(lr.activity_date) ?? "",
    progressValue: lr.progress_value == null ? null : Number(lr.progress_value),
    note: lr.note == null ? null : String(lr.note),
    createdAt: toIsoDateTime(lr.created_at),
  }));

  return {
    id: Number(r.id),
    userId: Number(r.user_id),
    mediaType: r.media_type as MediaType,
    title: String(r.title),
    creator: r.creator == null ? null : String(r.creator),
    description: r.description == null ? null : String(r.description),
    coverUrl: r.cover_url == null ? null : String(r.cover_url),
    status: r.status as MediaStatus,
    rating: r.rating == null ? null : Number(r.rating),
    review: r.review == null ? null : String(r.review),
    startedOn: toIsoDate(r.started_on),
    completedOn: toIsoDate(r.completed_on),
    pageCount: r.page_count == null ? null : Number(r.page_count),
    runtimeMinutes: r.runtime_minutes == null ? null : Number(r.runtime_minutes),
    releaseYear: r.release_year == null ? null : Number(r.release_year),
    tags,
    logs,
    createdAt: toIsoDateTime(r.created_at),
    updatedAt: toIsoDateTime(r.updated_at),
  };
}

export async function updateItem(id: number, input: CreateItemInput): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 标签归属校验
    if (input.tagIds.length > 0) {
      const [tagRows] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM tags WHERE user_id = ? AND id IN (?)",
        [input.userId, input.tagIds],
      );
      const found = new Set(tagRows.map((row) => Number(row.id)));
      const missing = input.tagIds.filter((tid) => !found.has(tid));
      if (missing.length > 0) {
        throw new ApiError(400, "包含无效的标签", {
          tagIds: `标签不存在或不属于当前用户：${missing.join(", ")}`,
        });
      }
    }

    const [result] = await conn.execute<ResultSetHeader>(
      `UPDATE media_items
          SET media_type = ?, title = ?, creator = ?, description = ?, cover_url = ?,
              status = ?, rating = ?, review = ?, started_on = ?, completed_on = ?,
              page_count = ?, runtime_minutes = ?, release_year = ?
        WHERE id = ? AND user_id = ?`,
      [
        input.mediaType,
        input.title,
        input.creator,
        input.description,
        input.coverUrl,
        input.status,
        input.rating,
        input.review,
        input.startedOn,
        input.completedOn,
        input.pageCount,
        input.runtimeMinutes,
        input.releaseYear,
        id,
        input.userId,
      ],
    );
    if (result.affectedRows === 0) {
      throw new ApiError(404, "条目不存在");
    }

    // 重建标签关联：先删后插
    await conn.execute("DELETE FROM media_item_tags WHERE media_item_id = ?", [id]);
    if (input.tagIds.length > 0) {
      const rows = input.tagIds.map((tagId) => [id, tagId]);
      await conn.query("INSERT INTO media_item_tags (media_item_id, tag_id) VALUES ?", [rows]);
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

export async function deleteItem(userId: number, id: number): Promise<void> {
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM media_items WHERE id = ? AND user_id = ?",
    [id, userId],
  );
  if (result.affectedRows === 0) {
    throw new ApiError(404, "条目不存在");
  }
}
