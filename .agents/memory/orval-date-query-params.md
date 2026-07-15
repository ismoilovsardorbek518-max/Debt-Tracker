---
name: Orval date query/body params
description: Generated Zod schemas coerce OpenAPI date fields to native Date objects
---

When an OpenAPI schema field has `format: date` (or `date-time`), the Orval-generated Zod schema uses `zod.coerce.date()` / `zod.date()`, not a string schema — regardless of whether it's a query param, path param, or request body field. After `safeParse`, the value in `.data` is a native JS `Date` object.

**Why:** Drizzle date-typed columns (`date("date")`) expect a `YYYY-MM-DD` string for inserts/comparisons (`gte`, `lte`, `eq`), not a `Date` object — passing a `Date` directly is a TypeScript error (`No overload matches this call`).

**How to apply:** Whenever a route handler pulls a date-typed field out of a parsed Zod query/body object and passes it to Drizzle, first convert with `date.toISOString().slice(0, 10)`. Do this at the route layer, not inside shared lib functions, so lib functions can stay typed with plain `string` params.
