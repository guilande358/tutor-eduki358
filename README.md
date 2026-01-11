# EduKI - Tutor de Estudos com IA

**URL**: https://lovable.dev/projects/8eedd528-faf5-473b-a997-f111735cf9e1

## 🚀 Tecnologias

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Database, Edge Functions)
- Capacitor (Android/iOS)
- PWA com Service Worker

---

## 📱 App Nativo (Capacitor)

### Estrutura de Assets

Coloque seus arquivos na pasta `resources/`:

```
resources/
├── icon-only.png          # 1024x1024 px, PNG com transparência (ícone principal)
├── icon-foreground.png    # 1024x1024 px, foreground para adaptive icons (Android)
├── icon-background.png    # 1024x1024 px, background para adaptive icons
├── splash.png             # 2732x2732 px, splash screen (centralizada)
└── splash-dark.png        # 2732x2732 px, splash screen modo escuro (opcional)
```

### Gerar Ícones e Splash Screen

```bash
# Gerar assets para todas as plataformas
npm run generate:assets

# Ou apenas para uma plataforma
npm run generate:assets:android
npm run generate:assets:ios
```

### Build Local (Android)

```bash
# 1. Build do projeto web
npm run build

# 2. Adicionar plataforma Android (primeira vez)
npx cap add android

# 3. Gerar assets de ícones e splash
npm run generate:assets:android

# 4. Sincronizar com projeto nativo
npm run cap:sync:android

# 5. Abrir no Android Studio
npx cap open android
# No Android Studio: Build > Generate Signed Bundle / APK
```

### Build Local (iOS)

```bash
# 1. Build do projeto web
npm run build

# 2. Adicionar plataforma iOS (primeira vez)
npx cap add ios

# 3. Gerar assets de ícones e splash
npm run generate:assets:ios

# 4. Sincronizar com projeto nativo
npm run cap:sync:ios

# 5. Abrir no Xcode
npx cap open ios
# No Xcode: Product > Archive
```

### Build Automático (GitHub Actions)

O workflow em `.github/workflows/build-android.yml` gera automaticamente:
- **APK debug**: `EduKI-debug-APK`
- **AAB release**: `EduKI-release-AAB`

Os ícones e splash screens são gerados automaticamente a partir de `resources/`.

---

## 🔧 Desenvolvimento

### Instalação

```bash
# Clone o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Scripts Disponíveis

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run generate:assets  # Gerar ícones e splash para todas as plataformas
npm run cap:sync         # Sincronizar com plataformas nativas
```

### Hot Reload no Dispositivo

Para desenvolvimento com hot-reload em dispositivo físico:

1. Edite `capacitor.config.ts` e descomente as linhas do servidor:
```typescript
server: {
  url: 'https://8eedd528-faf5-473b-a997-f111735cf9e1.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

2. Sincronize e execute:
```bash
npx cap sync
npx cap run android  # ou ios
```

---

## 📖 Documentação Adicional

- [Guia Completo de Setup Nativo](./NATIVE_APP_SETUP.md)
- [Documentação Capacitor](https://capacitorjs.com/docs)
- [Capacitor Assets](https://capacitorjs.com/docs/guides/splash-screens-and-icons)

---

## 🚀 Deploy

### Web (PWA)
Abra [Lovable](https://lovable.dev/projects/8eedd528-faf5-473b-a997-f111735cf9e1) e clique em Share → Publish.

### Android/iOS
Veja a seção "App Nativo" acima ou o arquivo [NATIVE_APP_SETUP.md](./NATIVE_APP_SETUP.md).

---

## 🔗 Domínio Personalizado

Para conectar um domínio, navegue até Project > Settings > Domains e clique em Connect Domain.

Mais informações: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
