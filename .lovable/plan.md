Diagnóstico
----------
Testei a Edge Function `ai-tutor` diretamente e ela devolve 500 com o corpo `{"error":"AI Gateway error: 403"}`. O problema está no cabeçalho de autenticação usado no `fetch` para `https://ai.gateway.lovable.dev/v1/chat/completions`:
- Código atual: `Authorization: Bearer ${LOVABLE_API_KEY}`
- Gateway da Lovable espera: `Lovable-API-Key: ${LOVABLE_API_KEY}`

O segredo `LOVABLE_API_KEY` já existe e está gerenciado no projeto. Não é necessário adicionar uma chave Gemini/Groq separada — o app usa o Lovable AI Gateway.

As mesmas funções `generate-exercise` e `generate-daily-quiz` usam o mesmo cabeçalho errado e também vão falhar se chamadas.

Plano
-----
1. Corrigir o cabeçalho de autenticação em `supabase/functions/ai-tutor/index.ts`, `supabase/functions/generate-exercise/index.ts` e `supabase/functions/generate-daily-quiz/index.ts`, trocando `Authorization: Bearer ...` por `Lovable-API-Key: ...`.
2. Melhorar o tratamento de erros do gateway para retornar mensagens claras em português (401/403, 402 sem créditos, 429 rate limit) sem quebrar os CORS headers.
3. Testar a `ai-tutor` via `curl_edge_functions` com um payload simples (mensagem e kiLevel) para confirmar resposta 200.
4. Se ainda retornar 401/403 mesmo com o cabeçalho correto, rotacionar o `LOVABLE_API_KEY` e repetir o teste.
5. Fazer deploy das três Edge Functions (`ai-tutor`, `generate-exercise`, `generate-daily-quiz`).
6. Verificar os logs pós-deploy e confirmar que o tutor responde normalmente nas secções onde estava a falhar (chat principal, sala de estudo, gerador de exercício e quiz diário).