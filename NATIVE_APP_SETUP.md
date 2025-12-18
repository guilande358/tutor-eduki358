# Guia de Configuração: EduKI para Aplicativo Nativo

Este guia mostra como transformar o EduKI PWA em um aplicativo nativo para iOS e Android usando Capacitor com Unity Ads integrado.

## 📋 Pré-requisitos

### Para Android:
- **Android Studio** instalado
- **JDK 17** ou superior
- **SDK do Android** (API 33 ou superior)

### Para iOS:
- **macOS** com Xcode instalado
- **CocoaPods** instalado (`sudo gem install cocoapods`)
- **Conta de desenvolvedor Apple** (para publicar na App Store)

## 🚀 Passo a Passo de Configuração

### 1. Instalar as Dependências do Capacitor

```bash
npm install @capacitor/cli @capacitor/core @capacitor/ios @capacitor/android
```

### 2. Inicializar o Capacitor

```bash
npx cap init
```

Configure com os seguintes valores:
- **App ID**: `app.lovable.8eedd528faf5473ba997f111735cf9e1`
- **App Name**: `EduKI`

### 3. Configurar o capacitor.config.ts

Edite o arquivo `capacitor.config.ts` na raiz do projeto:

```typescript
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.8eedd528faf5473ba997f111735cf9e1',
  appName: 'EduKI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#6366f1",
      showSpinner: false
    }
  }
};

export default config;
```

### 4. Build do Projeto

```bash
npm run build
```

### 5. Adicionar Plataformas Nativas

#### Para Android:
```bash
npx cap add android
```

#### Para iOS:
```bash
npx cap add ios
```

### 6. Sincronizar Código com Plataformas Nativas

Sempre que fizer mudanças no código, execute:

```bash
npx cap sync
```

## 📱 Unity Ads - Configuração Nativa

### Android

1. Abra o projeto no Android Studio:
```bash
npx cap open android
```

2. O plugin `capacitor-unity-ads` já está configurado automaticamente

3. Verifique se o `build.gradle` do módulo app contém:
```gradle
dependencies {
    implementation 'com.unity3d.ads:unity-ads:4.9.2'
}
```

4. No `AndroidManifest.xml`, adicione as permissões necessárias:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### iOS

1. Abra o projeto no Xcode:
```bash
npx cap open ios
```

2. O plugin já configurará o Unity Ads via CocoaPods automaticamente

3. Execute o CocoaPods (se necessário):
```bash
cd ios/App
pod install
```

4. No arquivo `Info.plist`, adicione as seguintes configurações:

```xml
<!-- App Tracking Transparency -->
<key>NSUserTrackingUsageDescription</key>
<string>Este identificador será usado para fornecer anúncios personalizados.</string>

<!-- SKAdNetwork Identifiers para Unity Ads (iOS 14+) -->
<key>SKAdNetworkItems</key>
<array>
    <dict><key>SKAdNetworkIdentifier</key><string>4dzt52r2t5.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>bvpn9ufa9b.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>hs6bdukanm.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>n9x2a789qt.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>2fnua5tdw4.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>9t245vhmpl.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>t38b2kh725.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>32z4fx6l9h.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>578prtvx9j.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>zmvfpc5aq8.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>feyaarzu9v.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>tl55sbb4fm.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>294l99pt4k.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>8s468mfl3y.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>2u9pt9hc89.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>zq492l623r.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>k6y4y55b64.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>w9q455wk68.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>xga6mpmplv.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>9rd848q2bz.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>cstr6suwn9.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>9nlqeag3gk.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>pwa73g5rt2.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>ydx93a7ass.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>a2p9lx4jpn.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>5lm9lj6jb7.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>22mmun2rn5.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>5f5u5tfb26.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>v9wttpbfk9.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>klf5c3l5u5.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>3rd42ekr43.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>kbd757ywx3.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>mj797d8u6f.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>3sh42y64q3.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>x44k69ngh6.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>3qy4746246.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>4fzdc2evr5.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>vhf287vqwu.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>prcb7njmu6.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>e5fvkxwrpn.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>uw77j35x4d.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>424m5254lk.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>238da6jt44.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>7ug5zh24hu.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>f7s53z58qe.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>44jx6755aq.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>c6k4g5qg8m.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>4468km3ulz.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>mlmmfzh3r3.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>wzmmz9fp6w.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>mp6xlyr22a.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>v72qych5uu.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>5tjdwbrq8w.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>mqn7fxpca7.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>5a6flpkh64.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>4pfyvq9l8r.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>g6gcrrvk4p.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>97r2b46745.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>6yxyv74ff7.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>a8cz6cu7e5.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>f38h382jlk.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>m8dbw4sv7c.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>yclnxrl5pm.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>5l3tpt7t6e.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>k674qkevps.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>v79kvwwj4g.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>glqzh8vgby.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>av6w8kgt66.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>488r3q3dtq.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>wg4vff78zm.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>f73kdq92p3.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>ppxm28t8ap.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>lr83yxwka7.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>s39g8k73mm.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>p78axxw29g.skadnetwork</string></dict>
    <dict><key>SKAdNetworkIdentifier</key><string>4w7y6s5ca2.skadnetwork</string></dict>
</array>
```

> **Nota:** Estes SKAdNetwork IDs são necessários para atribuição de anúncios no iOS 14+ e maximizam a receita do Unity Ads.

## 🔑 Configuração do Unity Ads Dashboard

1. Acesse [Unity Dashboard](https://dashboard.unity3d.com/)
2. Crie ou acesse seu projeto
3. Ative Unity Ads
4. Obtenha o **Game ID**: `5993995` (já configurado)
5. Configure o **Placement ID**: `Rewarded_Android` (já configurado)
6. Configure plataformas:
   - Adicione o Bundle ID do iOS: `app.lovable.8eedd528faf5473ba997f111735cf9e1`
   - Adicione o Package Name do Android: `app.lovable.8eedd528faf5473ba997f111735cf9e1`

## ▶️ Executar o Aplicativo

### Android

#### Em Emulador:
```bash
npx cap run android
```

#### Em Dispositivo Físico:
1. Ative "Depuração USB" no dispositivo Android
2. Conecte via USB
3. Execute: `npx cap run android`

### iOS

#### Em Simulador:
```bash
npx cap run ios
```

#### Em Dispositivo Físico:
1. Abra o projeto no Xcode: `npx cap open ios`
2. Conecte o dispositivo iOS via USB
3. Selecione o dispositivo no Xcode
4. Configure o "Signing & Capabilities" com sua conta Apple Developer
5. Clique em "Run" (▶️)

## 🔧 Desenvolvimento e Debug

### Hot Reload Durante Desenvolvimento

Para desenvolvimento mais rápido, configure o servidor de desenvolvimento:

1. Edite `capacitor.config.ts`:
```typescript
server: {
  url: 'http://192.168.1.100:8080', // Seu IP local
  cleartext: true
}
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. Sincronize:
```bash
npx cap sync
```

Agora o app carregará o código do servidor local e atualizará automaticamente!

### Debug de Unity Ads

- **Test Mode está ATIVADO** por padrão (linha 97 no LivesTimer.tsx)
- Para produção, altere `testMode: false` no código
- Verifique logs no console:
  - Android: Android Studio → Logcat
  - iOS: Xcode → Console

## 📦 Build para Produção

### Android (APK/AAB)

1. Abra o Android Studio: `npx cap open android`
2. Menu: Build → Generate Signed Bundle / APK
3. Siga o assistente para criar keystore e assinar o app
4. O arquivo AAB/APK estará em `android/app/build/outputs/`

### iOS (IPA)

1. Abra o Xcode: `npx cap open ios`
2. Selecione "Any iOS Device" como destino
3. Menu: Product → Archive
4. No Organizer, clique em "Distribute App"
5. Siga o assistente para upload na App Store

## 🎯 Testando Unity Ads

### Verificações Importantes:

1. **O anúncio está carregando?**
   - Verifique o console: "Unity Ads inicializado (nativo)"
   - Verifique: "Anúncio carregado (nativo)"

2. **O botão de vídeo está habilitado?**
   - O botão só fica ativo quando `adReady = true`

3. **O vídeo está sendo exibido?**
   - Em test mode, você verá anúncios de teste
   - Em produção, verá anúncios reais

## 🐛 Troubleshooting

### Problema: "Anúncios não disponíveis"
**Solução**: 
- Verifique conexão com internet
- Aguarde alguns segundos após inicializar o app
- Verifique se o Game ID está correto no Unity Dashboard

### Problema: Unity Ads não carrega em iOS
**Solução**:
- Execute `pod install` no diretório `ios/App`
- Limpe o build: Xcode → Product → Clean Build Folder
- Verifique se o Info.plist tem as permissões corretas

### Problema: App não compila no Android
**Solução**:
- Verifique se o JDK 17 está instalado
- Atualize Android Gradle Plugin
- Execute `npx cap sync android`

## 📚 Recursos Adicionais

- [Documentação Capacitor](https://capacitorjs.com/docs)
- [Unity Ads Documentation](https://docs.unity.com/ads/)
- [Capacitor Unity Ads Plugin](https://github.com/eliazv/capacitor-unity-ads)

## ✅ Checklist de Deploy

- [ ] Build de produção testado (`npm run build`)
- [ ] Test mode desativado no Unity Ads (`testMode: false`)
- [ ] Ícones do app atualizados (192x192 e 512x512)
- [ ] Bundle ID/Package Name configurado no Unity Dashboard
- [ ] Permissões configuradas (Android: AndroidManifest, iOS: Info.plist)
- [ ] App assinado com certificado válido
- [ ] Testado em dispositivos reais (iOS e Android)
- [ ] Unity Ads funcionando em ambiente de produção
- [ ] Políticas de privacidade atualizadas (mencionar anúncios)

---

**Pronto!** 🎉 Seu app EduKI agora funciona como aplicativo nativo com Unity Ads totalmente integrado!
