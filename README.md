# Base public-data monitor

A read-only command-line monitor queries the Base mainnet RPC for the latest block and DefiLlama for protocol entries whose chain list contains Base. No wallet, private key, transaction, or paid service is required. A protocol listing is not a token safety check or an airdrop recommendation.

## Run and test

Requires Node.js 22+. No npm dependencies are required.

```sh
cd BASE-MONITOR
npm test
node monitor.js
```

Requests time out after 15 seconds. HTTP errors, RPC errors, malformed blocks, and invalid protocol lists fail explicitly with exit code 1. A source can succeed while another fails; the overall result remains a failure.

## Outputs and automation

Local protocol snapshots are stored in ignored `.local/tracked_projects.json`. A name new to that local dataset is not necessarily a newly launched project. Public sources can be incomplete, delayed, or unavailable.

Scheduled runs upload reports as seven-day Actions artifacts. They do not commit runtime logs, rewrite project files, or generate contribution commits. Previous tracked reports remain in history for transparency; they do not establish software development or airdrop eligibility.

CI executes local regression tests only; scheduled/manual runs additionally read live public sources.
