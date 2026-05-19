# Etapa 1: Construcción
FROM node:18-alpine AS build-stage

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm config set strict-ssl false
RUN npm install

COPY . .

RUN npm run build

# Etapa 2: Servido con Nginx
FROM nginx:alpine

COPY --from=build-stage /usr/src/app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
