// Netlify Function: runs a procurement agent on uploaded document text.
// Set ANTHROPIC_API_KEY in Netlify > Site configuration > Environment variables.
// Optional: MODEL (default claude-sonnet-5-5).

const SHAPE = `Return only JSON, with no other text, in this shape:
{"summary": string, "kpis": [{"label": string, "value": string}],
 "table": {"columns": [string], "rows": [[string]]} or null,
 "sections": [{"title": string, "items": [string]}],
 "findings": [{"title": string, "detail": string, "value": number, "kind": "saving" | "risk", "source": string}],
 "valueLabel": string, "valueTotal": number, "assumptions": string, "handoff": string}
"source" names the line, invoice, clause or section each finding comes from. "handoff" is one sentence for the next agent in the cycle.
Use the currency found in the document. Values are plain numbers. Mark any estimate as an assumption in "assumptions". Never invent facts that are not in the document; if something is missing, say so in the summary.`;

const PROMPTS = {
  spend: `You are a procurement spend classification agent. The user gives you a purchase-order or invoice export.
Normalise supplier names (merge spelling variants), classify every line into a spend category, total spend by category,
and find savings opportunities: price variance for the same item, fragmented suppliers for the same service, and possible duplicate payments.
Put the category totals in "table". Duplicate payments are kind "risk".`,
  category: `You are a procurement category strategy agent. The user gives you spend data or notes for one category.
Profile the category, choose value levers, assess supply risks, and write a 90-day plan, each as a section.
Estimate value only from the data given and state the assumption.`,
  rfp: `You are a procurement sourcing agent. The user gives you requirements and supplier bids.
Score each bid with weighted criteria (state the weights), rank the suppliers in "table", draft an RFP outline and a negotiation fact pack as sections,
and recommend an award. Value is the saving against current spend only if current spend is given.`,
  contract: `You are a procurement contract review agent. The user gives you a contract or master service agreement, and may give the negotiated outcome.
Extract the key clauses into "table" (clause, topic, assessment), flag risky or missing terms against good procurement practice and the negotiated outcome,
and list obligations and key dates as a section. Value is exposure removed by recommended changes, only where it can be calculated from the document.`,
  invoice: `You are a procurement invoice checking agent. The user gives you contract rates and invoice lines.
Check every line for prices above the contract rate, volume discounts not applied, duplicate billing, wrong line totals and charges not in the contract.
Overcharges are kind "saving" with the amount to recover; charges not in the contract are kind "risk". Add a section drafting the credit request to the supplier.`,
  supplier: `You are a supplier risk monitoring agent. The user gives you supplier performance data, notes, renewal dates and price changes.
Score each supplier's risk in "table" (supplier, risk, main issue, action). Findings cover service credits due, renewals that need action and price increases.
Service credits are kind "saving"; price increases and other exposure are kind "risk".`
};

export default async (req) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (req.method === "GET") return Response.json({ ok: Boolean(key) });
  if (!key) return Response.json({ error: "Live mode is not configured." }, { status: 503 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "The request was not valid." }, { status: 400 }); }
  const system = PROMPTS[body.agent];
  if (!system) return Response.json({ error: "This agent is not available yet." }, { status: 400 });
  const text = String(body.text || "").slice(0, 60000);
  if (!text.trim()) return Response.json({ error: "The file had no readable text." }, { status: 400 });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.MODEL || "claude-sonnet-5-5",
      max_tokens: 4000,
      system: system + "\n\n" + SHAPE,
      messages: [{ role: "user", content: (body.context ? `Context from the previous agent in the cycle: ${String(body.context).slice(0, 2000)}\n\n` : "") + `File: ${body.filename || "upload"}\n\n${text}` }]
    })
  });
  if (!res.ok) return Response.json({ error: "The AI service did not respond. Try again shortly." }, { status: 502 });
  const data = await res.json();
  const out = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  try {
    const json = JSON.parse(out.replace(/```json|```/g, "").trim());
    json._usage = data.usage || null;
    return Response.json(json);
  } catch {
    return Response.json({ error: "The agent's answer could not be read." }, { status: 502 });
  }
};

export const config = { path: "/api/agent" };
