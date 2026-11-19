# Hospedagem publica do Lumen (GitHub Pages)

**RASCUNHO operacional — nenhum push/deploy foi feito por agentes.**  
URL esperada apos o Hiago publicar: **https://hiagomrossi.github.io/**

## Por que GitHub Pages (user site na raiz)

- Conta GitHub ja existe: `HiagoMRossi`.
- HTTPS gratis, sem muro de login (diferente de `*.chatgpt.site`).
- A TWA exige `https://<dominio>/.well-known/assetlinks.json` na **raiz do dominio**.
- Site de projeto (`hiagomrossi.github.io/lumen/`) **nao serve** para isso: o Chrome busca o arquivo em `hiagomrossi.github.io/.well-known/`, nao em `/lumen/.well-known/`.
- Por isso o alvo e o repositorio de user site **`HiagoMRossi.github.io`**, publicando a pasta `dist/` na raiz (sem base path). Manifest, service worker e caminhos relativos `./` ja funcionam assim.

Alternativas (Cloudflare Pages / Netlify) tambem dariam um subdominio com raiz propria; o Findly usa Render. Preferimos Pages para nao abrir conta nova.

## O que ja esta pronto neste repositorio (local)

- App estatico em `dist/` (PWA 0.4.3).
- `dist/.well-known/assetlinks.json` **provisorio** com pacote `com.hiagomrossi.lumen` e SHA `REPLACE_WITH_PLAY_APP_SIGNING_SHA256`.
- `dist/.nojekyll` (impede o Jekyll de esconder pastas).
- Workflow `.github/workflows/pages.yml` (dispara no push em `main`; **nao foi executado**).
- TWA em `android-twa/` aponta para `hiagomrossi.github.io`.

## Passos que so o Hiago faz

1. No GitHub, criar repositorio **publico** chamado exatamente `HiagoMRossi.github.io` (Settings do repo > Pages so funciona apos o codigo existir; o workflow abaixo ja configura Pages via Actions).
2. Neste PC, na pasta `lumen-web`, conferir a branch `hosting-gh-pages` (ou `main` depois do merge local):
   ```powershell
   cd "C:\Users\Microsoft\Documents\ChatGPT\terço bluetooth\lumen-web"
   git remote add origin https://github.com/HiagoMRossi/HiagoMRossi.github.io.git
   git push -u origin hosting-gh-pages:main
   ```
   (Se preferir, faca merge local para `main` antes do push. **Nao use `--force`** se o remoto ja tiver commits.)
3. Em **Settings > Pages** do repo: Source = **GitHub Actions**. Na primeira vez o workflow pedira aprovacao do environment `github-pages` — aprove.
4. Espere o Action verde. Abra no Chrome do celular: **https://hiagomrossi.github.io/** (sem login). Confira tambem **https://hiagomrossi.github.io/.well-known/assetlinks.json**.
5. Web Bluetooth: no Chrome Android, Conectar STM32 / TercoBLE.
6. Quando a Play Console tiver o certificado de **App signing**, substitua `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` em `dist/.well-known/assetlinks.json`, faca commit e push de novo. So entao a TWA fica "verified" (sem barra de URL).
7. Recompile o APK/AAB da pasta `android-twa/` (ja com host `hiagomrossi.github.io`) e instale no POCO para validar a TWA.

## O que ainda bloqueia a TWA verificada

- SHA-256 real do Play App Signing (placeholder atual).
- Confirmacao do `applicationId` `com.hiagomrossi.lumen`.
- Conta Play Console, chave de upload, icones finais, textos de privacidade.

## Nao fazer (limites)

- Nao republicar em `*.chatgpt.site` (exige login).
- Nao colocar o app so em `/lumen/` sem dominio proprio — quebra o Digital Asset Links.
- Agentes nao fazem `git push`, criar repo, gastar nem abrir conta.