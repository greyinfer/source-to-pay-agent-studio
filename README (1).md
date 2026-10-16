# Source-to-Pay Agent Studio

A portfolio prototype by Rashmi Singh: an orchestrator and six GenAI agents across the procurement source-to-pay cycle, with buyer approval gates, source citations, AI run cost and a decision log.

## Two modes
- Guided demo (default): each agent replays a recorded run on fictional sample data. No setup needed.
- Live AI: visitors can upload their own PDF, Word, Excel or CSV file and the agent analyses it with Claude.

## Deploy as a demo only
Drag this folder onto https://app.netlify.com/drop. The page works straight away in demo mode.

## Turn on live AI (optional)
Live AI is off by default, so the site always runs the guided demo until you switch it on.
1. Deploy from GitHub (Netlify > Add new project > Import an existing project).
2. In Site configuration > Environment variables, add:
   - LIVE_MODE = on
   - ANTHROPIC_API_KEY = your key from console.anthropic.com
3. Redeploy (Deploys > Trigger deploy). The Run the cycle tab then shows "Live AI".
If live AI ever fails, each agent falls back to its recorded demo run.

Your key stays on the server and is never sent to visitors. Each live run is billed to your Anthropic account.
