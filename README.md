# Base-commits

Base ecosystem monitor & contribution hub.

## 📋 About

Tracking the **Base** blockchain ecosystem — built by Coinbase. Monitors network activity, new projects, and potential airdrop opportunities.

## 🤖 Base Ecosystem Monitor

Runs every 6 hours via GitHub Actions:

| Feature | Description |
|---------|-------------|
| Block tracking | Latest Base mainnet block number |
| New projects | Detects new protocols building on Base |
| Airdrop alerts | Flags potential airdrop opportunities |

### Setup

No configuration needed. Workflow runs automatically every 6 hours.

Results saved in `BASE-MONITOR/logs/` and `BASE-MONITOR/tracked_projects.json`.

### Local Run

```bash
cd BASE-MONITOR
npm install
npm start
```

## 🔗 Links

- [Base Blog](https://blog.base.dev/)
- [Base Network](https://base.org)
- [X: @Demarco639](https://x.com/Demarco639)
