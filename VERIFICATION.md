# Verification Evidence

Last verified: May 24, 2026.

## Local

```bash
npm run verify
```

Result:

- `npm run lint` passed.
- `npm run test:local` passed.
- `npm run build` passed.
- `npm audit --audit-level=moderate` found 0 vulnerabilities.
- Next.js generated `/`, `/atlas`, `/create`, `/query`, and `/memory/[key]`.

## Vercel

Production alias:

```txt
https://modifiervault.vercel.app
```

Latest inspected production deployment:

```txt
dpl_GzW9PvHKcoCvFxFtZLcxpCFN9rtr
https://modifiervault-iqk176n3k-beaconsmiths-projects.vercel.app
status: READY
```

HTTP route checks:

- `/` returned `200 OK`.
- `/create` returned `200 OK`.
- `/query` returned `200 OK`.

Runtime logs:

- `vercel logs --since 30m --level error` returned no logs.

## Arkiv Braga

Current project namespace:

```txt
project = "modifiervault_beaconsmith_vault_v3"
```

May 24, 2026 check:

- Read-only public query for `modifiervault_beaconsmith_vault_v3` returned 3 `MemoryNode` entities.
- The same read-only check returned 0 `ModifierStack` entities and 0 `AgentReflection` entities for the new namespace.
- `npm run test:braga` was not run because this checkout does not have `ARKIV_PRIVATE_KEY` configured in `.env.local`.
- Before final submission, run `npm run test:braga` or create one live memory through the app to confirm the new `v3` namespace has linked `ModifierStack` and `AgentReflection` entities.
