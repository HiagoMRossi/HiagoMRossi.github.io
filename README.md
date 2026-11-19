# Lumen · Terço guiado

Aplicativo web estático. Os arquivos editáveis ficam em `dist/`; não requer compilação.

## Web 0.4.3 — STM32/TercoBLE + Android TWA

- O lançamento oferece somente **STM32 com firmware TercoBLE**. `dist/config.js` define `window.LumenConfig = { legacyControllers: false }`. O HTML já oculta os painéis antigos antes de o JavaScript carregar; o app também bloqueia seleções legadas restauradas pelo navegador. Configuração ausente mantém TercoBLE.
- SP105E e NUCLEO BLE_p2pServer continuam no código. Para testes locais, edite **somente** `legacyControllers: true` em `dist/config.js`, recarregue e abra **Conectar STM32 → Outros controladores · avançado**. A flag é lida ao iniciar; alterações no console depois disso não reconfiguram a sessão. Se houver service worker antigo, feche as páginas e atualize/remova seu registro/cache pelo DevTools; não é necessário apagar o progresso. Restaure `false` antes de distribuir. Não existe ativação por query string ou preferência salva.
- `index.html` e o cache `lumen-v0.4.3` usam URLs 0.4.3, incluindo `config.js`. `bluetooth.js`, pacotes, UUIDs, sequência/numeração das 59 contas, mapeamento e **Acender conta/Apagar** permanecem inalterados.
- Projeto Android em [android-twa/](android-twa/README.md), baseado na referência Bubblewrap do Findly: AGP 8.9.1, Gradle 8.11.1, Browser Helper 2.7.4, SDK alvo/compilação 36 e mínimo 29. Domínio e applicationId ainda são placeholders; release sem assinatura por padrão. Não foi executado Gradle nem gerado APK/AAB. Ícones são **PLACEHOLDERS**, derivados offline de `dist/icons/`.
- A TWA usa Web Bluetooth pelo Chrome, sem permissões BLE no wrapper, notificações ou delegação de localização. Exige hospedagem HTTPS pública sem login e Digital Asset Links; o host chatgpt.site atual não serve para esse lançamento. O template fica em `android-twa/assetlinks.template.json`, fora de `dist/`, sem publicação.
- [Ficha Play](docs/play-listing-draft.md) e [privacidade](docs/privacy-policy.md) continuam **DRAFT / RASCUNHO**, agora com STM32 e TWA definidos. Hospedagem, assinatura, arte final e validação física/Android seguem pendentes.

Validação web 0.4.3: **63 testes aprovados (60 anteriores + 3 novos)**. Nenhum teste foi removido ou enfraquecido: a fixture carrega a configuração e o teste SP105E habilita explicitamente a flag; as expectativas de versão do PWA passaram para 0.4.3. Os novos cenários cobrem ocultação, tentativa de selecionar legado com flag desativada, TercoBLE/contas individuais e NUCLEO p2p com flag ativada. Execute todos no Windows com caminhos explícitos:

```powershell
node --test tests/app-flow.test.cjs tests/bluetooth.test.cjs tests/core.test.cjs tests/guided-lights.test.cjs tests/wake-lock.test.cjs tests/pwa.test.cjs
```

As seções seguintes registram versões anteriores; o escopo atual é o da 0.4.3 acima.

Versão 0.3: inclui perfil Bluetooth SP105E com teste de cores globais, apagar por RGB zero e alternância explícita de energia. Não implementa o avanço de LEDs individuais no SP105E. A conexão exige Chrome Android com HTTPS e escolha do dispositivo pelo usuário.

Protocolo e testes foram verificados em software; o ensaio físico no controlador do usuário segue pendente.

## Web 0.3.1

Busca sem filtro para controladores com nome alterado ou sem UUID no anúncio, mantendo a validação FFE0/FFE1 antes de habilitar os comandos. Mensagens diferenciam seleção e descoberta de serviço; o erro original do Chrome fica disponível em Detalhes da tentativa. Testes: `node --test tests/*.test.cjs`. A versão Android em arquivo permanece 0.3.0.

## Web 0.3.2

Conectar SP105E é a entrada principal. Ao abrir o painel sem conexão, o app seleciona SP105E mesmo que o navegador tenha restaurado uma escolha anterior. As opções da NUCLEO continuam disponíveis em Outros controladores · avançado e mostram explicitamente a necessidade de firmware específico. O protocolo e o teste de cores não mudaram; contas físicas individuais no SP105E continuam pendentes.

## Web 0.4.0

Acompanhamento do terço com os 34 LEDs físicos juntos pelo SP105E. O usuário conecta, testa uma pulsação e toca em Rezar com os 34 LEDs. A luz fica dourada em intensidade baixa durante a narração; a conclusão real de cada Ave-Maria dispara uma pulsação global. O encerramento dispara três pulsações e envia preto. O terço completo e suas 59 contas continuam representados na tela; não há correspondência individual entre essas contas e os 34 LEDs.

Pausa, troca de oração, reinício, saída da página e perda de conexão cancelam efeitos antigos. O checkbox permite continuar só com a narração/tela. RGB limitado a 0..32, escrita serial sem resposta em FFE0/FFE1, sem toggle automático e sem alterar IC, ordem RGB, quantidade de pixels ou firmware. Conectar não envia comandos. O envio de preto não pode ser garantido se a conexão já caiu; nesse caso o controlador pode manter a última cor.

O protocolo de cor global segue [kernzerfall/sp105e-rs](https://github.com/kernzerfall/sp105e-rs/blob/master/sp105e/src/commands.rs), opcode 0x1E. Não foi identificado um comando para escolher LEDs individuais. Validação em software com `node --test tests/*.test.cjs`; o teste físico das pulsações no SP105E do usuário permanece necessário. O arquivo Android continua na versão 0.3.0.

## Web 0.4.1

A entrada principal passa a ser **Conectar STM32**, usando o perfil TercoBLE da NUCLEO-WB05KZ já gravada. O painel informa os 34 LEDs físicos, preserva as 59 contas do terço e explica o teste de Acender conta/Apagar com o LED azul da própria placa. SP105E e demonstração de fábrica continuam disponíveis em Outros controladores · avançado.

O transporte BLE e os pacotes não mudam. A seleção padrão é restaurada para TercoBLE ao abrir o painel sem conexão; a conexão só é iniciada pelo clique do usuário. Validação com os testes existentes e fluxo integrado de seleção, descoberta do serviço TercoBLE e comandos de 8 bytes com resposta. A gravação, leitura integral e descoberta GATT passaram na placa em 17/10/2026; comandos observados no LED azul pelo celular e funcionamento elétrico do cordão ainda dependem da bancada. A versão Android em arquivo permanece 0.3.0.

## Web 0.4.2

- Screen Wake Lock em `dist/wake-lock.js`: mantém a tela acesa durante a oração ativa quando a API permite. Pausa, conclusão, reinício e saída liberam o bloqueio; respostas atrasadas também são liberadas. O módulo readquire ao voltar à visibilidade se a sessão continuar ativa. O comportamento existente do app é preservado: ocultar a página pausa a sessão, e voltar exige tocar em Continuar. A ponte Android existente continua usando `NativeTerco.keepAwake`.
- PWA: manifesto em português, modo standalone, cores do CSS e service worker com cache `lumen-v0.4.2`. O cache contém a página, CSS, scripts, manifesto e ícones. Só atende GETs da mesma origem cujas URLs exatas estão na lista; não intercepta outras origens ou métodos. A ativação remove apenas caches antigos `lumen-`, preservando os demais. O registro exige contexto seguro e falha sem interromper o app. Nenhum protocolo BLE, perfil, sequência, numeração, mapeamento ou teste de conta individual foi alterado.
- Ícones PNG 192×192, 512×512 e maskable 512×512 são **PLACEHOLDERS**, gerados offline, sem dependências, a partir de uma cruz geométrica nas cores do favicon existente. Não são a identidade visual final. Para regenerar: `node scripts/generate-placeholder-icons.cjs`. Substituir antes da publicação.
- Rascunhos bilíngues, baseados na auditoria do código: [política de privacidade](docs/privacy-policy.md) e [ficha Google Play, Segurança dos dados e permissões](docs/play-listing-draft.md). Ambos são **DRAFT / RASCUNHO**, com responsáveis, hospedagem, voz, pacote Android e outras decisões em aberto.

Os arquivos continuam editáveis diretamente em `dist/`, sem build. O cache usa as versões exatas dos URLs em `index.html`; ao mudar recursos em uma versão futura, atualizar também a lista e o nome do cache em `sw.js`. Não há `skipWaiting`: uma nova versão aguarda o fechamento das páginas controladas pela antiga para ativar. É necessário um primeiro carregamento online e instalação bem-sucedida do cache antes de usar os arquivos offline. A síntese de voz pode depender de rede e da voz instalada; este recurso não garante narração offline nem suporte a Web Bluetooth em qualquer contêiner.

Validação histórica da 0.4.2: **60 aprovados**, incluindo os 38 existentes, cenários de cancelamento/visibilidade do Wake Lock e cache/registro PWA. No Windows, passe os caminhos explicitamente:

```powershell
node --test tests/app-flow.test.cjs tests/bluetooth.test.cjs tests/core.test.cjs tests/guided-lights.test.cjs tests/wake-lock.test.cjs tests/pwa.test.cjs
```

Ainda precisa de teste manual em telefone, com o contêiner final:

- [ ] Iniciar uma oração com timeout de tela curto; verificar tela acesa, pausa, retomada, reinício, conclusão, modo de economia de bateria e recusa/indisponibilidade do Wake Lock.
- [ ] Trocar de app, bloquear/desbloquear a tela e voltar: a oração deve permanecer pausada até Continuar, sem comandos ou efeitos antigos retomados.
- [ ] Instalar/abrir em standalone por HTTPS, conferir ícones/recorte maskable, fechar e reabrir sem rede após o cache pronto; verificar separadamente a disponibilidade da voz offline.
- [ ] Verificar atualização do worker após fechar todas as páginas antigas, remoção do cache anterior e preservação de progresso. Para manutenção local, usar as opções de service worker/limpeza de dados do navegador; limpar dados também apaga o progresso.
- [ ] Testar permissões no Chrome/TWA, conexão, reconexão e comandos físicos TercoBLE (inclusive Acender conta/Apagar) no cordão completo. Testes em software não comprovam o funcionamento elétrico do cordão. SP105E/p2p são perfis de teste fora do lançamento.
- [ ] Compilar e validar a TWA escolhida, auditar manifesto mesclado/hospedagem/voz, substituir os PLACEHOLDERS e revisar os rascunhos antes da submissão à Play.
