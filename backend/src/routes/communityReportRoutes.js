import { Router } from "express";
import { getCommunitySites, postCommunityReport } from "../controllers/communityReportController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
router.get("/", getCommunitySites);
router.post("/", requireAuth, postCommunityReport);

export default router;
