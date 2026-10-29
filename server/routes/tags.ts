import { Router } from "express";
import { DEMO_USER_ID } from "../constants";
import { listTags } from "../database/tags";

const router = Router();

// GET /api/tags
router.get("/", async (_req, res) => {
  const tags = await listTags(DEMO_USER_ID);
  res.json({ data: tags });
});

export default router;
