# HelpNest: Grounded Ask (Mini Project)

A small RAG endpoint, `GET /ask?q=...`, for a public developer knowledge base. The server, cached embedder, request validation and error handling are supplied. **Four helper functions in `src/rag.js` are unfinished.** You complete them so the endpoint returns answers supported by retrieved posts, or an honest abstention.

## What you will build

| TODO | Function | Job |
|---|---|---|
| 1 | `retrieve` | Embed the question and fetch the top 5 compatible posts with a parameterized pgvector query |
| 2 | `buildContext` | Keep at most 5 passages with stable post IDs and bounded text |
| 3 | `generate` | Ask the model to answer using only those passages, with citations or an exact abstention |
| 4 | `validateCitations` | Reject unknown or missing citations and return deduplicated cited IDs |

## Prerequisites

- Node.js 20 or newer
- PostgreSQL with pgvector, and your own populated table of embedded posts: `posts_embeddings(id INT, text TEXT, embedding vector(N), model_version TEXT)`
- Redis
- An OpenAI key with access to your embedding model and a chat generation model
- Stored vectors must come from the same model as `EMBEDDING_MODEL`. Do not silently switch models.

`npm test` needs none of these services. Live answers do.

## Setup

1. **Fork** this repository to your own GitHub account, then clone your fork.
2. Create a branch: `git checkout -b feat/grounded-ask`
3. `cp .env.example .env` and fill in your values. Never commit `.env`.
4. `npm install`
5. Complete the four TODOs in `src/rag.js`. Leave `src/index.js` and `src/infra.js` unchanged.
6. `npm test` runs four offline tests against your helpers, using injected test doubles. No paid calls.
7. `npm start` launches the endpoint. In a second terminal, run `npm run questions`.

## Validate

- `curl "http://localhost:3000/ask?q="` should return HTTP 400.
- `npm run questions` sends five questions from `questions.js`. Adapt the answerable ones to your own corpus. The last question is meant to be unanswerable.
- A supported answer cites IDs that were in the prompt context.
- An unanswerable question returns exactly `I cannot answer this from the supplied passages.` with `sources: []`.
- The offline tests check interface behavior, not factual truth. Read the cited passage yourself to confirm each claim.

## Limits to know about

- The 6,000-character passage cap is a teaching bound, not exact token budgeting. Use your model's tokenizer for that.
- Prompt instructions reduce risk but do not guarantee safe behavior.
- This corpus is public. A private corpus needs authenticated retrieval filters and permission-aware caches.
- A retained excerpt may omit an answer that exists in the full post. Report that honestly.

## Submission

Push your branch to **your own fork** and submit your **repository link**. Do not open a Pull Request against this repository. Include in your README: your `npm test` output, the five live responses (mark the unanswerable one), and a short paragraph on citation membership versus claim support. Never commit `.env` or credentials.
