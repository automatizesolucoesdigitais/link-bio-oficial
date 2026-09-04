# Bio Link da Automatize — imagem estática para Coolify/Hostinger.
#
# A página é 100% pré-renderizada (`next build` com output: "export"), então
# não há processo Node em produção: o nginx serve HTML/CSS/JS prontos.
# Resultado: ~30 MB de imagem e consumo de memória desprezível na VPS.

# ---------- build ----------
FROM node:22-alpine AS build

WORKDIR /app

# Instala dependências primeiro para aproveitar o cache de camadas: só
# reinstala quando package.json/package-lock.json mudam.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# O npm script "build" do starter é um wrapper Linux que chama o vinext
# (alvo Cloudflare Workers). Aqui queremos o export estático do Next.
RUN npx next build

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime

# Configuração própria: cache longo para assets com hash, curto para o HTML.
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/out /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
