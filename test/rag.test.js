import test from 'node:test';
import assert from 'node:assert/strict';
import { retrieve, buildContext, generate, validateCitations, ABSTAIN } from '../src/rag.js';

test('retrieval passes vector and model as SQL parameters', async () => {
  let call;
  const rows = [{ id: 12, text: 'Evidence' }];
  const result = await retrieve('question', {
    embed: async () => [0.1, 0.2], model: 'model-a',
    db: { query: async (sql, params) => { call = { sql, params }; return { rows }; } },
  });
  assert.deepEqual(result, rows);
  assert.match(call.sql, /ORDER BY embedding <=>/i);
  assert.match(call.sql, /LIMIT 5/i);
  assert.match(call.sql, /model_version = \$2/);
  assert.deepEqual(call.params, ['[0.1,0.2]', 'model-a']);
});
test('context is bounded and preserves IDs', () => {
  const context = buildContext(Array.from({ length: 8 }, (_, i) => ({ id: i + 1, text: 'x'.repeat(3000) })));
  assert.equal(context.length, 5);
  assert.deepEqual(context.map(p => p.post_id), [1, 2, 3, 4, 5]);
  assert.ok(context.every(p => p.text.length <= 1200));
  assert.ok(context.reduce((n, p) => n + p.text.length, 0) <= 6000);
  assert.deepEqual(buildContext([]), []);
});
test('generation sends evidence contract and labelled text', async () => {
  let request;
  const context = [{ post_id: 12, text: 'Evidence text' }];
  const answer = await generate('question', context, { model: 'generator',
    llm: { chat: { completions: { create: async args => {
      request = args;
      return { choices: [{ message: { content: 'Answer [12]' } }] };
    } } } },
  });
  assert.equal(answer, 'Answer [12]');
  assert.equal(request.model, 'generator');
  assert.match(request.messages[0].content, /ONLY/);
  assert.match(request.messages[0].content, /untrusted/i);
  assert.deepEqual(JSON.parse(request.messages[1].content), { question: 'question', passages: context });
});
test('citations are deduplicated, cited only, and constrained to context', () => {
  const context = [{ post_id: 12 }, { post_id: 31 }];
  assert.deepEqual(validateCitations('Answer [12] and again [12]', context), [12]);
  assert.deepEqual(validateCitations(ABSTAIN, context), []);
  assert.throws(() => validateCitations('Invented [99]', context));
  assert.throws(() => validateCitations('Uncited answer', context));
});
