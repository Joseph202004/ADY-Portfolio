// Serverless proxy for the sticky-note board.
//
// The board posts {messages:[{role,content}...]} here and gets {reply} back.
// The API key is read from the environment and never reaches the browser —
// this file exists precisely so the key does not have to live in script.js,
// where anyone viewing source could read it.
//
// Set GEMINI_API_KEY in your host's environment (Vercel: Project → Settings →
// Environment Variables). Never commit it.

import { createHash } from "node:crypto";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

/* The key has been set under more than one name on this project, so the proxy
   looks under each of them rather than insisting on one. No judgement is made
   about the shape: AI Studio issues both "AIza..." and the newer "AQ..."
   keys, and both authenticate. */
const KEY_NAMES = [
  "GEMINI_API_KEY", "GOOGLE_API_KEY", "GEMINI_KEY",
  "PORTFOLIO", "portfolio", "Portfolio",
];

function findKey() {
  for (const n of KEY_NAMES) {
    const v = (process.env[n] || "").trim();
    if (v) return [n, v];
  }
  return null;
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
      // Enough to tell one key from another, or to catch a truncated paste,
      // and nothing that could be used as a key.
      keyPrefix: hit ? hit[1].slice(0, 3) : null,
      keyLength: hit ? hit[1].length : 0,
      /* Every key of this type is 53 characters starting "AQ.", so a prefix
         and a length cannot tell one from another — and "the key that works"
         and "an older key that was replaced" look identical from outside.
         Eight hex characters of a digest settle it, and are no use as a key. */
      keyFingerprint: hit
        ? createHash("sha256").update(hit[1]).digest("hex").slice(0, 8)
        : null,
    });
  }

  /* ?diag=1 asks upstream the smallest question there is and returns what
     Google says about it, with the key scrubbed out of the reply. A refusal
     that only ever reads "upstream 401" cannot be told apart from a wrong key,
     a restricted key, or a blocked caller — and those have different fixes. */
  const wantsDiag = /[?&]diag=/.test(req.url || "") || !!req.query?.diag;
  if (req.method === "GET" && wantsDiag) {
    const hit2 = findKey();
    if (!hit2) return res.status(501).json({ error: "no API key is set" });
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": hit2[1] },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "hi" }] }] }),
        }
      );
      const text = (await r.text()).split(hit2[1]).join("[key]");
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ upstreamStatus: r.status, upstreamBody: text.slice(0, 900) });
    } catch (err) {
      return res.status(200).json({ upstreamStatus: "fetch failed", upstreamBody: String(err).slice(0, 300) });
    }
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
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 300,
      /* The 3.x models think before answering and charge that thinking to the
         same budget: at 160 tokens, 151 went on thoughts and the reply was cut
         off after four words. The board wants a couple of sentences, not
         deliberation, so the thinking is switched off and the budget raised. */
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  /* One call to Google. Kept as a function because the same request is made
     more than once below, against different models. */
  const call = model => fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined,
    }
  );
  const textOf = data =>
    data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("").trim() || "";

  try {
    /* The free tier allows twenty requests a day per model, so a board that
       gets any traffic at all will run one dry — and an exhausted quota is a
       property of the model, not the key. The lighter models have their own
       allowance, so an answer is still there after the first runs out. */
    const chain = [...new Set([MODEL, "gemini-3.5-flash-lite", "gemini-flash-lite-latest"])];
    let last = null;

    for (const model of chain) {
      const r = await call(model);
      const data = await r.json().catch(() => ({}));

      if (r.ok) {
        const reply = textOf(data);
        if (reply) {
          res.setHeader("Cache-Control", "no-store");
          return res.status(200).json({ reply, model });
        }
      }

      /* Google retires a model and names its replacement in the error. Take
         that hint once rather than staying dead until someone redeploys. */
      const swap = r.status === 404 &&
        /no longer available/i.test(data?.error?.message || "") &&
        (data.error.message.match(/use models\/([\w.-]+)/) || [])[1];
      if (swap && !chain.includes(swap)) chain.push(swap);

      last = r.status;
      // A quota or a dead model is worth trying the next one for; anything
      // else (a bad key, a malformed request) will fail the same way again.
      if (r.status !== 429 && r.status !== 404) break;
    }

    // Pass the status through but not the provider's message, which can echo
    // the key back in some error shapes.
    return res.status(last || 502).json({
      error: "upstream " + last,
      ...(last === 429 ? { reason: "quota" } : {}),
    });
  } catch (err) {
    return res.status(504).json({ error: "upstream timeout" });
  }
}
