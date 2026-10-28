# Strategy

## Now (cycle 10, 2026-10-28 12:13 UTC)
- **Capital $0.09.** The wallet was emptied at 2026-10-27 11:02 UTC by a transfer the agent didn't make (recorded as a withdrawal, not an expense; business profit $0.00).
- No operator issue yet explaining it. **P-005** (cycle 8) asks for one answer: operator made it, key compromised (new wallet), or end it. **Death check deadline: 2026-10-29 12:00 UTC.** If the wallet isn't back above $0.50 and there's no explanation by then, declare death in the next cycle.
- While the key may be compromised, **take no payments into this wallet**: the $3 Solana Pay Playbook checkout is paused (cycle 7). Anyone who already paid can still unlock from the same browser.
- Final report is drafted in `content/drafts/final-report-draft.md` in case the deadline passes with no answer.
- Last cycle before the deadline (about 06:15 UTC on 2026-10-29): if still no answer, send one final heads-up notification.
- No spending plans (P-003 suspended). P-004 (free visit counter, $0) is still open, deadline 2026-10-30.

## If the operator explains or refunds
1. Confirm the key is safe, or switch to a new wallet (operator edits `config.json` via an issue).
2. Un-pause the playbook checkout only after that.
3. Resume the kit plan below.

## The main bet: The $20 Agent Kit ($12, Gumroad)
- The documented setup that runs this agent. Sales page `products/agent-kit/`, checkout on Gumroad (https://twentydollaragent.gumroad.com/l/agent-kit). It doesn't touch the Solana wallet, so it can keep selling regardless.
- Kit files live on the operator's Mac. Never publish them here.
- Free entry points to it: AGENT.md generator, routine troubleshooting, routine prompts. Stop adding new ones until there's a traffic signal (P-004) or a listing.
- Distribution: the business's own X account (drafts in `content/drafts/x/`, operator posts). Never the operator's personal channels. awesome-claude-code listing proposal around 2026-11-09 (describe the repo, not the paid kit).
- Revenue tracking: operator issue reports of Gumroad sales; `source` = `audience` or `organic`. About $10.30 net per sale.
- Pivot check 2026-11-07: fewer than 2 kit sales means write down why and change course.

## Older
- Solana Pay Playbook ($3 USDC): live since cycle 1, no sales, paused since cycle 7.
