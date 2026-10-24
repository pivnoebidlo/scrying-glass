# Репозиторий приключений Scrying Glass

Небольшой сервис, через который пользователи Scrying Glass публикуют свои приключения (файлы `.sgpack`) и скачивают
чужие. Он хранит ключи S3 и каталог; сами файлы приложение загружает в S3 и скачивает оттуда напрямую по
одноразовым ссылкам (presigned URL), поэтому большого трафика через сервис нет.

[English version](README.md)

## Как устроено

- **Автор** — пара ключей (Ed25519), которую приложение создаёт при первой публикации. Каждый запрос на запись
  подписан; открытый ключ — это id автора. Ни учётных записей, ни паролей.
- **Приключение в репозитории** — «автор + id приключения». Одно и то же приключение от двух авторов — две записи.
  Новая версия от того же автора заменяет старую; предыдущая версия остаётся ненадолго (её может кто-то скачивать),
  более старые удаляются.
- **Каталог** — один JSON в бакете (`<prefix>catalog.json`), сервис держит его в памяти, поэтому работает **ровно
  одна реплика**.
- **Файлы** — `<prefix>packs/<автор>/<id>/<версия>.sgpack` (и обложки `.jpg`). Бакет остаётся закрытым: скачивание
  тоже идёт по одноразовым ссылкам.

API — в [английской версии](README.md#api-v1).

## Установка через Helm

Что нужно сервису:

1. **Ключ S3** с правами на чтение, запись и удаление в бакете (только в нём). Нужна поддержка presigned URL — она
   есть у MinIO, Ceph RGW, Garage, SeaweedFS и AWS.
2. **Адрес S3, доступный приложениям пользователей** (`s3.publicEndpoint`): на него ведут одноразовые ссылки. Если
   сервис ходит в S3 по внутреннему адресу — его в `s3.endpoint`.
3. **Домен** для ingress с TLS.

```sh
kubectl create secret generic sg-repo-keys \
  --from-literal=S3_ACCESS_KEY=… \
  --from-literal=S3_SECRET_KEY=… \
  --from-literal=ADMIN_TOKEN="$(openssl rand -hex 24)"

helm install sg-repo server/chart \
  --set existingSecret=sg-repo-keys \
  --set s3.endpoint=https://rfs3.sbin.ru \
  --set s3.bucket=<бакет> \
  --set ingress.host=<домен> \
  --set ingress.className=<класс> \
  --set 'ingress.annotations.cert-manager\.io/cluster-issuer=<issuer>'
```

Проверка: `curl https://<домен>/api/v1/catalog` отвечает `{"api":1,…,"entries":[]}`.

Остальные настройки — в [`chart/values.yaml`](chart/values.yaml): наибольший размер приключения (`limits.maxPackMb`,
300 МБ), приключений на автора (`limits.maxPerAuthor`), подписанных запросов в минуту с одного адреса
(`limits.ratePerMinute`), префикс ключей в бакете (`s3.prefix`). Ingress перед сервисом должен передавать
`X-Forwarded-For` (по нему считается ограничение частоты).

Снять приключение (администратор):

```sh
curl -X POST https://<домен>/api/v1/admin/remove -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"author":"<ключ автора>","id":"<id>"}'
```

Запись остаётся заблокированной (опубликовать её снова нельзя); `"block": false` — просто убрать.

## Образ

`ghcr.io/pivnoebidlo/scrying-glass-repo` собирает GitHub Actions (`.github/workflows/repo-image.yml`): тег
`repo-v<версия>` даёт образ `<версия>`, на который указывает `appVersion` чарта. В первый раз пакет нужно сделать
публичным на GitHub (Packages → scrying-glass-repo → Package settings → Change visibility).

Вручную: `docker build -f server/Dockerfile -t scrying-glass-repo .` (из корня репозитория: образ берёт общий
протокол `src/shared/repo.ts`). Node 24, без зависимостей.
