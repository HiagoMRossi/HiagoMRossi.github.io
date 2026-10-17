# Lumen · Terço guiado

Aplicativo web estático. Os arquivos editáveis ficam em `dist/`; não requer compilação.

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
