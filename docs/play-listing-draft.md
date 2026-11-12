# Lumen — Google Play listing

**RASCUNHO / DRAFT — não publicar nem enviar estes formulários / do not publish or submit these forms.**

Base: código web 0.4.2 auditado em 12/11/2026; [política e evidências da auditoria](privacy-policy.md). Não há pacote Android auditado neste repositório. Os textos descrevem as funções atuais; a escolha dos controladores e do contêiner pode exigir ajustes antes da publicação. A versão em inglês é texto da loja: a interface e a narração atuais são em português.

Basis: web 0.4.2 source audit on 2026-11-12; see the [privacy draft and audit evidence](privacy-policy.md). This repository contains no audited Android package. Copy describes current functions; controller and wrapper decisions may require changes before publication. English is a store translation; the current app interface and narration are in Portuguese.

## pt-BR — RASCUNHO da ficha

### Nome do app

Lumen

### Descrição curta — 72 caracteres (limite: 80)

Terço guiado por voz em português, com contas na tela e luzes Bluetooth.

### Descrição completa (limite: 4.000 caracteres)

Lumen acompanha a oração do terço católico com textos, narração em português e uma representação das 59 contas na tela.

Escolha os mistérios gozosos, dolorosos, gloriosos ou luminosos. O app sugere um grupo conforme o dia da semana, e você pode mudar a escolha. Acompanhe a oração atual, consulte seu texto completo e ajuste a velocidade da voz disponível no aparelho.

Inicie, pause e retome no seu ritmo. Ao continuar, a frase interrompida começa de novo. Também é possível voltar ou avançar entre as orações. O grupo de mistérios e a etapa atual ficam salvos neste aparelho quando o armazenamento está disponível. Não é necessário criar conta.

As luzes são opcionais. Com uma STM32 e firmware TercoBLE compatível, os comandos acompanham as contas da oração e permitem testar uma conta por vez. O cordão de 34 LEDs reutiliza suas luzes ao longo das 59 contas. Nas opções avançadas, o perfil SP105E controla o cordão inteiro: os LEDs acompanham juntos, com pulsações durante a oração, sem seleção individual de LEDs. Há também um teste do LED da placa NUCLEO com a demonstração BLE_p2pServer.

O uso das luzes exige controlador compatível, alimentação adequada e autorização Bluetooth. Você também pode acompanhar as contas na tela sem conectar um controlador.

Durante a oração, o Lumen tenta manter a tela acesa quando o aparelho permite. Ao sair da página ou do aplicativo, a sessão pausa. Após o carregamento inicial e a instalação do cache, os arquivos da interface podem ficar disponíveis sem internet; a narração offline depende da voz do navegador ou sistema e precisa estar disponível no aparelho.

A interface e a narração desta versão são em português. Lumen é um auxílio para acompanhar a oração pessoal do terço.

## English — DRAFT listing

### App name

Lumen

### Short description — 80 characters (limit: 80)

Pray the Rosary with Portuguese narration, on-screen beads and Bluetooth lights.

### Full description (limit: 4,000 characters)

Lumen supports praying the Catholic Rosary with prayer texts, Portuguese narration and an on-screen display of its 59 beads.

Choose the Joyful, Sorrowful, Glorious or Luminous Mysteries. The app suggests a group based on the weekday, and you can change that choice. Follow the current prayer, open its full text and adjust the speed of the voice available on your device.

Start, pause and resume at your own pace. When you resume, the interrupted phrase starts again. You can also move backward or forward between prayers. The mystery group and current prayer step stay on this device when storage is available. No account is required.

Lights are optional. With a compatible STM32 board running TercoBLE firmware, commands follow the prayer beads and let you test one bead at a time. A 34-LED strand reuses its lights across the 59 beads. In advanced options, the SP105E profile controls the whole strand: its lights follow the prayer together with pulses, without individual LED selection. A NUCLEO board LED test is also available for the BLE_p2pServer demonstration firmware.

Using physical lights requires a compatible controller, suitable power and Bluetooth permission. You can also follow the on-screen beads without connecting a controller.

During prayer, Lumen attempts to keep the screen awake where supported. Leaving the page or app pauses the session. After the initial load and cache installation, interface files can be available without internet; offline narration depends on the browser or system voice being available on your device.

This version's interface and narration are in Portuguese. Lumen is an aid for following personal Rosary prayer.

## Segurança dos dados — RASCUNHO de respostas

Estas são propostas para o código web auditado, não respostas finais para o pacote Android. O Google distingue processamento apenas no aparelho de dados transmitidos para fora dele, e exige considerar bibliotecas e WebViews controladas pelo app. As respostas finais dependem da auditoria de hospedagem, voz, acessório e contêiner. [Orientação oficial de Segurança dos dados](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).

| Pergunta / campo | Resposta proposta e evidência |
| --- | --- |
| O app coleta dados do usuário? | **Proposta: Não, condicionada à auditoria final.** Não existe backend de progresso, analytics, conta ou upload no código web. `group` e `index` ficam somente em `localStorage`. Não tratar essa proposta como comprovação sobre logs HTTP, voz remota, BLE ou ponte nativa. |
| O app compartilha dados com terceiros? | **Proposta: Não para compartilhamento implementado com serviços de terceiros.** Não há SDK de anúncios/analytics ou endpoint externo no código web. Há texto predefinido entregue ao mecanismo de voz e comandos de luz enviados ao acessório escolhido; validar o tratamento por esses componentes antes da resposta final. |
| Tipos de dados coletados/compartilhados | **Nenhum tipo confirmado como coletado por um serviço do Lumen nesta auditoria.** Não há coleta implementada de identidade, contatos, localização, áudio gravado ou identificadores para analytics. Progresso de oração permanece local; o índice da conta sai por BLE. Se hospedagem, TTS, firmware ou SDKs coletarem dados, identificar os tipos, a finalidade, a retenção e se são opcionais antes de preencher. Não presumir uma isenção genérica para Bluetooth. |
| Os dados são criptografados em trânsito? | **Pendente; não marcar “Sim” apenas porque o site usa HTTPS.** O registro PWA/Web Bluetooth exigem contexto seguro. O protocolo de luz não inclui criptografia da aplicação; a segurança do enlace BLE não foi comprovada. Verificar todas as transmissões do produto final. Se a resposta final for ausência de coleta, seguir os campos aplicáveis exibidos pelo formulário. |
| Os usuários podem solicitar exclusão? | **Não há mecanismo de solicitação ao servidor implementado.** Não há conta nem dados de progresso em backend. Limpar dados do site remove progresso e cache; “Recomeçar” só zera o índice. Não anunciar um canal de exclusão enquanto `[E-MAIL DE CONTATO]` e o tratamento de logs não estiverem definidos. Se houver coleta no produto final, revisar a resposta e o mecanismo correspondente. |
| Criação/exclusão de conta | Não existe criação de conta no código web. Reavaliar se o pacote acrescentar contas. |

Não alegar aprovação eclesiástica, avaliação independente de segurança, conformidade certificada ou funcionamento integral offline. Essas garantias não resultam desta auditoria.

## Data safety — DRAFT answers

These proposals cover the audited web source, not the final Android package. Google distinguishes on-device processing from off-device transmission and requires consideration of libraries and app-controlled WebViews. Final answers depend on hosting, speech, accessory and wrapper audits. [Official Data safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).

| Question / field | Proposed answer and evidence |
| --- | --- |
| Does the app collect user data? | **Proposed: No, conditional on the final audit.** The web code has no progress backend, analytics, account or upload. `group` and `index` stay in localStorage. This does not establish the behavior of HTTP logs, remote speech, BLE or a native bridge. |
| Does the app share data with third parties? | **Proposed: No for implemented sharing with third-party services.** There are no advertising/analytics SDKs or external endpoints in the web code. Predefined text is passed to the speech engine and light commands to the selected accessory; verify those components' handling before answering definitively. |
| Collected/shared data types | **No type confirmed as collected by a Lumen service in this audit.** There is no implemented collection of identity, contacts, location, recorded audio or analytics identifiers. Prayer progress stays local; bead indices are transmitted over BLE. If hosting, TTS, firmware or SDKs collect data, identify types, purposes, retention and optionality before completing the form. Do not assume a blanket Bluetooth exemption. |
| Is data encrypted in transit? | **Pending; do not select “Yes” solely because the site uses HTTPS.** PWA registration/Web Bluetooth require a secure context. Light packets include no application encryption; BLE link security has not been established. Verify all transmissions in the final product. If no collection is confirmed, follow the applicable fields shown in the form. |
| Can users request deletion? | **No server-side request mechanism is implemented.** There is no account or backend prayer-progress store. Clearing site data removes progress and cache; restarting only resets the index. Do not advertise a deletion channel until `[E-MAIL DE CONTATO]` and hosting-log handling are defined. If the final product collects data, review the answer and corresponding mechanism. |
| Account creation/deletion | No account creation exists in the web code. Reassess if the package adds accounts. |

Do not claim Church approval, an independent security review, certified compliance or fully offline operation. This audit does not establish those guarantees.

## Permissões Android prováveis / Likely Android permissions

**Dependem de TWA versus WebView e da versão Android suportada. Não foi criado nem modificado um AndroidManifest.xml. / These depend on TWA versus WebView and supported Android versions. No AndroidManifest.xml was created or modified.**

Para Bluetooth nativo em Android 12/API 31 ou superior, as candidatas são `BLUETOOTH_SCAN` com `neverForLocation` (somente se o produto inteiro nunca derivar localização da busca) e `BLUETOOTH_CONNECT`. Ambas exigem o fluxo de autorização em tempo de execução. `neverForLocation` pode filtrar alguns anúncios BLE, portanto é preciso testar os controladores escolhidos. Para Android anterior, revisar `BLUETOOTH`/`BLUETOOTH_ADMIN` e possível `ACCESS_FINE_LOCATION`, limitadas a API 30 quando adequado. [Documentação oficial de permissões Bluetooth](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions).

For native Bluetooth on Android 12/API 31 or later, candidates are `BLUETOOTH_SCAN` with `neverForLocation` (only if the entire product never derives location from scanning) and `BLUETOOTH_CONNECT`. Both require runtime authorization. `neverForLocation` can filter some BLE advertisements, so test the selected controllers. For earlier Android releases, review legacy `BLUETOOTH`/`BLUETOOTH_ADMIN` and possible `ACCESS_FINE_LOCATION`, capped at API 30 where appropriate. [Official Bluetooth permission documentation](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions).

```xml
<!-- DRAFT: candidato para integração BLE nativa em API 31+; não é manifesto final. -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"
                 android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

| Decisão / Decision | Consequência para revisão / Review consequence |
| --- | --- |
| TWA | Validar Web Bluetooth, seletor e permissões do navegador que hospeda a página. Não copiar automaticamente as permissões BLE nativas para o wrapper. / Validate Web Bluetooth, its picker and permissions in the hosting browser; do not automatically copy native BLE permissions into the wrapper. |
| WebView | Validar a ponte nativa e o fluxo de permissões; não presumir que `navigator.bluetooth` estará disponível. O código já tem chamadas opcionais a `NativeTerco`, cuja implementação está fora desta auditoria. / Validate the native bridge and permission flow; do not assume `navigator.bluetooth` is available. Optional `NativeTerco` calls already exist, but the implementation is outside this audit. |
| Rede / Network | `INTERNET` é candidata se o contêiner fizer requisições web ou usar voz remota; verificar o manifesto final. / `INTERNET` is a candidate if the container makes web requests or uses remote speech; inspect the final manifest. |
| Tela acesa / Screen awake | A API web não determina sozinha uma permissão Android `WAKE_LOCK`. Auditar a implementação nativa, se escolhida. / The web API alone does not determine an Android `WAKE_LOCK` permission; audit the native implementation if selected. |
| Sem uso no código / No use in this code | Não há justificativa aqui para microfone, contatos, mídia/armazenamento amplo, localização em segundo plano ou `BLUETOOTH_ADVERTISE`. / This code supplies no reason for microphone, contacts, broad media/storage access, background location or `BLUETOOTH_ADVERTISE`. |

## Open items / Itens em aberto

- **STM32 somente ou também SP105E? / STM32 only or SP105E support too?** Manter a ficha alinhada aos perfis realmente distribuídos e testados; decidir se o teste NUCLEO continua visível. / Align copy with shipped and tested profiles; decide whether the NUCLEO test remains visible.
- **TWA ou WebView? / TWA or WebView?** Definir contêiner, Android mínimo/alvo e auditar permissões, ponte e bibliotecas. / Choose wrapper, minimum/target Android versions and audit permissions, bridge and libraries.
- **Titular da conta / Account holder:** `[NOME DO RESPONSÁVEL]`; contato / contact: `[E-MAIL DE CONTATO]`.
- **Países / Countries:** `[PAÍSES DE DISTRIBUIÇÃO]`.
- **Grátis ou pago / Free or paid:** `[MODELO DE DISTRIBUIÇÃO]`.
- **Privacidade / Privacy:** confirmar hospedagem, logs, voz, acessórios, exclusão e respostas finais de Segurança dos dados; publicar política final em `[URL DA POLÍTICA]`. / Confirm hosting, logs, speech, accessories, deletion and final Data safety answers; publish the final policy at `[URL DA POLÍTICA]`.
- **Conteúdo e público / Content and audience:** revisar os textos de oração já existentes, seus direitos de uso, público-alvo e classificação; não acrescentar citações ou atribuições sem verificação. / Review existing prayer text, usage rights, target audience and rating; do not add unverified quotations or attributions.
- **Arte e testes / Artwork and testing:** substituir ícones PLACEHOLDERS, preparar capturas reais e concluir testes físicos/Android; não usar testes Node como prova de funcionamento no telefone. / Replace PLACEHOLDER icons, prepare real screenshots and complete physical/Android testing; Node tests do not prove phone behavior.
