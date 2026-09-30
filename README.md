# Lumen · Terço guiado

Aplicativo web estático. Os arquivos editáveis ficam em `dist/`; não requer compilação.

Versão 0.3: inclui perfil Bluetooth SP105E com teste de cores globais, apagar por RGB zero e alternância explícita de energia. Não implementa o avanço de LEDs individuais no SP105E. A conexão exige Chrome Android com HTTPS e escolha do dispositivo pelo usuário.

Protocolo e testes foram verificados em software; o ensaio físico no controlador do usuário segue pendente.

## Web 0.3.1

Busca sem filtro para controladores com nome alterado ou sem UUID no anúncio, mantendo a validação FFE0/FFE1 antes de habilitar os comandos. Mensagens diferenciam seleção e descoberta de serviço; o erro original do Chrome fica disponível em Detalhes da tentativa. Testes: `node --test tests/*.test.cjs`. A versão Android em arquivo permanece 0.3.0.
