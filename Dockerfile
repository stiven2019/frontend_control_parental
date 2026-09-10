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

# Variables para envsubst
ENV NGINX_ENVSUBST_FILTER="BACKEND_URL"
ENV BACKEND_URL="http://backend:4000"

# Copiar aplicación compilada
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración como plantilla
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Exponer HTTP
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
