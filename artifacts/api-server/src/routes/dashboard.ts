import { Router, type IRouter } from "express";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { getDashboardSummary } from "../lib/ledger";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (_req, res): Promise<void> => {
  const summary = await getDashboardSummary();
  res.json(GetDashboardSummaryResponse.parse(summary));
});

export default router;
