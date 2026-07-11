import { Router } from "express";
import * as timeEntriesController from "../controllers/timeEntriesController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.post("/", timeEntriesController.createTimeEntry);
router.get("/", timeEntriesController.getTimeEntries);
router.get("/:id", timeEntriesController.getTimeEntry);
router.put("/:id", timeEntriesController.updateTimeEntry);
router.delete("/:id", timeEntriesController.deleteTimeEntry);

export default router;
