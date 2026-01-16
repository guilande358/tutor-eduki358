import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const requestSchema = z.object({
      subject: z.string(),
      difficulty: z.string(),
      questionCount: z.number().min(3).max(10),
      questionTypes: z.array(z.string()),
      weakTopics: z.array(z.string()).optional(),
    });

    const requestData = await req.json();
    const { subject, difficulty, questionCount, questionTypes, weakTopics } = requestSchema.parse(requestData);
    
    console.log('Generating daily quiz:', { subject, difficulty, questionCount, questionTypes, weakTopics });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build dynamic prompt based on difficulty and weak topics
    let difficultyGuide = "";
    switch (difficulty) {
      case "easy":
        difficultyGuide = "Nível FÁCIL: Perguntas básicas, conceitos fundamentais, vocabulário simples.";
        break;
      case "medium":
        difficultyGuide = "Nível MÉDIO: Perguntas intermediárias que exigem raciocínio, aplicação de conceitos.";
        break;
      case "hard":
        difficultyGuide = "Nível DIFÍCIL: Perguntas desafiadoras que exigem conhecimento profundo, análise e síntese.";
        break;
    }

    const weakTopicsGuide = weakTopics && weakTopics.length > 0
      ? `\n\nATENÇÃO: O aluno tem dificuldade nos seguintes tópicos, inclua perguntas relacionadas: ${weakTopics.slice(0, 5).join(", ")}`
      : "";

    const questionTypesGuide = questionTypes.map(type => {
      switch (type) {
        case "multiple_choice":
          return "- Múltipla escolha (4 opções, apenas 1 correta)";
        case "true_false":
          return "- Verdadeiro ou Falso";
        case "fill_blank":
          return "- Preencher lacuna (resposta curta, 1-2 palavras)";
        default:
          return "";
      }
    }).filter(Boolean).join("\n");

    const systemPrompt = `Você é um gerador de quizzes educacionais. Gere ${questionCount} perguntas de ${subject}.

${difficultyGuide}
${weakTopicsGuide}

TIPOS DE PERGUNTAS A GERAR (distribua entre os tipos):
${questionTypesGuide}

FORMATO DE RESPOSTA (JSON válido):
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Pergunta aqui com fórmulas se necessário",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctAnswer": 0,
      "explanation": "Explicação detalhada da resposta correta"
    },
    {
      "id": "q2",
      "type": "true_false",
      "question": "Afirmação aqui",
      "correctAnswer": true,
      "explanation": "Explicação"
    },
    {
      "id": "q3",
      "type": "fill_blank",
      "question": "Complete: A fórmula da água é ___",
      "correctAnswer": "h2o",
      "explanation": "Explicação"
    }
  ]
}

REGRAS:
1. Para multiple_choice: correctAnswer é o índice (0-3) da opção correta
2. Para true_false: correctAnswer é boolean (true/false)
3. Para fill_blank: correctAnswer é string (resposta esperada em minúsculo)
4. Use fórmulas matemáticas naturalmente (ex: E=mc², x²+2x+1, √2)
5. Perguntas devem ser variadas e interessantes
6. Explicações devem ser claras e educativas
7. Retorne APENAS o JSON, sem texto adicional`;

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
          { role: 'user', content: `Gere ${questionCount} perguntas de ${subject} no nível ${difficulty}. Retorne apenas JSON válido.` }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Muitas requisições. Aguarde um momento.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Raw AI response:', content.substring(0, 200));

    // Parse the JSON response
    let questions;
    try {
      const parsed = JSON.parse(content);
      questions = parsed.questions || parsed;
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Falha ao gerar quiz. Tente novamente.');
    }

    // Validate questions structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Quiz gerado está vazio. Tente novamente.');
    }

    // Ensure each question has an ID
    questions = questions.map((q: any, index: number) => ({
      ...q,
      id: q.id || `q${index + 1}`,
    }));

    console.log(`Successfully generated ${questions.length} questions`);

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-daily-quiz:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
