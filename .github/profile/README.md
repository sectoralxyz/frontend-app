<p align="center">
  <img src="https://sectoral.xyz/images/og.jpg" alt="Sectoral: private banking for people and the agents they run" width="100%">
</p>

<p align="center">
  <a href="https://sectoral.xyz">sectoral.xyz</a> &nbsp;·&nbsp;
  <a href="https://docs.sectoral.xyz">Docs</a> &nbsp;·&nbsp;
  <a href="https://x.com/sectoralxyz">@sectoralxyz</a>
</p>

# Sectoral

Sectoral is a private bank account on Robinhood Chain, for you and for the AI agents that spend money on your behalf.

Payments settle on chain, so anyone can check that they happened. The amounts are encrypted, so nobody but the two people involved knows how much moved. You hold your own keys, and the key that reads your balance never leaves your device.

We built it because we got tired of picking between two bad options. A bank keeps your history away from strangers but shows all of it to itself and its partners. A public chain keeps everyone honest but lets anyone with a block explorer read your payroll. We wanted the honest ledger without the open diary.

## What's in this org

| Repo | What it is |
|---|---|
| [smart-contracts](https://github.com/sectoralxyz/smart-contracts) | The protocol, in Solidity with Foundry. Confidential USDG, the account registry and `.sectoral` handles, agent policies, request-to-pay and fees. |
| [typescript-sdk](https://github.com/sectoralxyz/typescript-sdk) | `@sectoral/sdk`, a typed client for the REST API. Accounts, transfers, agent wallets and signed webhooks. |
| [docs](https://github.com/sectoralxyz/docs) | Everything behind [docs.sectoral.xyz](https://docs.sectoral.xyz), from a walkthrough of a single transfer to the full threat model. |

## How it works, briefly

**Encrypted balances.** Each balance is stored as an ElGamal ciphertext on alt_bn128. A transfer carries two encrypted deltas and a Groth16 proof. The contract verifies the proof (the numbers line up and the sender can afford it) and then adds the ciphertexts together. At no point does an amount show up in calldata or storage.

**Privacy per account, not per payment.** Accounts are public, confidential or shielded. Public shows everything, confidential hides amounts, shielded hides amounts and counterparties. New accounts start out confidential. Since the setting belongs to the account, nothing can quietly drop to a lower level halfway through a session.

**Agents with real limits.** An agent is an account with a policy attached: a max per transaction, a daily cap, an allowlist of who it can pay, and an amount above which you have to approve the payment yourself. The chain enforces all of it. The agent's key can only spend from a vault the contract controls, so if that key ever leaks you pause the agent or rotate the signer. You don't have to race anyone to move your money.

**Dollars in, dollars out.** Everything settles in USDG, the Global Dollar from Paxos, and bridged USDC works too. Gas is topped up for you in the background. Fees are a flat 0.10% per payment, capped at 5 USDG.

## Try it

```bash
npm install @sectoral/sdk
```

```ts
import { Sectoral } from "@sectoral/sdk";

const sectoral = new Sectoral({ apiKey: process.env.SECTORAL_API_KEY! });

await sectoral.transfers.create({
  to: "@vendor",
  amount: "125.00",
  asset: "USDG",
});
```

You can make API keys in the Developer section of the dashboard. Test keys run against testnet, where nothing is real. Live keys move actual money, so look after them like you would any other credential that can spend.

## Contributing

The contracts and the SDK are both MIT licensed. Issues and pull requests are welcome on any repo here.

If you think you've found a security problem, please don't open a public issue. Email us at contact@sectoral.xyz and we'll work with you on a fix before anything goes public.

## Brand

Sectoral is set in Barlow for display and Manrope for body text, on near-black `#05070A` with one white-hot accent, `#FFFAF4`, that carries a soft warm glow. Our mark is the rocket.

| Asset | Link |
| --- | --- |
| Rocket mark, transparent | [logo.png](https://sectoral.xyz/images/logo.png) |
| Rocket mark on black | [logo-bg.png](https://sectoral.xyz/images/logo-bg.png) |
| Social card | [og.jpg](https://sectoral.xyz/images/og.jpg) |

Please use the mark on dark backgrounds and don't modify it.
