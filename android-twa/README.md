# Lumen para Android — TWA (DRAFT)

Projeto local baseado na estrutura Bubblewrap do Findly, lida como referência. O wrapper Gradle foi copiado sem alterações; não é necessário instalar Node/Bubblewrap para compilar. **Este projeto ainda não foi compilado nem testado em Android. Nenhum APK/AAB foi gerado nesta etapa.**

- Lançamento: **STM32/TercoBLE somente**, com `dist/config.js` usando `legacyControllers: false`.
- TWA: a interface, a voz e o Web Bluetooth são executados pelo Chrome Android. Não há WebView nem implementação da ponte `NativeTerco` neste wrapper. O fallback é Custom Tabs; outros navegadores precisam ser validados antes de prometer suporte a BLE.
- Gradle **8.11.1**, Android Gradle Plugin **8.9.1**, Android Browser Helper **2.7.4**; compile/target SDK **36**; minSdk **29 (Android 10)**, como na referência Findly. O mínimo não comprova compatibilidade de um navegador/aparelho específico.
- Versão inicial **0.4.4**, `versionCode: 1`. Nome e launcher: **Lumen**. Cores `#f6f3eb` do manifesto web.
- Sem permissões Bluetooth no manifesto do wrapper. O Chrome pede ao usuário acesso ao dispositivo Bluetooth e pode depender das permissões Android do próprio navegador. Sem delegação de notificações ou localização e sem `DelegationService`.

## Configuração pendente

`twa-manifest.json` é a fonte lida por `app/build.gradle` para identidade, URLs, cores e versão. Ele mantém o formato de configuração do Bubblewrap com `_todo` para registrar pendências; não foi regenerado pela CLI.

1. **TODO-confirm — applicationId:** `packageId: "com.hiagomrossi.lumen"` é provisório. Confirmar antes do primeiro envio à Play e manter `assetlinks.template.json` alinhado. O namespace Java interno pode continuar `com.hiagomrossi.lumen`, mesmo que o applicationId seja alterado.
2. **TODO — hostName:** substituir `hiagomrossi.github.io` em `host`, `iconUrl`, `maskableIconUrl` e `webManifestUrl`. `startUrl: "/"` fornece o `launchUrl` relativo. A origem e os recursos de associação Android são derivados do host no build.
3. **PLACEHOLDER — arte:** os cinco mipmaps PNG (48, 72, 96, 144 e 192 px) e o splash de 512 px vêm de `dist/icons/`. Substituir pela arte final antes da publicação. Para regenerar os placeholders, a partir da raiz do repositório: `node scripts/generate-twa-placeholder-icons.cjs`. Esse script é offline e não altera os ícones web.
4. **TODO — certificado, contato e política:** definir a assinatura e finalizar os rascunhos em `../docs/` antes da submissão.

## Hospedagem e Digital Asset Links

A TWA precisa de **HTTPS público, sem login**, com a página, scripts, manifesto, ícones e `/.well-known/assetlinks.json` acessíveis. O host atual `lumen-terco-hiago.hiagomrossi.chatgpt.site` exige autenticação e não foi usado neste projeto. O domínio `.example` é apenas um placeholder; compilar com ele não produz um app funcional.

Após confirmar o pacote e a hospedagem, preparar a associação a partir de `assetlinks.template.json`: substituir o pacote provisório e `TODO_PLAY_APP_SIGNING_SHA256` pelo SHA-256 do **certificado de assinatura do app (Play App Signing)**. A Play assina os APKs distribuídos com essa chave. A **chave de upload** assina o AAB enviado e pode ter outra impressão digital; seu fingerprint sozinho não associa a instalação feita pela Play.

O arquivo final deverá ser servido como JSON em `https://SEU-HOST/.well-known/assetlinks.json`, com resposta 200, sem login nem redirecionamento. **Não existe `assetlinks.json` em `dist/`; somente este template foi preparado, sem publicação.** Os recursos `assetStatements` do Android declaram o caminho inverso (app → site).

Para validar uma instalação local de debug como TWA, é necessário autorizar também o certificado que realmente assinou esse APK em uma origem de teste. Sem uma associação válida, o Chrome pode exibir uma Custom Tab com barra de endereço. Testar uma instalação da faixa interna da Play com o certificado Play App Signing faz parte da validação posterior.

## SDK e build (para execução posterior pelo Hiago)

Use JDK 17 ou superior compatível com o Gradle/AGP; a referência Findly foi compilada com JDK 21. O SDK de referência desta máquina fica em `C:/Users/Microsoft/Desktop/App Findly/Findly Code/findly-web/.codex/android-sdk`, fora do PATH. Ele foi apenas localizado, sem alterações. Para manter Findly somente leitura, use um SDK próprio fora desse projeto para compilar, pois o AGP pode instalar componentes faltantes.

Crie **localmente** `android-twa/local.properties`, ignorado pelo Git, apontando para seu SDK com Platform 36 e os Build Tools necessários. Exemplo de caminho, a ajustar ao SDK realmente instalado:

```properties
sdk.dir=C:/Users/Microsoft/AppData/Local/Android/Sdk
```

O Gradle wrapper/dependências podem precisar de download no primeiro build. Nenhum build, download de dependências ou instalação foi executado nesta preparação. Para resolver dependências somente do cache, acrescente `--offline`; a distribuição do Gradle e todos os componentes do SDK também precisam estar instalados previamente. Componentes ausentes impedem um build inteiramente offline. AGP 8.9.1 pode emitir aviso de compileSdk 36; a combinação foi mantida conforme solicitado, sem esconder avisos. [Compatibilidade do AGP 8.9](https://developer.android.com/build/releases/agp-8-9-0-release-notes).

No PowerShell, dentro de `android-twa/`:

```powershell
.\gradlew.bat assembleDebug
.\gradlew.bat bundleRelease
```

No Linux/macOS, use `./gradlew assembleDebug` e `./gradlew bundleRelease` (talvez seja necessário `chmod +x gradlew` após copiar os arquivos do Windows).

- Debug: `app/build/outputs/apk/debug/app-debug.apk`, assinado com a chave de debug do ambiente Android.
- Release: `app/build/outputs/bundle/release/app-release.aab`. **Sem configuração de assinatura, esse AAB fica sem assinatura.** Não o enviar à Play nesse estado.

### Assinar o release

Há duas opções, sem chaves reais no repositório:

1. Gerar com `bundleRelease` sem configuração de assinatura e depois assinar com a chave de upload usando `jarsigner` (AAB usa assinatura JAR, não `apksigner`). Exemplo no PowerShell, com variáveis apontando para sua chave privada/alias; as senhas são solicitadas pela ferramenta:

   ```powershell
   jarsigner -keystore $env:LUMEN_KEYSTORE_FILE -signedjar app/build/outputs/bundle/release/app-release-signed.aab app/build/outputs/bundle/release/app-release.aab $env:LUMEN_KEY_ALIAS
   jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release-signed.aab
   ```

2. Configurar os quatro campos de assinatura e então executar `bundleRelease`: copiar `keystore.properties.example` para `keystore.properties`, preencher localmente; ou fornecer `LUMEN_KEYSTORE_FILE`, `LUMEN_KEYSTORE_PASSWORD`, `LUMEN_KEY_ALIAS` e `LUMEN_KEY_PASSWORD` no ambiente. Variáveis de ambiente têm prioridade. Sem qualquer campo, release permanece sem assinatura; configuração parcial causa erro, sem imprimir valores. O template não é carregado automaticamente.

Nunca versionar `local.properties`, `keystore.properties`, `.jks`, `.keystore`, APKs/AABs ou senhas. O `.gitignore` cobre esses arquivos, `build/` e `.gradle/`. Não há chave real nem `signingKey` configurada no JSON.

## Validação antes de publicar

- Conferir build/lint e o manifesto mesclado, inclusive bibliotecas, permissões e identidade do APK/AAB.
- Validar HTTPS público e Digital Asset Links para o certificado da instalação.
- Testar no app empacotado: seleção/recusa de TercoBLE, desconexão/reconexão, **Acender conta/Apagar**, numeração 1–59 e cordão completo de 34 LEDs.
- Verificar voz, pausa/retomada, mudança de app, bloqueio de tela e Wake Lock; cache após o primeiro acesso online e voz offline separadamente.
- Manter os perfis legados desativados no site público; substituir ícones e concluir os rascunhos de privacidade/loja.

Referências: [TWA](https://developer.chrome.com/docs/android/trusted-web-activity), [Digital Asset Links e certificados](https://developer.android.com/training/app-links/configure-assetlinks), [build e assinatura pela linha de comando](https://developer.android.com/build/building-cmdline#sign_manually).
