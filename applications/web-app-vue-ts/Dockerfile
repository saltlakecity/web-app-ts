# applications/web-app-vue-ts/Dockerfile
FROM node:20-alpine as build-stage
WORKDIR /app

# принимаем аргумент при билде и выставляем ENV, чтобы Vite увидел переменную
ARG VITE_API_URL="/api"
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]