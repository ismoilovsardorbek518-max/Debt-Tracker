---
name: Orval conditional-enabled query hooks need explicit queryKey
description: Passing only `{ query: { enabled } }` to a generated React Query hook fails typecheck
---

Generated hooks (e.g. `useGetClient(id, { query: {...} })`) type the `query` option as a full `UseQueryOptions<...>` (via TanStack Query's own type), not a `Partial`. Passing just `{ enabled: someCondition }` fails with `Property 'queryKey' is missing in type '{ enabled: boolean }'`.

**Why:** This is a known quirk of this project's Orval codegen template — it re-exports the raw `UseQueryOptions` type for the `query` field instead of an already-partial variant.

**How to apply:** When conditionally enabling a generated query hook, always pass `queryKey` explicitly alongside `enabled`, using the paired `get<HookName>QueryKey(...)` helper that Orval also generates, e.g.:
`useGetClient(id, { query: { enabled: !!id, queryKey: getGetClientQueryKey(id) } })`.
