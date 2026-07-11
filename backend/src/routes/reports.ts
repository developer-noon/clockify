import { Router } from "express";
import * as reportsController from "../controllers/reportsController";
import { authMiddleware, optionalAuth } from "../middleware/auth";

const router = Router();

// Protected routes
router.get("/summary", authMiddleware, reportsController.getSummary);
router.get("/detailed", authMiddleware, reportsController.getDetailed);
router.get("/pdf", authMiddleware, reportsController.generatePDF);

// Share routes
router.post("/share", authMiddleware, reportsController.createShareLink);
router.delete(
  "/share/:token",
  authMiddleware,
  reportsController.revokeShareLink,
);

// Public shared report
router.get("/public/:token", optionalAuth, reportsController.getSharedReport);

export default router;
