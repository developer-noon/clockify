import { Router } from "express";
import * as clientsController from "../controllers/clientsController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.post("/", clientsController.createClient);
router.get("/", clientsController.getClients);
router.get("/:id", clientsController.getClient);
router.put("/:id", clientsController.updateClient);
router.delete("/:id", clientsController.deleteClient);

export default router;
