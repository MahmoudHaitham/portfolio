import { Router } from "express";
import {
  updateSession,
  deleteSession,
} from "../controllers/sessionController";

const router = Router();

// PUT /api/sessions/:id - Update a session by ID
router.put("/:id", updateSession);

// DELETE /api/sessions/:id - Delete a session by ID
router.delete("/:id", deleteSession);

export default router;

