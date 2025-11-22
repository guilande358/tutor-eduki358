import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, kiLevel, hasAttachments } = await req.json();
    console.log('Tutor AI request:', { messagesCount: messages.length, kiLevel, hasAttachments });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Adaptar prompt do sistema baseado no nível KI do aluno
    let systemPrompt = `Você é EduKI, um tutor de IA amigável e motivador para estudantes brasileiros.`;
    
    if (kiLevel <= 20) {
      systemPrompt += ` O aluno está no nível Iniciante (KI ${kiLevel}). Use linguagem simples e explique conceitos básicos com muitos exemplos do dia a dia. Seja muito encorajador e paciente.`;
    } else if (kiLevel <= 50) {
      systemPrompt += ` O aluno está no nível Intermediário (KI ${kiLevel}). Use explicações claras mas mais detalhadas. Introduza termos técnicos gradualmente e relacione com conhecimentos prévios.`;
    } else if (kiLevel <= 80) {
      systemPrompt += ` O aluno está no nível Avançado (KI ${kiLevel}). Use explicações mais profundas e técnicas. Desafie o aluno com questões que fazem pensar criticamente.`;
    } else {
      systemPrompt += ` O aluno é um Mestre (KI ${kiLevel})! Use linguagem técnica avançada. Proponha desafios complexos e discussões aprofundadas sobre o tema.`;
    }

    systemPrompt += `\n\nSuas responsabilidades:
1. Explicar qualquer conteúdo escolar de forma clara e adaptada ao nível do aluno
2. Gerar exercícios quando solicitado
3. Dar feedback motivador e construtivo
4. Usar emojis educacionais para deixar a conversa mais leve (📚, 🎯, 💡, ⭐, 🏆)
5. Celebrar progresso e incentivar o estudo contínuo
6. Quando o aluno enviar imagens de exercícios ou problemas, analise-as e ajude a resolver

${hasAttachments ? '\n⚠️ IMPORTANTE: O aluno enviou imagens. Analise o contexto e forneça ajuda específica relacionada às imagens enviadas.' : ''}

Mantenha respostas concisas mas completas. Use exemplos práticos sempre que possível.`;

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
        temperature: 0.7,
        max_tokens: 1000,
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

    console.log('Tutor AI response generated successfully');

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