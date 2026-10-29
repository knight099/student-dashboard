# Dashboard chat

Add an Ollama Cloud assistant to the existing attendance dashboard and deploy both to Vercel. The user selected cloud usage charges over local hosting.

Preserve the HTML dashboard and filters. Add an accessible, responsive chat panel with suggestions, conversation history, clear/stop controls, loading and error states. Compute model context on the server from the existing mock dataset, using the selected cohort and mode. Keep the API key only in ignored local environment files and Vercel server environment variables.

Approaches: local Ollama is free but needs an always-on reachable host; Ollama Cloud works from Vercel and incurs usage charges. The user chose Ollama Cloud. Use gemma4:31b, a current supported cloud model; make the model configurable server-side.

Validate request sizes and message roles, bound conversation length and output tokens, reject cross-origin browser requests, and return useful safe errors for invalid credentials, quota limits and upstream failures. No student-data uploads or database are required: use the existing mock data. Chat messages stay in browser memory.

Verify with Node tests for data calculations, filtering and endpoint behavior; inspect the browser and test a production response after deployment.
