// Adapt these questions to the evidence available in your own corpus.
const questions = [
  'What is cache invalidation?',
  'How do I stop stale cached post pages?',
  'When should I choose Redis rather than Memcached?',
  'Why did my query get slower after I added an index?',
  'What is the secret launch date of the fictional Project NeverListed?',
];
for (const q of questions) {
  const response = await fetch('http://localhost:' + (process.env.PORT || 3000) + '/ask?q=' + encodeURIComponent(q));
  console.log(JSON.stringify({ question: q, status: response.status, response: await response.json() }, null, 2));
}
