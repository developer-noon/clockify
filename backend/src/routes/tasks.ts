import { Router } from "express";
import * as projectsController from "../controllers/projectsController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.delete("/:id", projectsController.deleteTask);

export default router;
