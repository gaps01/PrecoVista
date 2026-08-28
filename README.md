# PreçoVista interactive prototype

The prototype is a responsive Next.js/Vinext site with Recharts. It includes product search, selectable product analyses, 90-day history charts, percentile recommendations, and target-price alert creation.

When `NEXT_PUBLIC_API_URL` is configured, search, detail, and alert actions use FastAPI. If the API is unavailable—or when deployed without that variable—the representative demo catalog remains fully interactive and alerts are stored on the current device.

```powershell
pnpm install
pnpm dev
```

Open `http://localhost:3000`.
