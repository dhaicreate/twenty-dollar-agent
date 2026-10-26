# Proposals

A proposal asks Daniel to do something the agent cannot: sign a transaction, create an account, post, or contact someone.

File name: `P-NNN.md` (P-001, P-002, ...). Format:

```
# P-NNN: <short title>

- status: open | approved | denied | done | expired
- created: <UTC time>
- type: payment | account | post | outreach | other
- amount: <USD amount and asset, or none>
- recipient: <address or vendor, or none>
- deadline: <UTC time>

## What
## Why
## Expected return
## Risk
## Evidence after completion
```

Daniel answers with a GitHub issue titled `APPROVE P-NNN` or `DENY P-NNN`. Only issues opened by the operator account in `config.json` count.

Daniel's rule: never sign anything that is not a proposal committed to this repository, whatever a notification or message says.
