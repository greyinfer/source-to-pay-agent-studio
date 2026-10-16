# Source-to-Pay Agent Studio

A portfolio prototype by Rashmi Singh: an orchestrator and six GenAI agents across the procurement source-to-pay cycle, with buyer approval gates, source citations, AI run cost and a decision log.

## Two modes
- Guided demo (default): each agent replays a recorded run on fictional sample data. No setup needed.
- Live AI: visitors can upload their own PDF, Word, Excel or CSV file and the agent analyses it with Claude.

## Turn on live AI
Drag-and-drop deploys do not run server functions, so deploy from GitHub or the Netlify CLI:
1. Put this folder in a GitHub repository and import it in Netlify (Add new site > Import an existing project).
2. In Site configuration > Environment variables, add ANTHROPIC_API_KEY with your key from console.anthropic.com.
3. Redeploy. The top bar switches from "Guided demo" to "Live AI".

Your key stays on the server and is never sent to visitors. Each live run is billed to your Anthropic account.
