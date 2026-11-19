# Lumen — Política de privacidade / Privacy policy

**RASCUNHO / DRAFT — não publicar / not for publication.**

Revisão do código web 0.4.3 e do projeto Android TWA local: 19/11/2026. O lançamento está definido como **STM32/TercoBLE somente, com TWA pelo Chrome Android**. Este documento descreve os arquivos deste repositório, não certifica uma hospedagem nem um APK/AAB: o projeto Android ainda não foi compilado ou testado em telefone. Os itens em aberto precisam ser resolvidos antes da publicação.

Web 0.4.3 and local Android TWA source review: 2026-11-19. Launch is defined as **STM32/TercoBLE only, with a TWA hosted by Chrome Android**. This document describes repository files; it does not certify hosting or an APK/AAB: the Android project has not yet been built or tested on a phone. Resolve open items before publication.

## Português (pt-BR) — RASCUNHO

Responsável: **[NOME DO RESPONSÁVEL]**  
Contato: **[E-MAIL DE CONTATO]**  
Data de vigência: **[DATA]**

### Finalidade e informações usadas

O Lumen acompanha a oração do terço com texto, contas na tela, narração em português e, opcionalmente, luzes na STM32 NUCLEO-WB05KZ com firmware TercoBLE. Esse é o único controlador oferecido no lançamento. O código web não implementa cadastro, conta, pagamentos, publicidade, analytics ou envio de relatórios de falha. Não solicita nome, e-mail, contatos, fotos, microfone ou posição geográfica. A sugestão de mistérios usa o dia da semana do relógio do aparelho.

### Progresso e armazenamento no aparelho

O app lê e grava somente a chave `lumen-progress-v1` do `localStorage`, com um objeto `{ group, index }`: o grupo de mistérios selecionado e o índice da oração atual. Isso permite retomar a etapa ao abrir o app. A frase em andamento, a velocidade da voz, o brilho e o dispositivo Bluetooth não são salvos nessa chave. Não existe histórico de sessões nem sincronização entre aparelhos. Ao concluir o terço, o índice salvo volta a zero e o grupo permanece.

Esse progresso se refere a uma prática religiosa. No código auditado ele permanece no armazenamento local da origem do site, sem ser enviado a um servidor. A persistência é opcional: falhas no armazenamento não impedem o app de continuar.

O service worker guarda cópias de arquivos estáticos do app na Cache Storage do navegador, no cache `lumen-v0.4.3`. Isso inclui a página, CSS, JavaScript, manifesto e ícones; não inclui um banco de dados de usuários ou uma cópia do progresso. Na ativação, remove caches antigos cujo nome começa com `lumen-`. O app não usa `sessionStorage`, IndexedDB ou cookies diretamente; a hospedagem ainda precisa ser auditada.

### Rede e recursos externos

O HTML usa apenas scripts e CSS locais, fontes do sistema, desenhos SVG locais e um favicon embutido. O endereço `http://www.w3.org/2000/svg` identifica o formato SVG e não é uma chamada de rede. Não há scripts, fontes ou recursos de CDN, XHR, WebSocket, EventSource, beacon ou endpoints de analytics no código auditado.

Quando acessado pela web, o navegador solicita os arquivos à hospedagem. O registro/atualização do service worker também pode solicitar `sw.js`. A instalação do cache busca os arquivos do app na mesma origem; depois, o worker serve primeiro o cache e usa `fetch` se um arquivo listado estiver ausente. Não intercepta requisições de outras origens, métodos diferentes de GET ou URLs fora da lista. Essas requisições de arquivos não incluem o progresso salvo. Não há função web que envie esse progresso a um backend do Lumen.

A configuração e os registros da hospedagem não estão neste repositório. É necessário verificar se o servidor ou seus fornecedores registram endereço IP, metadados HTTP, cookies ou outros dados, e preencher finalidade, retenção e responsáveis antes de publicar esta política.

### Narração e tela acesa

Na web e na TWA escolhida, o Lumen envia frases predefinidas das orações para `speechSynthesis`/`SpeechSynthesisUtterance` do navegador. Seleciona preferencialmente uma voz `pt-BR`, depois uma voz em português; se nenhuma for encontrada, deixa a escolha ao navegador. O app não grava áudio, não ouve o usuário e não usa reconhecimento de voz.

O código não restringe as vozes àquelas marcadas como locais (`localService`). Portanto, não garante que a síntese seja offline: o navegador/sistema e o provedor de voz podem usar serviços de rede. O comportamento, os destinatários e a retenção desse mecanismo precisam ser verificados na configuração distribuída.

Durante uma sessão ativa, o app solicita Screen Wake Lock quando disponível para manter a tela acesa. Libera ao pausar, concluir ou sair da sessão. O app continua pausando ao ficar oculto. Essa API não cria registros de uso no código do Lumen.

### Bluetooth e dados enviados ao controlador

A conexão é opcional e começa quando o usuário toca em Conectar STM32 e escolhe TercoBLE no seletor do Chrome. O app solicita acesso ao serviço TercoBLE e mantém em memória o objeto do dispositivo e sua conexão GATT. Não grava nem envia ao servidor uma lista de dispositivos, identificadores Bluetooth ou dados de localização. O wrapper TWA não declara permissões Bluetooth; o Chrome solicita acesso ao dispositivo e pode precisar das permissões Android do próprio navegador para dispositivos próximos ou busca BLE. Não há delegação de localização ou notificações ao wrapper.

SP105E e NUCLEO BLE_p2pServer continuam no código para testes locais, mas ficam ocultos/desabilitados com `legacyControllers: false` em `config.js`. A busca sem filtro é exclusiva do SP105E e não está disponível na interface de lançamento. Os perfis legados só são oferecidos quando essa flag é explicitamente alterada para `true` antes de carregar o app.

O código web escreve comandos de luz, sem ler medições do acessório nem assinar notificações. O protocolo pode indicar a conta atual da oração ou do teste; não envia textos de oração, nome, e-mail, gravações ou o grupo de mistérios. Os pacotes exatos estão na tabela técnica abaixo. A proteção do enlace BLE depende do sistema e do firmware; o código web não implementa criptografia própria nem comprova criptografia do enlace.

Erros de conexão podem aparecer no painel de diagnóstico com etapa da tentativa, tipo de busca e mensagem de erro do navegador. Esse painel fica na página, sem envio automático e sem persistência implementada. Um print enviado manualmente pelo usuário é uma ação externa ao app.

### Android TWA, retenção e remoção

O projeto `android-twa/` abre a origem pública do Lumen pelo navegador, com Android Browser Helper 2.7.4, mínimo Android 10/API 29 e alvo API 36. Não implementa `window.NativeTerco`, WebView ou BLE nativo. Os caminhos antigos de `NativeTerco` permanecem no código web, mas não são usados por este wrapper. O Chrome gerencia a página, a voz, o armazenamento do site, o acesso Bluetooth e o Screen Wake Lock. O manifesto mesclado e as bibliotecas ainda precisam de conferência após a compilação.

A hospedagem de lançamento deve ser HTTPS pública sem login, com `/.well-known/assetlinks.json` vinculando o pacote ao certificado Play App Signing. O domínio e o pacote locais ainda são placeholders; o host chatgpt.site atual exige login e não foi configurado na TWA. Nenhum arquivo de associação foi publicado.

O progresso permanece até ser sobrescrito ou até o usuário/navegador remover os dados do site. Não há prazo automático de expiração definido. “Recomeçar este terço” sobrescreve o índice com zero e mantém o grupo; não apaga todos os dados. Para remover progresso e cache, limpe os dados/armazenamento da origem do Lumen nas configurações do Chrome. A autorização Bluetooth pode ser revogada separadamente nas permissões do site/navegador. Remover apenas o atalho/PWA ou desinstalar a TWA não deve ser tratado como garantia de exclusão dos dados da origem no Chrome. O projeto inclui um atalho de gerenciamento de dados do site, cujo comportamento precisa ser validado no pacote Android.

Não há conta ou endpoint de exclusão de dados em servidor implementado neste código. As instruções de remoção precisam ser validadas no aplicativo TWA compilado; o procedimento para solicitar exclusão de eventuais registros da hospedagem ainda precisa ser definido. Dúvidas: **[E-MAIL DE CONTATO]**.

## English — DRAFT

Responsible person/entity: **[NOME DO RESPONSÁVEL]**  
Contact: **[E-MAIL DE CONTATO]**  
Effective date: **[DATA]**

### Purpose and information used

Lumen supports praying the Rosary with text, on-screen beads, Portuguese narration and optional lights on an STM32 NUCLEO-WB05KZ running TercoBLE firmware. This is the only controller offered at launch. The web code implements no registration, accounts, payments, advertising, analytics or crash-report uploads. It does not request a name, email address, contacts, photos, microphone access or geographic location. The suggested mysteries use the weekday from the device's clock.

### Progress and storage on the device

The app reads and writes only the `lumen-progress-v1` localStorage key, containing `{ group, index }`: the selected group of mysteries and the current prayer's index. This restores the prayer step when the app opens. It does not save the current phrase, speech rate, brightness or Bluetooth device in that key. There is no session history or synchronization across devices. On completion, the saved index returns to zero while the group remains.

This progress relates to a religious practice. In the audited code it stays in the site's local origin storage and is not sent to a server. Persistence is optional: storage failures do not prevent the app from continuing.

The service worker stores static app files in the browser's Cache Storage under `lumen-v0.4.3`. These include the page, CSS, JavaScript, manifest and icons, not a user database or a copy of prayer progress. On activation it removes older caches whose names begin with `lumen-`. The app does not directly use sessionStorage, IndexedDB or cookies; the hosting service still requires an audit.

### Network and external resources

The HTML uses local scripts and CSS, system fonts, local SVG drawings and an embedded favicon. `http://www.w3.org/2000/svg` identifies the SVG format and is not a network request. The audited code includes no CDN scripts, fonts or assets, XHR, WebSocket, EventSource, beacons or analytics endpoints.

When accessed on the web, the browser requests files from the hosting service. Service worker registration/updates may also request `sw.js`. Cache installation fetches app files from the same origin; the worker then serves cached files first and uses `fetch` if a listed file is missing. It does not intercept other origins, non-GET methods or URLs outside its list. These asset requests do not include saved progress. There is no web function uploading that progress to a Lumen backend.

Hosting configuration and logs are not in this repository. Before publishing this policy, verify whether the server or its providers record IP addresses, HTTP metadata, cookies or other data, and specify purposes, retention and responsible parties.

### Narration and keeping the screen awake

On the web and in the chosen TWA, Lumen passes predefined prayer phrases to the browser's `speechSynthesis`/`SpeechSynthesisUtterance`. It prefers a `pt-BR` voice, then a Portuguese voice, otherwise leaving the voice choice to the browser. It does not record audio, listen to the user or use speech recognition.

The code does not restrict voices to those marked as local (`localService`). Offline speech is therefore not guaranteed: the browser/operating system and voice provider may use network services. The distributed configuration's behavior, recipients and retention need verification.

During an active session, the app requests Screen Wake Lock where available. It releases the lock on pause, completion or session exit. The app still pauses when hidden. This API does not create usage records in Lumen's code.

### Bluetooth and data sent to the controller

Connection is optional and starts when the user taps Connect STM32 and selects TercoBLE in Chrome's picker. The app requests access to the TercoBLE service and holds the device object and GATT connection in memory. It neither stores nor uploads a device list, Bluetooth identifiers or location data. The TWA wrapper declares no Bluetooth permissions; Chrome requests device access and may need its own Android nearby-device or BLE-discovery permissions. Location and notifications are not delegated to the wrapper.

SP105E and NUCLEO BLE_p2pServer code remains for local tests, but these profiles are hidden/disabled with `legacyControllers: false` in `config.js`. Unfiltered discovery is exclusive to SP105E and unavailable in the launch UI. Legacy profiles are offered only when this flag is explicitly changed to `true` before loading the app.

The web code writes light commands without reading accessory measurements or subscribing to notifications. The protocol can indicate the current prayer/test bead; it sends no prayer text, name, email address, recordings or mystery group. Exact packets appear in the technical table below. BLE link protection depends on the operating system and firmware; the web code neither implements its own encryption nor proves link encryption.

Connection errors may appear in an on-page diagnostic panel with the attempt stage, search mode and browser error message. There is no automatic upload or implemented persistence for this panel. A screenshot manually sent by the user is an action outside the app.

### Android TWA, retention and removal

The `android-twa/` project opens Lumen's public origin in the browser, using Android Browser Helper 2.7.4, minimum Android 10/API 29 and target API 36. It implements no `window.NativeTerco`, WebView or native BLE. Old NativeTerco paths remain in the web code but are not used by this wrapper. Chrome manages the page, speech, site storage, Bluetooth access and Screen Wake Lock. The merged manifest and libraries still need inspection after building.

Launch hosting must be public HTTPS without login, with `/.well-known/assetlinks.json` linking the package to its Play App Signing certificate. The local domain and package are still placeholders; the current chatgpt.site host requires login and is not configured in the TWA. No association file has been published.

Progress remains until overwritten or until the user/browser removes the site's data. No automatic expiry is defined. Restarting the Rosary overwrites the index with zero and retains the group; it does not erase all data. To remove progress and cache, clear the Lumen origin's site data/storage in Chrome settings. Revoke Bluetooth authorization separately in site/browser permissions. Removing just the shortcut/PWA or uninstalling the TWA must not be treated as guaranteed removal of Chrome origin data. The project includes a site-data management shortcut whose behavior needs validation in the Android package.

This code implements no account or server-side data deletion endpoint. Removal instructions need validation in the built TWA; the procedure for requesting deletion of any hosting logs remains to be defined. Questions: **[E-MAIL DE CONTATO]**.

## Evidência técnica / Technical evidence

| Arquivo / File | Comportamento auditado / Audited behavior |
| --- | --- |
| [config.js](../dist/config.js), [app.js](../dist/app.js) | STM32-only launch (`legacyControllers: false`); `lumen-progress-v1` (`group`, `index`), speech synthesis, transient UI diagnostics, retained `NativeTerco` calls unused by this TWA; no progress upload. |
| [core.js](../dist/core.js) | Bundled prayer texts and mystery names, weekday suggestion, in-memory prayer sequence and state. |
| [bluetooth.js](../dist/bluetooth.js) | User-triggered `requestDevice`, GATT service/characteristic discovery and light writes; no sensor reads, notification subscriptions or server upload. |
| [guided-lights.js](../dist/guided-lights.js) | Retained in-memory SP105E effects and cancellation, inactive in the STM32-only launch. |
| [index.html](../dist/index.html), [style.css](../dist/style.css) | Local resources, inline SVG/favicon, system fonts; no external scripts/fonts. |
| [wake-lock.js](../dist/wake-lock.js) | Optional screen lock, in-memory state and visibility listener. |
| [pwa.js](../dist/pwa.js), [sw.js](../dist/sw.js), [manifest.webmanifest](../dist/manifest.webmanifest) | Optional secure-context registration, same-origin static asset requests/cache, app metadata and local icons. |
| [AndroidManifest.xml](../android-twa/app/src/main/AndroidManifest.xml), [app/build.gradle](../android-twa/app/build.gradle) | TWA source with no declared BLE/location/notification permissions or delegation service. No native bridge; package build and merged-manifest audit pending. |

| Perfil / Profile | Serviço → característica / Service → characteristic | Bytes enviados / Written bytes |
| --- | --- | --- |
| STM32 / TercoBLE | `8ec90001-f315-4f60-9fb8-838830daea50` → `8ec90002-f315-4f60-9fb8-838830daea50` | `[1, opcode, beadOr255, brightness, 255, 180, 82, 0]`; opcode `0` off, `1` bead, `2` effect; bead `0..58` for opcode 1, otherwise `255`; brightness `1..64`; write with response. |
| SP105E — legado, fora do lançamento / legacy, outside launch | `0000ffe0-0000-1000-8000-00805f9b34fb` → `0000ffe1-0000-1000-8000-00805f9b34fb` | `[0x38, R, G, B, 0x1e]`, RGB `0..32`; explicit power toggle `[0x38, 0, 0, 0, 0xaa]`; write without response. |
| NUCLEO / BLE_p2pServer — legado, fora do lançamento / legacy, outside launch | `0000fe40-cc7a-482a-984a-7f2ed5b3e58f` → `0000fe41-8e22-4541-9d4c-21edae82ed19` | `[1, 1]` on / `[1, 0]` off for the board LED; write without response. |

No TercoBLE, a interface mostra contas 1–59; os pacotes usam 0–58. O mapeamento físico é responsabilidade do firmware e não foi alterado nesta versão. / TercoBLE displays beads 1–59 and sends indices 0–58. Physical mapping is handled by firmware and was not changed in this version.

## Open items / Itens em aberto

- Preencher responsável, contato e vigência / Fill in responsible entity, contact and effective date.
- Auditar hospedagem, logs, cookies, fornecedores, retenção e exclusão / Audit hosting, logs, cookies, providers, retention and deletion.
- Concluir a TWA escolhida: confirmar pacote, hospedagem pública e associação; compilar e auditar bibliotecas/manifesto mesclado/permissões reais / Complete the selected TWA: confirm package, public hosting and association; build and audit libraries/merged manifest/actual permissions.
- Verificar voz local/remota, processamento e disponibilidade offline / Verify local/remote speech processing and offline availability.
- Validar o conjunto STM32/TercoBLE e cordão completo, tratamento de dados do acessório e proteção do enlace / Validate STM32/TercoBLE with the full strand, accessory data handling and link protection.
- Validar instruções de remoção no Android escolhido e definir eventual canal para exclusão de logs / Validate removal instructions for the selected Android package and any hosting-log deletion channel.
- Revisar a política final e disponibilizar uma URL pública estável antes da submissão / Review the final policy and provide a stable public URL before submission.
