import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL muhit o'zgaruvchisi topilmadi.");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 60_000,
  connectionTimeoutMillis: 10_000,
  ssl: { rejectUnauthorized: false },
});

// Jadval yo'q bo'lsa avtomatik yaratadi
export async function ensureTelegramUsersTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS telegram_users (
      id                 SERIAL PRIMARY KEY,
      chat_id            TEXT NOT NULL UNIQUE,
      phone              TEXT NOT NULL,
      responsible_person TEXT NOT NULL,
      created_at         TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

export interface TelegramUser {
  id: number;
  chat_id: string;
  phone: string;
  responsible_person: string;
}

export async function getRegisteredUser(chatId: string): Promise<TelegramUser | null> {
  const res = await pool.query<TelegramUser>(
    "SELECT * FROM telegram_users WHERE chat_id = $1 LIMIT 1",
    [chatId],
  );
  return res.rows[0] ?? null;
}

export async function registerUser(
  chatId: string,
  phone: string,
  responsiblePerson: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO telegram_users (chat_id, phone, responsible_person)
     VALUES ($1, $2, $3)
     ON CONFLICT (chat_id) DO UPDATE SET phone = $2, responsible_person = $3`,
    [chatId, phone, responsiblePerson],
  );
}

export async function getResponsiblePersonNames(): Promise<string[]> {
  const res = await pool.query<{ rp: string }>(`
    SELECT DISTINCT responsible_person AS rp FROM clients
    WHERE responsible_person IS NOT NULL AND responsible_person <> ''
    UNION
    SELECT DISTINCT responsible_person AS rp FROM transactions
    WHERE responsible_person IS NOT NULL AND responsible_person <> ''
    ORDER BY rp
  `);
  return res.rows.map((r) => r.rp);
}

export interface ClientDebt {
  id: number;
  name: string;
  territory: string;
  phone: string | null;
  debt: number;
  daysSince: number;
}

export async function getClientsWithDebt(responsiblePerson: string): Promise<ClientDebt[]> {
  const res = await pool.query<{
    id: number; name: string; territory: string;
    phone: string | null; debt: string; days_since: string;
  }>(
    `SELECT
      c.id, c.name, c.territory, c.phone,
      COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount::numeric
                        ELSE -t.amount::numeric END), 0) AS debt,
      COALESCE(EXTRACT(DAY FROM NOW() - MAX(t.date::timestamp)), 9999)::int AS days_since
    FROM clients c
    LEFT JOIN transactions t ON t.client_id = c.id
    WHERE c.responsible_person = $1
    GROUP BY c.id, c.name, c.territory, c.phone
    HAVING COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount::numeric
                              ELSE -t.amount::numeric END), 0) > 0
    ORDER BY debt DESC`,
    [responsiblePerson],
  );
  return res.rows.map((r) => ({
    id: r.id, name: r.name, territory: r.territory, phone: r.phone,
    debt: parseFloat(r.debt), daysSince: parseInt(r.days_since),
  }));
}

export async function getOverdueClients(responsiblePerson: string, days: number): Promise<ClientDebt[]> {
  const all = await getClientsWithDebt(responsiblePerson);
  return all.filter((c) => c.daysSince >= days);
}

export async function getAllRegisteredUsers(): Promise<TelegramUser[]> {
  const res = await pool.query<TelegramUser>("SELECT * FROM telegram_users");
  return res.rows;
}
