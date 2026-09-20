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

/* The key has been set under more than one name on this project, so the
   proxy looks under each of them rather than insisting on one. A Google API
   key begins "AIza" — anything else in these slots is something other than a
   Gemini key (an OAuth token, say), so a well-formed one is preferred over
   whatever happens to be first. */
const KEY_NAMES = [
  "GEMINI_API_KEY", "GOOGLE_API_KEY", "GEMINI_KEY",
  "PORTFOLIO", "portfolio", "Portfolio",
];

function findKey() {
  const found = KEY_NAMES
    .map(n => [n, (process.env[n] || "").trim()])
    .filter(([, v]) => v);
  const wellFormed = found.find(([, v]) => v.startsWith("AIza"));
  return wellFormed || found[0] || null;
}

export default async function handler(req, res) {
  /* A status probe: which names hold something, and whether any of them looks
     like a Google key. Names and shapes only — never a value, and no call to
     the provider, so this cannot spend anyone's quota. */
  if (req.method === "GET") {
    const hit = findKey();
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      model: MODEL,
      namesSet: KEY_NAMES.filter(n => (process.env[n] || "").trim()),
      using: hit ? hit[0] : null,
      looksLikeGoogleKey: hit ? hit[1].startsWith("AIza") : false,
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "POST only" });
  }

  const hit = findKey();
  if (!hit) return res.status(501).json({ error: "no API key is set" });
  const key = hit[1];

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
