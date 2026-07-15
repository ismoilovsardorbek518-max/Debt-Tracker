# Qarz-Haqdorlik Hisobi (Debt-Creditor Ledger)

O'zbek tilidagi qarz-haqdorlik hisob-kitob tizimi: klientlar bilan bo'lgan kirim-chiqim operatsiyalarini yuritish, balanslarni kuzatish va Akt Sverka (solishtirma dalolatnoma) hujjatlarini shakllantirish uchun veb-ilova.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API serverni ishga tushirish
- `pnpm --filter @workspace/debt-ledger run dev` — frontendni ishga tushirish
- `pnpm run typecheck` — barcha paketlar bo'yicha to'liq typecheck
- `pnpm --filter @workspace/api-spec run codegen` — OpenAPI spetsifikatsiyasidan hooks va Zod sxemalarini qayta generatsiya qilish
- `pnpm --filter @workspace/db run push` — DB sxema o'zgarishlarini qo'llash (faqat dev)
- Required env: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, auth via `@clerk/express`
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite, shadcn/ui, TanStack Query, wouter, recharts
- Auth: Clerk (Replit-managed) — roles (admin/operator) modeled locally, not a native Clerk concept
- Export: `exceljs` (xlsx), `pdfkit` (pdf)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (ESM bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract
- `lib/db/src/schema/` — Drizzle schema (`users.ts`, `clients.ts`, `transactions.ts`)
- `artifacts/api-server/src/routes/` — Express routes, split by domain
- `artifacts/api-server/src/lib/ledger.ts` — balance/dashboard/akt-sverka calculation logic
- `artifacts/api-server/src/lib/export.ts` — Excel/PDF generation
- `artifacts/api-server/src/middlewares/auth.ts` — Clerk auth + JIT user provisioning + role gating
- `artifacts/debt-ledger/src/pages/` — Dashboard, Clients, Client details, Transactions, Akt Sverka, Users (admin) pages

## Architecture decisions

- Balance convention: for each client, `balance = sum(expense) - sum(income)`. "expense" (chiqim) = business gave goods/money to client (receivable up); "income" (kirim) = client paid back (receivable down). Positive balance = haqdorlik (client owes us); negative = qarzdorlik (we owe client).
- Roles (admin/operator) are not a native Clerk concept — modeled in a local `users` table, synced via JIT provisioning on first sign-in. The very first user ever provisioned becomes admin; everyone after defaults to operator. Admins can promote others via Settings → Users.
- Export endpoints (`/export/*`) return raw `Blob`-returning functions from the generated client (not React Query hooks) — the frontend calls them directly on button click and triggers a browser download.
- Daily automatic backup was mentioned as a stretch item in the original spec but was not implemented in this pass — flagged to the user, not silently dropped.

## Product

- Dashboard: total receivable/payable/net balance + 30-day cash flow chart.
- Clients: CRUD, search/filter by territory, Excel export, per-client balance and transaction history.
- Transactions: CRUD, filters (client/payment type/responsible person/date range), Excel export, success toasts on add/edit.
- Akt Sverka: reconciliation statement per client over a date range, with Excel and PDF export.
- Auth: Clerk-based login/signup; Admin/Operator roles gate destructive actions (delete, edit existing transactions, user role management).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- esbuild bundling the API server: do NOT externalize `@swc/*` in `build.mjs` — `fontkit` (a `pdfkit` transitive dependency) requires `@swc/helpers` directly and pnpm's strict linking means it can't be resolved at runtime if left external. Bundle it instead.
- Zod query-param schemas for date fields (`GetAktSverkaQueryParams`, `ListTransactionsQueryParams`, etc.) parse to native `Date` objects, not strings — convert with `.toISOString().slice(0, 10)` before passing to Drizzle date columns or comparisons.
- Generated React Query hooks with a conditional `enabled` option also require `queryKey` to be passed explicitly alongside it (e.g. `{ query: { enabled: !!id, queryKey: getGetClientQueryKey(id) } }`), or TypeScript complains it's missing.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk setup/customization details
