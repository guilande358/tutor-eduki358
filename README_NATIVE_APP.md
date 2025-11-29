# 📱 EduKI - Aplicativo Nativo + PWA

## ✅ O que foi implementado

### 1. **PWA Completo**
- ✅ Service Worker para cache e offline
- ✅ Manifest.json configurado
- ✅ Ícones 192x192 e 512x512
- ✅ Instalável em dispositivos móveis

### 2. **Suporte Nativo (Capacitor)**
- ✅ Configuração Capacitor pronta (`capacitor.config.ts`)
- ✅ Plugin Unity Ads instalado (`capacitor-unity-ads`)
- ✅ Detecção automática de plataforma (Web vs Nativo)
- ✅ LivesTimer.tsx adaptado para ambas plataformas

### 3. **Unity Ads Híbrido**
O componente `LivesTimer.tsx` agora detecta automaticamente a plataforma:

#### **Modo Web (PWA)**:
- Usa o SDK web do Unity Ads (window.UnityAds)
- Funciona em navegadores modernos
- Mantém compatibilidade total com versão PWA

#### **Modo Nativo (iOS/Android)**:
- Usa o plugin `capacitor-unity-ads`
- APIs nativas do Unity Ads para melhor performance
- Suporte completo a rewarded video ads

## 🚀 Como Usar

### Para PWA (Web)
O projeto já está funcionando como PWA! Basta acessar via navegador e instalar.

### Para App Nativo

1. **Siga o guia completo**: Leia `NATIVE_APP_SETUP.md`

2. **Comandos rápidos**:
```bash
# 1. Build do projeto
npm run build

# 2. Adicionar plataformas (primeira vez apenas)
npx cap add android
npx cap add ios

# 3. Sincronizar código
npx cap sync

# 4. Abrir no IDE
npx cap open android  # Para Android Studio
npx cap open ios      # Para Xcode
```

## 🎯 Unity Ads - Como Funciona

### IDs Configurados:
- **Game ID**: `5993995`
- **Placement ID**: `Rewarded_Android`

### Fluxo do Anúncio:
1. App inicializa → Unity Ads carrega
2. Usuário perde vidas → Botão "Assistir Vídeo" aparece
3. Usuário clica → Anúncio é exibido
4. Após completar → Escolhe recompensa (+1 Vida ou +50 XP)
5. Novo anúncio é pré-carregado automaticamente

### Limites:
- 10 anúncios por dia (resetado à meia-noite)
- Alternativa: Completar micro-aula para recuperar vida

## 📊 Estrutura de Código

```
src/components/LivesTimer.tsx
├─ Imports
│  ├─ Capacitor.isNativePlatform() → Detecção de plataforma
│  └─ capacitor-unity-ads (importação dinâmica)
│
├─ Inicialização
│  ├─ Web: window.UnityAds.init()
│  └─ Nativo: UnityAds.initialize()
│
└─ Exibição de Anúncio
   ├─ Web: window.UnityAds.show() com callbacks
   └─ Nativo: UnityAds.showRewardedVideo() com Promise
```

## 🔧 Desenvolvimento

### Hot Reload em Dispositivos
Para testar mudanças instantaneamente em dispositivos reais:

1. Edite `capacitor.config.ts`:
```typescript
server: {
  url: 'http://SEU_IP:8080',
  cleartext: true
}
```

2. Execute:
```bash
npm run dev
npx cap sync
```

3. App carregará código do servidor local!

## 📝 Próximos Passos

### Obrigatório antes do Deploy:
- [ ] Desativar test mode: `testMode: false` (LivesTimer.tsx linha ~97)
- [ ] Testar Unity Ads em produção
- [ ] Configurar Bundle ID no Unity Dashboard
- [ ] Criar ícones específicos para iOS e Android (opcional)
- [ ] Configurar splash screen personalizada (opcional)

### Recomendado:
- [ ] Adicionar permissões de tracking no iOS (Info.plist)
- [ ] Configurar Google Services (Firebase, Analytics)
- [ ] Implementar push notifications
- [ ] Adicionar deep linking
- [ ] Configurar App Store e Google Play listings

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "Anúncios não disponíveis" | Aguarde alguns segundos após iniciar o app |
| Unity Ads não carrega iOS | Execute `pod install` em `ios/App/` |
| Build falha Android | Verifique JDK 17 e execute `npx cap sync` |
| App não detecta plataforma nativa | Verifique se `@capacitor/core` está instalado |

## 📚 Documentação Completa

Leia o arquivo `NATIVE_APP_SETUP.md` para instruções detalhadas de:
- Configuração do ambiente
- Setup do Unity Ads Dashboard
- Build para produção
- Publicação nas stores

---

**Arquivos Importantes**:
- `capacitor.config.ts` - Configuração do Capacitor
- `NATIVE_APP_SETUP.md` - Guia completo de setup
- `src/components/LivesTimer.tsx` - Lógica do Unity Ads
- `public/manifest.json` - Configuração PWA

**Suporte**:
- [Documentação Capacitor](https://capacitorjs.com)
- [Unity Ads Docs](https://docs.unity.com/ads/)
- [Plugin capacitor-unity-ads](https://github.com/eliazv/capacitor-unity-ads)
