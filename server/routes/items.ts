import { Router } from "express";
import { DEMO_USER_ID } from "../constants";
import { createItem, listItems, getItemById, updateItem, deleteItem } from "../database/items";
import { parseCreateItemInput } from "../lib/item-input";
import type { MediaStatus } from "../types";

const router = Router();

function parseId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

// GET /api/items
router.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1) || 1);
  const pageSizeRaw = Number(req.query.pageSize ?? 12) || 12;
  const pageSize = Math.min(50, Math.max(1, pageSizeRaw));

  const rawType = req.query.type ? String(req.query.type) : undefined;
  const type = rawType === "book" || rawType === "movie" ? rawType : undefined;
  const rawStatus = req.query.status ? String(req.query.status) : undefined;
  const allowedStatus = ["planned", "in_progress", "completed", "paused", "dropped"];
  const status = rawStatus && allowedStatus.includes(rawStatus) ? rawStatus : undefined;
  const tagId = req.query.tag ? Number(req.query.tag) : undefined;
  const q = req.query.q ? String(req.query.q) : undefined;
  const sort = req.query.sort ? String(req.query.sort) : undefined;

  const result = await listItems({
    userId: DEMO_USER_ID,
    type: type as "book" | "movie" | undefined,
    status: status as MediaStatus | undefined,
    tagId: Number.isFinite(tagId) ? tagId : undefined,
    q,
    sort,
    page,
    pageSize,
  });
  res.json(result);
});

// GET /api/items/:id
router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: { message: "非法的条目 id" } });
    return;
  }
  const item = await getItemById(DEMO_USER_ID, id);
  res.json({ data: item });
});

// POST /api/items
router.post("/", async (req, res) => {
  const input = parseCreateItemInput(req.body, DEMO_USER_ID);
  const id = await createItem(input);
  res.status(201).json({ data: { id } });
});

// PUT /api/items/:id
router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: { message: "非法的条目 id" } });
    return;
  }
  const input = parseCreateItemInput(req.body, DEMO_USER_ID);
  await updateItem(id, input);
  res.json({ data: { id } });
});

// DELETE /api/items/:id
router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: { message: "非法的条目 id" } });
    return;
  }
  await deleteItem(DEMO_USER_ID, id);
  res.status(204).send();
});

export default router;
