
# Plano de Correção Completa do EduKI

## Problemas Identificados (das imagens e descrição)

### 1. Chat Tutor - Texto Não Expande Corretamente
**Problema**: As respostas do tutor não estão renderizando com o estilo visual correto (como na primeira imagem de referência com fórmulas matemáticas expandidas).
**Solução**: Melhorar o `MathRenderer.tsx` para expandir texto e adicionar estilos CSS para fórmulas no estilo Notion Card.

### 2. Integração Perplexity para Pesquisa Profunda
**Problema**: O tutor não busca referências externas.
**Solução**: Integrar Perplexity API via connector para pesquisa web com citações.

### 3. Notificações Dependem do Navegador
**Problema**: Mensagem "Seu navegador não suporta notificações push" (terceira imagem).
**Solução**: Implementar notificações nativas via `@capacitor/local-notifications` com fallback para Web.

### 4. Erro "duplicate key" nas Preferências do Quiz
**Problema**: "duplicate key value violates unique constraint 'user_quiz_preferences_user_id_key'" (segunda imagem).
**Solução**: Corrigir `useDailyQuiz.tsx` para usar `upsert` corretamente com `onConflict`.

### 5. Sala de Estudos - Botão Enviar Não Funciona
**Problema**: O botão de enviar mensagem no chat da sala não está enviando (quarta imagem).
**Solução**: Verificar e corrigir o `RoomChat.tsx` - o código parece correto, mas pode haver problema com o estado `loading` ou `newMessage`.

### 6. Câmera Não Disponível na Sala de Estudos
**Problema**: Câmera não funciona na sala de estudos.
**Solução**: Adicionar botão de câmera no chat da sala usando `CameraScanButton`.

### 7. Participantes no Estilo Messenger
**Problema**: Lista de participantes deve ser como o Messenger (quinta imagem) com avatares circulares e status.
**Solução**: Redesenhar `ParticipantGrid.tsx` com layout horizontal estilo Messenger e vinhetas de atividade.

### 8. Unity Ads Banner Não Aparece
**Problema**: Banner de anúncios não está visível.
**Solução**: O `UnityAdsBanner.tsx` existe mas só aparece para usuários free. Verificar se está integrado corretamente e adicionar inicialização do Unity Ads SDK.

### 9. Sistema de Conversão XP para Créditos Não Funciona
**Problema**: Conversão de XP em créditos não está funcionando.
**Solução**: Verificar `ConvertXPCredits.tsx` e garantir que o hook `useUnityAds` está inicializando corretamente.

### 10. Rewards para Vida e Micro Aulas
**Problema**: Sistema de recompensas não funciona.
**Solução**: Verificar `CreditsRecovery.tsx` e `MicroLessonPanel.tsx`.

---

## Implementação Detalhada

### FASE 1: Correções Críticas de Funcionamento

#### 1.1 Corrigir Erro de Preferências do Quiz (Prioridade Alta)
```typescript
// Em useDailyQuiz.tsx - savePreferences
const savePreferences = async (newPrefs: QuizPreferences) => {
  // Usar upsert com onConflict explícito
  const { data: existing } = await supabase
    .from("user_quiz_preferences")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const operation = existing 
    ? supabase.from("user_quiz_preferences").update({...newPrefs, updated_at: new Date().toISOString()}).eq("user_id", userId)
    : supabase.from("user_quiz_preferences").insert({user_id: userId, ...newPrefs});

  const { error } = await operation;
  // ...
};
```

#### 1.2 Corrigir Chat da Sala de Estudos - Botão Enviar
```typescript
// Em RoomChat.tsx - verificar se o problema está no onClick
<Button 
  onClick={sendMessage} 
  disabled={loading || !newMessage.trim()}
  type="button"  // Garantir que não é submit
>
```

#### 1.3 Notificações Nativas (Capacitor)
```typescript
// Em useNotifications.tsx - Adicionar suporte nativo
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const requestPermission = async () => {
  if (Capacitor.isNativePlatform()) {
    // Usar Capacitor Local Notifications
    const result = await LocalNotifications.requestPermissions();
    return result.display === "granted";
  } else {
    // Fallback para Web API
    if (!("Notification" in window)) {
      toast({ title: "Notificações não suportadas", variant: "destructive" });
      return false;
    }
    // ... código existente
  }
};
```

---

### FASE 2: Melhorias de UI/UX

#### 2.1 Participantes Estilo Messenger
```typescript
// Redesenhar ParticipantGrid.tsx
const ParticipantGrid = ({ roomId, hostUserId, currentUserId, isTutorActive }) => {
  return (
    <Card className="p-3">
      <h4>Participantes ({count})</h4>
      
      {/* Layout horizontal scrollável estilo Messenger */}
      <ScrollArea orientation="horizontal">
        <div className="flex gap-3 pb-2">
          {participants.map((p) => (
            <div className="flex flex-col items-center gap-1 min-w-[70px]">
              <div className="relative">
                <Avatar className="w-14 h-14 ring-2 ring-green-500">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                {/* Status indicator */}
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2" />
              </div>
              <p className="text-xs font-medium truncate">{name}</p>
              {/* Vinheta de atividade */}
              <span className="text-[10px] text-muted-foreground">
                {activity || "Online"}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
```

#### 2.2 Melhorar Renderização de Matemática
```css
/* Adicionar em index.css */
.notion-math-card {
  background: hsl(var(--muted) / 0.5);
  border-radius: 12px;
  padding: 16px 24px;
  margin: 12px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow-x: auto;
}

.math-renderer {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Texto expande corretamente */
.chat-message-content {
  white-space: pre-wrap;
  word-break: break-word;
}
```

---

### FASE 3: Integrações

#### 3.1 Conectar Perplexity para Pesquisa (Opcional)
- Usar o connector de Perplexity para buscas web
- Criar edge function `ai-tutor-research` que combina Lovable AI + Perplexity

#### 3.2 Câmera na Sala de Estudos
```typescript
// Em RoomChat.tsx - Adicionar CameraScanButton
import CameraScanButton from "@/components/CameraScanButton";

// No JSX, junto com AttachmentButton
<CameraScanButton 
  onImageCapture={handleCameraCapture}
  disabled={loading}
/>

const handleCameraCapture = async (base64Image: string) => {
  // Enviar imagem para o chat da sala
  await supabase.from("room_messages").insert({
    room_id: roomId,
    user_id: userId,
    content: "📷 Imagem de exercício enviada",
    content_type: "image",
    // Armazenar base64 ou fazer upload para storage
  });
};
```

#### 3.3 Unity Ads Banner Funcional
```typescript
// Em UnityAdsBanner.tsx - Garantir que Unity SDK carrega
useEffect(() => {
  if (!isPremium && isVisible) {
    // Carregar Unity Ads SDK para web
    const script = document.createElement("script");
    script.src = "https://ads.unity3d.com/web/v3.3/unityads.js";
    script.async = true;
    script.onload = () => {
      if (window.UnityAds) {
        window.UnityAds.init({ gameId: "5993995", debug: false });
        window.UnityAds.loadBanner({ placementId: "Banner_Android" });
      }
    };
    document.body.appendChild(script);
  }
}, [isPremium, isVisible]);
```

---

### FASE 4: Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/hooks/useDailyQuiz.tsx` | Corrigir upsert de preferências |
| `src/hooks/useNotifications.tsx` | Adicionar suporte Capacitor nativo |
| `src/components/study-room/RoomChat.tsx` | Corrigir botão enviar, adicionar câmera |
| `src/components/study-room/ParticipantGrid.tsx` | Redesign estilo Messenger |
| `src/components/MathRenderer.tsx` | Melhorar renderização LaTeX |
| `src/components/UnityAdsBanner.tsx` | Adicionar carregamento do SDK |
| `src/components/TutorChat.tsx` | Estilos para texto expandido |
| `src/index.css` | Estilos CSS para cards matemáticos |
| `package.json` | Adicionar `@capacitor/local-notifications` |

---

### FASE 5: Dependências a Instalar

```bash
npm install @capacitor/local-notifications
```

---

### Resultado Esperado

1. **Quiz diário salva preferências** sem erro de duplicata
2. **Chat da sala envia mensagens** corretamente
3. **Notificações funcionam no app nativo** (não só navegador)
4. **Participantes aparecem estilo Messenger** com avatares horizontais e status
5. **Fórmulas matemáticas renderizam** com cards estilo Notion
6. **Banner Unity Ads aparece** para usuários free
7. **Câmera disponível** no chat da sala de estudos
8. **Conversão XP/Créditos funciona** após assistir anúncio
