# 📱 Recursos de Assets Nativos (Capacitor)

Esta pasta contém os arquivos de origem para gerar ícones e splash screens para Android e iOS.

## 📁 Estrutura de Arquivos

| Arquivo | Tamanho Mínimo | Descrição |
|---------|----------------|-----------|
| `icon-only.png` | 1024×1024 px | Ícone principal (PNG com transparência) |
| `icon-foreground.png` | 1024×1024 px | Foreground para adaptive icons (Android 8+) |
| `icon-background.png` | 1024×1024 px | Background para adaptive icons (cor sólida) |
| `splash.png` | 2732×2732 px | Splash screen (imagem centralizada) |
| `splash-dark.png` | 2732×2732 px | Splash screen modo escuro (opcional) |

## 🎨 Especificações

### Ícones

- **icon-only.png**: Seu logo/ícone com fundo transparente. Será usado para gerar todos os tamanhos de ícone.
- **icon-foreground.png**: Apenas o conteúdo do ícone (logo), sem fundo. Para adaptive icons no Android 8+.
- **icon-background.png**: Cor sólida ou padrão para o fundo do adaptive icon.

### Splash Screen

- **splash.png**: Imagem centralizada no splash. O fundo será preenchido com `backgroundColor` do `capacitor.config.ts` (#6366f1).
- **splash-dark.png**: Versão para modo escuro (opcional).

## 🚀 Como Gerar Assets

Após colocar seus arquivos nesta pasta, execute:

```bash
# Gerar para todas as plataformas
npm run generate:assets

# Apenas Android
npm run generate:assets:android

# Apenas iOS
npm run generate:assets:ios
```

## 📤 O Que é Gerado

### Android
```
android/app/src/main/res/
├── mipmap-mdpi/ic_launcher.png      (48×48)
├── mipmap-hdpi/ic_launcher.png      (72×72)
├── mipmap-xhdpi/ic_launcher.png     (96×96)
├── mipmap-xxhdpi/ic_launcher.png    (144×144)
├── mipmap-xxxhdpi/ic_launcher.png   (192×192)
├── drawable/splash.png
└── drawable-night/splash.png        (modo escuro)
```

### iOS
```
ios/App/App/Assets.xcassets/
├── AppIcon.appiconset/              (todos os tamanhos)
└── Splash.imageset/                 (splash screens)
```

## ⚠️ Importante

1. **Não modifique** os arquivos gerados em `android/` ou `ios/` diretamente
2. Sempre edite os arquivos nesta pasta `resources/`
3. Execute `npm run generate:assets` após qualquer alteração
4. Execute `npx cap sync` para aplicar as mudanças

## 🔗 Documentação

- [Capacitor Assets Guide](https://capacitorjs.com/docs/guides/splash-screens-and-icons)
- [@capacitor/assets npm](https://www.npmjs.com/package/@capacitor/assets)
