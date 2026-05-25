# Arkiv ETH-NS Challenge Submission

Use this file as the copy-paste source for the submission form.

| Field | Value |
| --- | --- |
| Project | ModifierVault |
| Theme | AI + Privacy |
| Summary | A web3-native semantic memory atlas where users write, own, encrypt, read, query, and reinterpret AI memory entities on Arkiv Braga testnet. |
| GitHub repo | https://github.com/beaconsmith/arkiv-modifier-vault |
| Demo link | https://modifiervault.vercel.app |
| Demo video | https://www.loom.com/share/1f42e1f0253e46bba84221ad10064ab2 |
| Team | Nzube Ndiokwelu |
| GitHub handle | `beaconsmith` |


## Technical Checklist

- Unique project attribute: `project = "modifiervault_beaconsmith_vault_v3"`
- Schema filter: `schemaVersion = "2"`
- Entity types: `MemoryNode`, `ModifierStack`, `AgentReflection`
- Relationships: `memoryKey` and `modifierStackKey` attributes
- Arkiv network: Braga testnet
- Create/read/query flows: browser wallet plus Arkiv SDK
- Privacy: browser-side PBKDF2 -> AES-GCM encrypted payload mode
- AI: Groq-generated AgentReflection artifacts
- Local verification: `npm run verify`, `npm audit --audit-level=moderate`
- Braga verification: `npm run test:braga` with `ARKIV_PRIVATE_KEY`
