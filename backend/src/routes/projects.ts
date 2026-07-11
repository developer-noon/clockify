import { Router } from "express";
import * as projectsController from "../controllers/projectsController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.post("/", projectsController.createProject);
router.get("/", projectsController.getProjects);
router.get("/:id", projectsController.getProject);
router.put("/:id", projectsController.updateProject);
router.delete("/:id", projectsController.deleteProject);

router.get("/:projectId/tasks", projectsController.getProjectTasks);
router.post("/:projectId/tasks", projectsController.createTask);

export default router;
