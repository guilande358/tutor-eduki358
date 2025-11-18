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
    const { subject, topic, kiLevel, difficulty } = await req.json();
    console.log('Generate exercise request:', { subject, topic, kiLevel, difficulty });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Adaptar dificuldade baseado no KI
    const difficultyMap: Record<string, string> = {
      facil: 'muito simples e direto',
      medio: 'moderado com algum desafio',
      dificil: 'desafiador e que requer pensamento crítico'
    };

    const systemPrompt = `Você é um gerador de exercícios educacionais para o EduKI.
Gere um exercício de múltipla escolha sobre ${subject} - ${topic}.

O aluno está no nível KI ${kiLevel} e o exercício deve ser ${difficultyMap[difficulty] || 'moderado'}.

IMPORTANTE: Retorne APENAS um objeto JSON válido com esta estrutura exata:
{
  "question": "texto da pergunta",
  "options": ["opção A", "opção B", "opção C", "opção D"],
  "correctAnswer": 0,
  "explanation": "explicação detalhada da resposta correta"
}

O correctAnswer deve ser o índice (0-3) da resposta correta no array options.
Não adicione texto antes ou depois do JSON.`;

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
          { role: 'user', content: `Gere um exercício ${difficulty} sobre ${topic}` }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Aguarde um momento.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let exerciseText = data.choices[0].message.content.trim();

    // Limpar possíveis marcações de código
    exerciseText = exerciseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const exercise = JSON.parse(exerciseText);
      
      // Validar estrutura
      if (!exercise.question || !Array.isArray(exercise.options) || 
          typeof exercise.correctAnswer !== 'number' || !exercise.explanation) {
        throw new Error('Invalid exercise structure');
      }

      console.log('Exercise generated successfully');
      return new Response(
        JSON.stringify({ exercise }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Failed to parse exercise JSON:', exerciseText);
      throw new Error('Failed to generate valid exercise format');
    }

  } catch (error) {
    console.error('Error in generate-exercise function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar exercício';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});