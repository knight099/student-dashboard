# Student attendance dashboard

Existing interactive attendance dashboard with a filter-aware Ollama Cloud assistant. The bundled dataset is randomly generated mock student data.

Run locally with Node 24:

```sh
cp .env.example .env
# Set OLLAMA_API_KEY in .env (the existing OLLAMA_API name also works).
npm run dev
```

Open http://127.0.0.1:3000. No dependencies are required. Run `npm test` for server context and API tests.

## Deploy to Vercel

Link the project using `vercel link`. Add `OLLAMA_API_KEY` as a sensitive production environment variable via `vercel env add OLLAMA_API_KEY production --sensitive`. Optionally set `OLLAMA_MODEL` (default `gemma4:31b`). Deploy with `vercel --prod`.

The API key stays server-side; `.env` and the original spreadsheet are excluded from deployment. Ollama Cloud incurs usage charges. Chat history stays in browser memory and is sent with selected filters to `/api/chat`. The server derives dataset context and sends it to Ollama. It does not store conversations.

This deployment has no application login. Vercel deployment protection can restrict visitors if needed. API input and output are bounded; configure account spending limits and Vercel firewall rate limits for broad public use.
