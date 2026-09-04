# Link na Bio — Automatize Soluções Digitais

Página de bio link da Automatize: carrossel de serviços, cards de solução com
preços, formulário que abre o WhatsApp com a mensagem pronta e um mascote robô
que acompanha a navegação destacando os CTAs.

Publicado como site estático — a página é inteiramente pré-renderizada, então
não há processo Node em produção.

## Desenvolvimento

```bash
npm install
npx vite
```

O servidor sobe em <http://localhost:5173>. A primeira compilação leva ~20s.

> Os scripts `dev`, `build`, `lint` e `install:ci` do `package.json` vêm do
> starter original e só funcionam em Linux (usam prefixo de variável no estilo
> Unix e helpers com `flock`/`timeout` do GNU). No Windows, use `npx vite` para
> desenvolver e `npm run build:static` para gerar o site.

## Build de produção

```bash
npm run build:static
```

Gera `out/` com HTML, CSS, JS e imagens prontos para qualquer servidor de
arquivos estáticos.

## Publicação (Coolify)

O `Dockerfile` tem dois estágios: constrói com `node:22-alpine` e serve o
resultado com `nginx:1.27-alpine`. A imagem final fica em torno de 30 MB.

Configuração na aplicação do Coolify:

| Campo             | Valor        |
| ----------------- | ------------ |
| Build Pack        | `Dockerfile` |
| Base Directory    | `/`          |
| Port              | `80`         |
| Variáveis de ambiente | nenhuma  |

O `nginx.conf` define cache imutável para os assets com hash, cache curto para
as fotos dos serviços e nenhum cache para o HTML — é isso que faz uma nova
publicação aparecer imediatamente.

## Estrutura

```
app/                     página, layout e o CSS global
components/
  HeroCarousel.tsx       carrossel do topo
  BrandIcons.tsx         ícones de WhatsApp, Facebook e Instagram em SVG
  RobotMascot/           mascote: SVG, posicionamento, coreografia e estados
public/services/         fotos usadas nos cards e no carrossel
```

O mascote tem um modo de diagnóstico: `debug: true` em
`components/RobotMascot/robotConfig.ts` mostra o estado atual e registra cada
decisão de posicionamento em `window.__robotTrace`.

## Sobre o scaffold do Cloudflare

`worker/`, `db/`, `drizzle/`, `examples/` e `.openai/` vieram do starter
original (alvo Cloudflare Workers) e não são usados pelo site. Ficam de fora do
typecheck e da imagem Docker, mas foram mantidos no repositório caso um dia se
queira voltar àquele fluxo.
