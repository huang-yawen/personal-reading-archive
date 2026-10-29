import type { RowDataPacket } from "mysql2";
import pool from "./index";
import type { Tag } from "../types";

/**
 * 读取当前用户的全部标签。
 * 标签数量不会多，不分页、不搜索，按 id（创建顺序）返回。
 */
export async function listTags(userId: number): Promise<Tag[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, color FROM tags WHERE user_id = ? ORDER BY id",
    [userId],
  );
  return rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    color: String(row.color),
  }));
}
