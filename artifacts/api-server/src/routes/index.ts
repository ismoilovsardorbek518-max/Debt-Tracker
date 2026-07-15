import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import clientsRouter from "./clients";
import transactionsRouter from "./transactions";
import dashboardRouter from "./dashboard";
import aktSverkaRouter from "./akt-sverka";
import exportRouter from "./export";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(clientsRouter);
router.use(transactionsRouter);
router.use(dashboardRouter);
router.use(aktSverkaRouter);
router.use(exportRouter);

export default router;
