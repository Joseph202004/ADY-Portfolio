// Serverless proxy for the sticky-note board.
//
// The board posts {messages:[{role,content}...]} here and gets {reply} back.
// The API key is read from the environment and never reaches the browser —
// this file exists precisely so the key does not have to live in script.js,
// where anyone viewing source could read it.
//
// Set GEMINI_API_KEY in your host's environment (Vercel: Project → Settings →
// Environment Variables). Never commit it.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST only" });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(501).json({ error: "GEMINI_API_KEY is not set" });

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const system = messages.find(m => m.role === "system")?.content || "";
  const turns = messages.filter(m => m.role !== "system");
  if (!turns.length) return res.status(400).json({ error: "no message" });

  // One question at a time, and a hard cap: replies are handwritten stroke by
  // stroke on the page, so a long one would take a minute to draw.
  const body = {
    contents: turns.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content).slice(0, 2000) }],
    })),
    generationConfig: { temperature: 0.7, maxOutputTokens: 160 },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  try {
    const stop = AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined;
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(body),
        signal: stop,
      }
    );

    const data = await r.json();
    if (!r.ok) {
      // Pass the status through but not the provider's message, which can
      // echo the key back in some error shapes.
      return res.status(r.status).json({ error: "upstream " + r.status });
    }

    const reply = data.candidates?.[0]?.content?.parts?.map(p => p.text).join("").trim();
    if (!reply) return res.status(502).json({ error: "empty reply" });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(504).json({ error: "upstream timeout" });
  }
}
