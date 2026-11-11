# HelpNest: Grounded Ask (Mini Project)

A small RAG endpoint, `GET /ask?q=...`, for a public developer knowledge base. The server, cached embedder, request validation and error handling are supplied. **All four helper functions in `src/rag.js` have been completed** so the endpoint returns answers strictly supported by retrieved posts, or an honest abstention.

## Completed Helpers

| Function | Implementation Details |
|---|---|
| `retrieve` | Generates a vector embedding for the query and fetches top 5 compatible posts from `posts_embeddings` using a parameterized cosine distance query (`embedding <=> $1::vector`), filtered by `model_version = $2`. Prevents SQL injection by parameterizing vector and model values. |
| `buildContext` | Keeps at most 5 passages, each capped at 1,200 characters and bounded to a total of 6,000 characters. Preserves `post_id` and throws on invalid IDs or non-string text. Returns `[]` on empty input. |
| `generate` | Constructs a prompt contract instructing the model to answer using ONLY the supplied passages, cite every claim with `[post_id]`, never invent IDs, treat passage text as untrusted data, and return an exact abstention string if evidence is insufficient. Enforces `max_completion_tokens: 500` and validates non-empty responses. |
| `validateCitations` | Returns `[]` if the response is an exact abstention. Parses all `[post_id]` citations, deduplicates them, verifies that every cited ID was present in the supplied context, and throws an error if unknown IDs are cited or citations are missing on generated answers. |

---

## Offline Unit Test Results

The four unit tests in `test/rag.test.js` verify behavior using test doubles (no external database or paid API keys required):

```text
> helpnest-grounded-ask@1.0.0 test
> node --test test/*.test.js

✔ retrieval passes vector and model as SQL parameters (1.1042ms)
✔ context is bounded and preserves IDs (0.2734ms)
✔ generation sends evidence contract and labelled text (1.1522ms)
✔ citations are deduplicated, cited only, and constrained to context (0.4032ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 87.3283
```

---

## Live Endpoint Responses

Running `npm run questions` against the endpoint produces the following live responses across the test set:

### Question 1: What is cache invalidation?
```json
{
  "question": "What is cache invalidation?",
  "status": 200,
  "response": {
    "answer": "Cache invalidation is a strategy to prevent serving outdated values by setting a TTL and invalidating stale entries on write [1002].",
    "sources": [
      1002
    ]
  }
}
```

### Question 2: How do I stop stale cached post pages?
```json
{
  "question": "How do I stop stale cached post pages?",
  "status": 200,
  "response": {
    "answer": "To stop serving outdated values, set a TTL and invalidate the cache on write, or use write-through caching to keep the cache and database in sync [1002].",
    "sources": [
      1002
    ]
  }
}
```

### Question 3: When should I choose Redis rather than Memcached?
```json
{
  "question": "When should I choose Redis rather than Memcached?",
  "status": 200,
  "response": {
    "answer": "You should choose between Redis and Memcached by evaluating trade-offs across supported features, persistence requirements, and data types [1020].",
    "sources": [
      1020
    ]
  }
}
```

### Question 4: Why did my query get slower after I added an index?
```json
{
  "question": "Why did my query get slower after I added an index?",
  "status": 200,
  "response": {
    "answer": "Adding an index speeds up reads but slows down writes; additionally, queries can become slower if the query planner makes mistakes and chooses to ignore the index [1003].",
    "sources": [
      1003
    ]
  }
}
```

### Question 5: What is the secret launch date of the fictional Project NeverListed? *(Unanswerable Question)*
```json
{
  "question": "What is the secret launch date of the fictional Project NeverListed?",
  "status": 200,
  "response": {
    "answer": "I cannot answer this from the supplied passages.",
    "sources": []
  }
}
```

---

## Interpretation: Evidence, Bounds, and Grounding

The answer to *"How do I stop stale cached post pages?"* was directly supported by Post 1002 via the backing source sentence: *"How to stop serving outdated values: set a TTL and invalidate on write; write-through keeps cache and DB in sync."* When queried about the launch date of the fictional Project NeverListed, the system adhered to the strict evidence contract and returned an exact abstention (`"I cannot answer this from the supplied passages."`) with empty sources, which prevents dangerous hallucinations and preserves user trust by communicating bounds of knowledge rather than fabricating plausible misinformation. A fixed 6,000-character ceiling is not a true token budget because character counts correlate inconsistently with subword BPE tokens across languages, symbols, and formatting, meaning dense technical prose or non-Latin text can overflow LLM context limits despite respecting character bounds. Furthermore, while our citation validator guarantees that returned IDs exist in the retrieved context, syntactic ID membership does not prove semantic truth, as an LLM can still attribute an unsupported claim or misconstrued assertion to a real document ID. Finally, bounding each individual passage to 1,200 characters may truncate longer posts, meaning valid answers located deeper in the original post can be omitted during context construction.

---

## Limits to Know About

- **Token Budgeting:** Character capping (6,000 total / 1,200 per passage) provides an approximate boundary; production systems should utilize model-specific tokenizers (e.g. `tiktoken`) for exact budget management.
- **Untrusted Context:** The prompt instructs the model to treat context as untrusted data to mitigate prompt injection, but defense-in-depth sanitization is always advised.
- **Access Scoping:** This setup operates on a public developer knowledge base; private enterprise deployments require row-level security, tenant scoping, and authorization filters before retrieval.
