
- ingresar a la carpeta teleatiendo/ y ejecutar:


cd teleatiendo/
docker compose up -d

docker compose ps

- ingresar al contenedor web:
docker exec -it teleatiendo-chaskiq-web-1 bash
- y ejecutar:
bundle exec rails db:setup
bundle exec rails db:migrate
bundle exec rails admin_generator
bundle exec rails packages:update
bundle exec rails data:load_data_app
bundle exec rails data:load_data_campaigns

- volver a cargar el contenedor:
docker compose up -d --no-deps chaskiq-web

------------------------------------------------------------------------------------------------------------------
Solo para modo producción en local: 
------------------------------------------------------------------------------------------------------------------
- instalar en el contenedor nginx, mkcert para generar un certificado SSL válido para el servidor local 

docker exec -it teleatiendo-chaskiq-nginx-1 ash

apk --no-cache add curl \
    && curl -LO https://github.com/FiloSottile/mkcert/releases/download/v1.4.3/mkcert-v1.4.3-linux-amd64 \
    && mv mkcert-v1.4.3-linux-amd64 /usr/local/bin/mkcert \
    && chmod +x /usr/local/bin/mkcert \
    && mkcert -install

docker exec -it teleatiendo-chaskiq-nginx-1 mkcert app.chaskiq.test

------------------------------------------------
DOCKER-COMPOSE.YML para modo producción en local:
------------------------------------------------
version: "3"

services:
  chaskiq-db:
    env_file:
      - ./chaskiq.env
    image: postgres:15.2-alpine3.17
    ports:
      - "5432:5432"

  chaskiq-redis:
    image: redis:7.0.11-alpine3.17
    ports:
      - "6379:6379"

  chaskiq-anycable-rpc:
    env_file:
      - ./chaskiq.env
    image: teleatiendo_chaskiq_test:v1.0
    ports:
      - "50051:50051"
    command: bundle exec anycable

  chaskiq-anycable:
    env_file:
      - ./chaskiq.env
    image: "anycable/anycable-go:1.0-alpine"
    ports:
      - "8080:8080"
    depends_on:
      - chaskiq-redis
      - chaskiq-anycable-rpc

  chaskiq-web:
    env_file:
      - ./chaskiq.env
    image: teleatiendo_chaskiq_test:v1.0
    ports:
      - "3000:3000"
    command: bundle exec rails server -p 3000 -b 0.0.0.0
    depends_on:
      - chaskiq-db
      - chaskiq-redis
    volumes:
    - storage_chaskiq:/var/storage_chaskiq

  chaskiq-job:
    env_file:
      - ./chaskiq.env
    image: teleatiendo_chaskiq_test:v1.0
    command: bundle exec sidekiq -C config/sidekiq.yml
    depends_on:
      - chaskiq-db
      - chaskiq-redis

  chaskiq-nginx:
    image: nginx:1.24.0-alpine3.17
    volumes:
      - ./chaskiq_site.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "5000:80"

volumes:
  storage_chaskiq:  null




