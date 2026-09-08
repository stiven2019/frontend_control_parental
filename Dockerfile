# ==========================================
# 1. Etapa de Compilación (Builder)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar pnpm según la versión del package.json
RUN npm install -g pnpm@11.24.0

# Copiar manifiestos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias exactas
RUN pnpm install --frozen-lockfile

# Copiar código fuente y archivos de configuración
COPY . .

# Compilar aplicación para producción
RUN pnpm run build

# ==========================================
# 2. Etapa de Producción (Nginx)
# ==========================================
FROM nginx:1.27-alpine AS runner

# Filtrar para que envsubst reemplace únicamente ${BACKEND_URL}
# evitando que sobreescriba variables nativas de Nginx como $uri o $host
ENV NGINX_ENVSUBST_FILTER="BACKEND_URL"
ENV BACKEND_URL="http://backend:4000"

# Copiar artefactos compilados desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar plantilla de configuración de Nginx
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Exponer el puerto HTTP
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
