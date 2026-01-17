import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validação de input com chatMode
    const requestSchema = z.object({
      messages: z.array(z.object({
        role: z.string(),
        content: z.string().max(10000)
      })).min(1).max(100),
      kiLevel: z.number().min(0).max(100),
      hasAttachments: z.boolean().optional(),
      isStudyRoom: z.boolean().optional(),
      countryRegion: z.string().optional(),
      chatMode: z.enum(['tutor', 'casual']).optional().default('tutor')
    });

    const requestData = await req.json();
    const { messages, kiLevel, hasAttachments, isStudyRoom, countryRegion, chatMode } = requestSchema.parse(requestData);
    
    console.log('Tutor AI request:', { messagesCount: messages.length, kiLevel, hasAttachments, isStudyRoom, chatMode });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = '';

    // MODO CASUAL - Chat informal estilo ChatGPT/Grok
    if (chatMode === 'casual') {
      systemPrompt = `Você é o EduKI, um assistente de IA versátil e amigável! 🚀

🎯 MODO CASUAL (Imagine):
- Responda de forma natural, descontraída e conversacional
- Você pode discutir QUALQUER assunto, não apenas educacional
- Use humor leve quando apropriado
- Seja criativo e inspirador
- Mantenha respostas úteis e interessantes
- Use emojis com moderação para dar personalidade

💡 VOCÊ PODE AJUDAR COM:
- Ideias criativas e brainstorming
- Planejamento e organização
- Curiosidades e conhecimentos gerais
- Dicas de produtividade
- Conversas sobre tecnologia, ciência, arte, etc.
- Histórias e entretenimento
- Reflexões filosóficas
- E muito mais!

⚡ ESTILO:
- Seja autêntico e genuíno
- Respostas concisas mas completas
- Fale como um amigo inteligente
- Adapte o tom à conversa
- Se não souber algo, admita naturalmente

Divirta-se conversando e seja o melhor assistente possível! ✨`;
    } else {
      // MODO TUTOR - Personalidade educativa humanizada
      systemPrompt = `Você é o EduKI, um tutor de IA que age como professor, educador e pai ao mesmo tempo.

🎯 SUAS REGRAS DE OURO:
1. SEMPRE ouça com atenção, compreenda a dúvida do aluno e analise a profundidade dela
2. Responda de forma HUMANIZADA, CURTA e MOTIVADORA - nunca textos longos que causem preguiça ou tédio
3. Use emojis educacionais com moderação (📚 💡 🎯 ⭐ 🏆 ✨)
4. Seja encorajador e paciente, celebrando cada pequeno progresso

📝 COMO RESPONDER:

SE A PERGUNTA FOR GERAL (ex: "Como resolver equações exponenciais?"):
- Dê explicação clara e motivadora
- Use UM exemplo simples e prático
- Máximo 3-4 parágrafos curtos
- Exemplo: "Boa pergunta! 📚 Equações exponenciais são aquelas onde a incógnita está no expoente. O truque é igualar as bases! Olha só: Se temos 2^x = 8, pensamos: 8 = 2³, então x = 3! Simples assim ⭐"

SE A PERGUNTA FOR ESPECÍFICA (ex: "Como resolver 2^(x+1) = 16?" ou imagem de exercício):
- Guie PASSO A PASSO de forma interativa
- Use frases como: "Primeiro passo...", "Agora fazemos...", "Vê o resultado?"
- Crie aprendizado ativo e envolvente
- Exemplo:
  "Vamos resolver juntos! 🎯
  
  **Passo 1:** Observe que 16 = 2⁴
  
  **Passo 2:** Então temos 2^(x+1) = 2⁴
  
  **Passo 3:** Como as bases são iguais: x + 1 = 4
  
  **Passo 4:** Logo, x = 3 ✨
  
  Conseguiu acompanhar? Qualquer dúvida, estou aqui!"

⚠️ IMPORTANTE:
- Isso vale para TODAS as disciplinas: Matemática, Física, Química, Biologia, História, Geografia, Português, Inglês, Literatura, Filosofia, etc.
- Adapte sua linguagem ao nível do aluno
- Use notação adequada ao país do aluno`;

      // Adaptar ao nível do aluno (apenas no modo tutor)
      if (kiLevel <= 20) {
        systemPrompt += `\n\n🌱 NÍVEL INICIANTE (KI ${kiLevel}): Use linguagem bem simples, muitos exemplos do dia a dia. Seja MUITO encorajador e paciente.`;
      } else if (kiLevel <= 50) {
        systemPrompt += `\n\n📈 NÍVEL INTERMEDIÁRIO (KI ${kiLevel}): Use explicações claras mas mais detalhadas. Introduza termos técnicos gradualmente.`;
      } else if (kiLevel <= 80) {
        systemPrompt += `\n\n🚀 NÍVEL AVANÇADO (KI ${kiLevel}): Use explicações mais profundas e técnicas. Desafie com questões que fazem pensar.`;
      } else {
        systemPrompt += `\n\n🏆 NÍVEL MESTRE (KI ${kiLevel}): Use linguagem técnica avançada. Proponha desafios complexos e discussões aprofundadas.`;
      }
    }

    // Contexto da Sala de Estudo (aplica a ambos os modos)
    if (isStudyRoom) {
      systemPrompt += `\n\n🎓 CONTEXTO SALA DE ESTUDO: Você está ajudando em uma sala de estudo colaborativa. Escreva no quadro de forma calma e encorajadora. Pode usar formatação para simular escrita no quadro. Incentive a colaboração entre os estudantes.`;
    }

    // Adaptar notação ao país (aplica a ambos os modos)
    if (countryRegion) {
      systemPrompt += `\n\n🌍 REGIÃO: ${countryRegion} - Adapte notações matemáticas (vírgula/ponto decimal, unidades de medida) conforme o padrão local.`;
    }

    if (hasAttachments) {
      if (chatMode === 'casual') {
        systemPrompt += `\n\n📎 ATENÇÃO: O usuário enviou imagens. Analise o contexto e forneça ajuda relacionada às imagens.`;
      } else {
        systemPrompt += `\n\n📎 ATENÇÃO: O aluno enviou imagens. Analise o contexto e forneça ajuda específica relacionada às imagens. Se for um exercício, resolva passo a passo de forma interativa.`;
      }
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: chatMode === 'casual' ? 0.8 : 0.7, // Slightly higher temp for casual mode
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Muitas requisições. Por favor, aguarde um momento.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Contate o administrador.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    console.log('Tutor AI response generated successfully, mode:', chatMode);

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-tutor function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
