import express from 'express';
import { db, redis, llm, embed, embeddingModel, generationModel } from './infra.js';
import { retrieve, buildContext, generate, validateCitations, ABSTAIN } from './rag.js';

const app = express();
// Public teaching corpus only. Add authenticated scope before private retrieval.
app.get('/ask', async (req, res) => {
  if (typeof req.query.q !== 'string' || !req.query.q.trim() || req.query.q.length > 1000) {
    return res.status(400).json({ error: 'q must be a nonempty string of at most 1000 characters' });
  }
  try {
    const rows = await retrieve(req.query.q.trim(), { db, embed, model: embeddingModel });
    const context = buildContext(rows);
    if (!context.length) return res.json({ answer: ABSTAIN, sources: [] });
    const answer = await generate(req.query.q.trim(), context, { llm, model: generationModel });
    return res.json({ answer, sources: validateCitations(answer, context) });
  } catch (error) {
    console.error('Ask failure:', error.message);
    if (error.name === 'APIConnectionError' || error.name === 'APIConnectionTimeoutError' ||
        error.status === 429 || error.status >= 500) {
      return res.status(503).set('Retry-After', '5').json({ error: 'Model service temporarily unavailable' });
    }
    if (error.message === 'Invalid or missing generated citation' || error.message === 'Empty generation response') {
      return res.status(502).json({ error: 'Generation could not be validated' });
    }
    return res.status(500).json({ error: 'Ask request failed' });
  }
});
const server = app.listen(Number(process.env.PORT || 3000));
async function stop() {
  server.close(async () => { await db.end(); await redis.quit(); });
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
