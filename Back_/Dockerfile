# Imagen del backend de VinCloud (Render, o cualquier servidor con Docker)
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Primero solo las dependencias, para aprovechar la caché de Docker entre despliegues
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# Render indica el puerto en la variable PORT; 5000 es el valor por defecto en local
EXPOSE 5000

# No ejecutar como root
USER node

CMD ["node", "src/index.js"]
