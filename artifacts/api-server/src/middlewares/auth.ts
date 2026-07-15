import type { NextFunction, Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq, count } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";
import { logger } from "../lib/logger";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      appUser?: User;
    }
  }
}

/**
 * Ensures a local `users` row exists for the authenticated Clerk user
 * (JIT provisioning). The very first user ever provisioned becomes "admin";
 * everyone after that defaults to "operator".
 */
async function provisionUser(clerkUserId: string): Promise<User> {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId));

  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    email ||
    "Foydalanuvchi";

  const [{ value: existingUserCount }] = await db
    .select({ value: count() })
    .from(usersTable);

  const role = existingUserCount === 0 ? "admin" : "operator";

  const [created] = await db
    .insert(usersTable)
    .values({ clerkUserId, name, email, role })
    .onConflictDoNothing({ target: usersTable.clerkUserId })
    .returning();

  if (created) {
    logger.info(
      { clerkUserId, role },
      "Provisioned new local user for Clerk account",
    );
    return created;
  }

  // Lost a race with a concurrent request provisioning the same user.
  const [raced] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId));
  if (raced) return raced;

  throw new Error(`Failed to provision user for Clerk id ${clerkUserId}`);
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    req.appUser = await provisionUser(auth.userId);
    next();
  } catch (err) {
    req.log.error({ err }, "Failed to provision user");
    res.status(500).json({ error: "Failed to resolve user" });
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.appUser?.role !== "admin") {
    res.status(403).json({ error: "Faqat administrator uchun ruxsat etilgan" });
    return;
  }
  next();
}
