export const ABSTAIN = 'I cannot answer this from the supplied passages.';

export async function retrieve(q, { embed, db, model }) {
  // TODO 1: Questions currently never reach the stored evidence.
  throw new Error('Retrieval is unfinished');
}

export function buildContext(rows) {
  // TODO 2: The model currently receives neither bounded text nor source IDs.
  throw new Error('Context construction is unfinished');
}

export async function generate(q, context, { llm, model }) {
  // TODO 3: No grounded generation request is made yet.
  throw new Error('Generation is unfinished');
}

export function validateCitations(answer, context) {
  // TODO 4: Unverified model citations currently cannot be returned safely.
  throw new Error('Citation validation is unfinished');
}
