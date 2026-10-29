import { Router } from "express";
import { DEMO_USER_ID } from "../constants";
import { createItem } from "../database/items";
import { parseCreateItemInput } from "../lib/item-input";

const router = Router();

// POST /api/items
router.post("/", async (req, res) => {
  const input = parseCreateItemInput(req.body, DEMO_USER_ID);
  const id = await createItem(input);
  res.status(201).json({ data: { id } });
});

export default router;
