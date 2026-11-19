# Lumen — Google Play listing

**RASCUNHO / DRAFT — não publicar nem enviar estes formulários / do not publish or submit these forms.**

Base: código web 0.4.3 e projeto TWA local revisados em 19/11/2026; [política e evidências](privacy-policy.md). Decisões de lançamento: **somente STM32/TercoBLE e Android TWA pelo Chrome**. `android-twa/` contém o projeto, ainda sem compilação nem testes em telefone. Não há APK/AAB auditado. A versão em inglês é texto da loja: a interface e a narração atuais são em português.

Basis: web 0.4.3 and local TWA source review on 2026-11-19; see the [privacy draft and evidence](privacy-policy.md). Launch decisions: **STM32/TercoBLE only and an Android TWA hosted by Chrome**. `android-twa/` contains the project, not yet built or tested on a phone. No APK/AAB has been audited. English is a store translation; the current app interface and narration are in Portuguese.

## pt-BR — RASCUNHO da ficha

### Nome do app

Lumen

### Descrição curta — 72 caracteres (limite: 80)

Terço guiado por voz em português, com contas na tela e luzes Bluetooth.

### Descrição completa (limite: 4.000 caracteres)

Lumen acompanha a oração do terço católico com textos, narração em português e uma representação das 59 contas na tela.

Escolha os mistérios gozosos, dolorosos, gloriosos ou luminosos. O app sugere um grupo conforme o dia da semana, e você pode mudar a escolha. Acompanhe a oração atual, consulte seu texto completo e ajuste a velocidade da voz disponível no aparelho.

Inicie, pause e retome no seu ritmo. Ao continuar, a frase interrompida começa de novo. Também é possível voltar ou avançar entre as orações. O grupo de mistérios e a etapa atual ficam salvos neste aparelho quando o armazenamento está disponível. Não é necessário criar conta.

As luzes são opcionais. Esta versão usa somente a STM32 NUCLEO-WB05KZ com firmware TercoBLE compatível. Os comandos acompanham as contas da oração e permitem testar uma conta por vez com Acender conta e Apagar. O cordão de 34 LEDs reutiliza suas luzes ao longo das 59 contas, sem pular orações.

O uso das luzes exige a STM32 com TercoBLE, alimentação adequada e autorização de acesso ao dispositivo Bluetooth solicitada pelo Chrome. No Android, mantenha um Chrome compatível disponível. Você também pode acompanhar as contas na tela sem conectar a placa.

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

Lights are optional. This version supports only the STM32 NUCLEO-WB05KZ running compatible TercoBLE firmware. Commands follow the prayer beads and let you test one bead at a time with the light-on and light-off controls. A 34-LED strand reuses its lights across the 59 beads without skipping prayers.

Using physical lights requires STM32 with TercoBLE, suitable power and Bluetooth device access requested by Chrome. Keep a compatible Chrome browser available on Android. You can also follow the on-screen beads without connecting the board.

During prayer, Lumen attempts to keep the screen awake where supported. Leaving the page or app pauses the session. After the initial load and cache installation, interface files can be available without internet; offline narration depends on the browser or system voice being available on your device.

This version's interface and narration are in Portuguese. Lumen is an aid for following personal Rosary prayer.

## Segurança dos dados — RASCUNHO de respostas

Estas são propostas para o código web e o projeto TWA, não respostas finais para um pacote compilado. As respostas finais precisam considerar hospedagem, voz, acessório, navegador e bibliotecas do produto distribuído. [Orientação oficial de Segurança dos dados](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).

| Pergunta / campo | Resposta proposta e evidência |
| --- | --- |
| O app coleta dados do usuário? | **Proposta: Não, condicionada à auditoria final.** Não existe backend de progresso, analytics, conta ou upload no código web. `group` e `index` ficam somente em `localStorage`. Não tratar essa proposta como comprovação sobre logs HTTP, voz remota, BLE, navegador ou bibliotecas da TWA. |
| O app compartilha dados com terceiros? | **Proposta: Não para compartilhamento implementado com serviços de terceiros.** Não há SDK de anúncios/analytics ou endpoint externo no código web. Há texto predefinido entregue ao mecanismo de voz e comandos de luz enviados ao acessório escolhido; validar o tratamento por esses componentes antes da resposta final. |
| Tipos de dados coletados/compartilhados | **Nenhum tipo confirmado como coletado por um serviço do Lumen nesta auditoria.** Não há coleta implementada de identidade, contatos, localização, áudio gravado ou identificadores para analytics. Progresso de oração permanece local; o índice da conta sai por BLE. Se hospedagem, TTS, firmware ou SDKs coletarem dados, identificar os tipos, a finalidade, a retenção e se são opcionais antes de preencher. Não presumir uma isenção genérica para Bluetooth. |
| Os dados são criptografados em trânsito? | **Pendente; não marcar “Sim” apenas porque o site usa HTTPS.** O registro PWA/Web Bluetooth exigem contexto seguro. O protocolo de luz não inclui criptografia da aplicação; a segurança do enlace BLE não foi comprovada. Verificar todas as transmissões do produto final. Se a resposta final for ausência de coleta, seguir os campos aplicáveis exibidos pelo formulário. |
| Os usuários podem solicitar exclusão? | **Não há mecanismo de solicitação ao servidor implementado.** Não há conta nem dados de progresso em backend. Limpar dados do site remove progresso e cache; “Recomeçar” só zera o índice. Não anunciar um canal de exclusão enquanto `[E-MAIL DE CONTATO]` e o tratamento de logs não estiverem definidos. Se houver coleta no produto final, revisar a resposta e o mecanismo correspondente. |
| Criação/exclusão de conta | Não existe criação de conta no código web. Reavaliar se o pacote acrescentar contas. |

Não alegar aprovação eclesiástica, avaliação independente de segurança, conformidade certificada ou funcionamento integral offline. Essas garantias não resultam desta auditoria.

## Data safety — DRAFT answers

These proposals cover the web source and TWA project, not a final compiled Android package. Final answers must consider hosting, speech, accessories, the browser and libraries in the distributed product. [Official Data safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).

| Question / field | Proposed answer and evidence |
| --- | --- |
| Does the app collect user data? | **Proposed: No, conditional on the final audit.** The web code has no progress backend, analytics, account or upload. `group` and `index` stay in localStorage. This does not establish the behavior of HTTP logs, remote speech, BLE, the browser or TWA libraries. |
| Does the app share data with third parties? | **Proposed: No for implemented sharing with third-party services.** There are no advertising/analytics SDKs or external endpoints in the web code. Predefined text is passed to the speech engine and light commands to the selected accessory; verify those components' handling before answering definitively. |
| Collected/shared data types | **No type confirmed as collected by a Lumen service in this audit.** There is no implemented collection of identity, contacts, location, recorded audio or analytics identifiers. Prayer progress stays local; bead indices are transmitted over BLE. If hosting, TTS, firmware or SDKs collect data, identify types, purposes, retention and optionality before completing the form. Do not assume a blanket Bluetooth exemption. |
| Is data encrypted in transit? | **Pending; do not select “Yes” solely because the site uses HTTPS.** PWA registration/Web Bluetooth require a secure context. Light packets include no application encryption; BLE link security has not been established. Verify all transmissions in the final product. If no collection is confirmed, follow the applicable fields shown in the form. |
| Can users request deletion? | **No server-side request mechanism is implemented.** There is no account or backend prayer-progress store. Clearing site data removes progress and cache; restarting only resets the index. Do not advertise a deletion channel until `[E-MAIL DE CONTATO]` and hosting-log handling are defined. If the final product collects data, review the answer and corresponding mechanism. |
| Account creation/deletion | No account creation exists in the web code. Reassess if the package adds accounts. |

Do not claim Church approval, an independent security review, certified compliance or fully offline operation. This audit does not establish those guarantees.

## Permissões Android — TWA / Android permissions — TWA

**Decisão implementada no projeto local: TWA, compile/target SDK 36, mínimo 29. O manifesto mesclado do pacote ainda precisa ser validado após o build. / Implemented in the local project: TWA, compile/target SDK 36, minimum 29. The merged package manifest still needs validation after building.**

| Recurso / Feature | Implementação de lançamento / Launch implementation |
| --- | --- |
| Bluetooth | O wrapper não declara permissões BLE: não adiciona BLUETOOTH, BLUETOOTH_ADMIN, BLUETOOTH_SCAN, BLUETOOTH_CONNECT ou BLUETOOTH_ADVERTISE. O Chrome executa Web Bluetooth e pede ao usuário acesso ao dispositivo TercoBLE. As permissões Android do próprio Chrome podem ser necessárias. / The wrapper declares no BLE permissions. Chrome runs Web Bluetooth and asks the user for access to TercoBLE; Chrome's own Android permissions may also be required. |
| Localização e notificações / Location and notifications | Sem permissões nativas nem serviço de delegação para esses recursos. O Lumen não solicita posição geográfica. Requisitos do sistema/navegador para busca BLE precisam ser testados. / No native permissions or delegation service for these features. Lumen does not request geographic position; system/browser BLE-discovery requirements need testing. |
| Interface, voz e tela / UI, speech and screen | A página, speechSynthesis e Screen Wake Lock usam o navegador. O wrapper não implementa NativeTerco nem adiciona permissão WAKE_LOCK. / The page, speechSynthesis and Screen Wake Lock use the browser. The wrapper does not implement NativeTerco or add WAKE_LOCK permission. |
| Rede / Network | A TWA abre HTTPS público pelo navegador; não embute os arquivos web para garantir primeira abertura offline. Verificar permissões e bibliotecas no manifesto mesclado. / The TWA opens public HTTPS through the browser; it does not bundle web assets to guarantee a first offline launch. Inspect the merged manifest and libraries. |

O código de SP105E e NUCLEO BLE_p2pServer foi preservado somente para testes locais com a flag legacyControllers ativada. Esses perfis ficam ocultos/desabilitados no lançamento; a flag padrão é false. A ponte NativeTerco antiga também foi preservada no código web, mas não é fornecida pela TWA. / SP105E and NUCLEO BLE_p2pServer code remains for local testing with the legacyControllers flag enabled. These profiles are hidden/disabled at launch; the default flag is false. Old NativeTerco web calls are retained, but this TWA supplies no native bridge.

Referências / References: [Web Bluetooth no Chrome](https://developer.chrome.com/docs/capabilities/bluetooth), [arquitetura TWA](https://developer.chrome.com/docs/android/trusted-web-activity), [projeto local](../android-twa/README.md).

## Open items / Itens em aberto

- **Validar STM32/TercoBLE / Validate STM32/TercoBLE:** decisão fechada; testar o cordão completo de 34 LEDs e as 59 contas no telefone. SP105E e p2p ficam fora do lançamento. / Decision made; test the full 34-LED strand and all 59 beads on a phone. SP105E and p2p are outside launch scope.
- **Concluir TWA / Complete TWA:** confirmar applicationId, HTTPS público sem login, Digital Asset Links com certificado Play App Signing, build/assinatura e testes Android. O host chatgpt.site autenticado não pode ser usado. / Confirm applicationId, public HTTPS without login, Digital Asset Links using the Play App Signing certificate, build/signing and Android tests. The authenticated chatgpt.site host cannot be used.
- **Titular da conta / Account holder:** `[NOME DO RESPONSÁVEL]`; contato / contact: `[E-MAIL DE CONTATO]`.
- **Países / Countries:** `[PAÍSES DE DISTRIBUIÇÃO]`.
- **Grátis ou pago / Free or paid:** `[MODELO DE DISTRIBUIÇÃO]`.
- **Privacidade / Privacy:** confirmar hospedagem, logs, voz, acessórios, exclusão e respostas finais de Segurança dos dados; publicar política final em `[URL DA POLÍTICA]`. / Confirm hosting, logs, speech, accessories, deletion and final Data safety answers; publish the final policy at `[URL DA POLÍTICA]`.
- **Conteúdo e público / Content and audience:** revisar os textos de oração já existentes, seus direitos de uso, público-alvo e classificação; não acrescentar citações ou atribuições sem verificação. / Review existing prayer text, usage rights, target audience and rating; do not add unverified quotations or attributions.
- **Arte e testes / Artwork and testing:** substituir ícones PLACEHOLDERS, preparar capturas reais e concluir testes físicos/Android; não usar testes Node como prova de funcionamento no telefone. / Replace PLACEHOLDER icons, prepare real screenshots and complete physical/Android testing; Node tests do not prove phone behavior.
