import { Router, type IRouter } from "express";
import { GetAktSverkaQueryParams, GetAktSverkaResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { getAktSverka } from "../lib/ledger";

const router: IRouter = Router();

router.get("/akt-sverka", requireAuth, async (req, res): Promise<void> => {
  const query = GetAktSverkaQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const result = await getAktSverka(
    query.data.clientId,
    query.data.from.toISOString().slice(0, 10),
    query.data.to.toISOString().slice(0, 10),
  );

  if (!result) {
    res.status(404).json({ error: "Klient topilmadi" });
    return;
  }

  res.json(GetAktSverkaResponse.parse(result));
});

export default router;
