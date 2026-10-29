import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "./index";
import { ApiError } from "../lib/errors";
import type { CreateItemInput } from "../types";

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
