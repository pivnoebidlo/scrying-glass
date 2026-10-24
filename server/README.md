# Scrying Glass adventure repository

A small service that lets Scrying Glass users publish their adventures (`.sgpack` files) and download other GMs'
ones. It keeps the S3 keys and the catalog; the app moves the files straight to and from S3 by short-lived
presigned links, so the service itself carries no big traffic.

[Русская версия](README.ru.md)

## How it works

- **Authors** are key pairs (Ed25519) the app makes on the first publish. Every write request is signed; the public
  key is the author's id. No accounts, no passwords.
- **An adventure in the repository** is «author + adventure id». The same adventure published by two authors is
  two entries. A new version from the same author replaces the old one; the version before stays a while (someone
  may be downloading it), older ones are deleted.
- **The catalog** is one JSON file in the bucket (`<prefix>catalog.json`), kept in memory by the service, so it runs
  as **exactly one replica**.
- **Files** are at `<prefix>packs/<author>/<id>/<version>.sgpack` (and `.jpg` covers). The bucket stays private:
  downloads go by presigned links too.

## API (v1)

| Request | |
|---|---|
| `GET /api/v1/catalog` | the catalog |
| `GET /api/v1/packs/<author>/<id>` | 302 to the current version (counts a download) |
| `GET /api/v1/covers/<author>/<id>` | 302 to the cover |
| `POST /api/v1/publish` (signed) | asks to publish; answers with upload links |
| `POST /api/v1/commit` (signed) | the files are uploaded: put the version into the catalog |
| `POST /api/v1/unpublish` (signed) | the author takes an adventure down |
| `POST /api/v1/admin/remove` | the admin removes an entry: `Authorization: Bearer <ADMIN_TOKEN>`, body `{"author":"…","id":"…"}`; it stays blocked (`"block": false` — just removed) |
| `GET /healthz` | liveness |

## Installing with Helm

What the service needs:

1. **An S3 key** with read, write and delete rights on the bucket (only on it). Presigned URLs must work — MinIO,
   Ceph RGW, Garage, SeaweedFS and AWS all have them.
2. **The S3 address reachable by the users' apps** (`s3.publicEndpoint`): presigned links point there. If the
   service reaches S3 by an inner address, set it as `s3.endpoint`.
3. **A host** for the ingress with TLS.

```sh
kubectl create secret generic sg-repo-keys \
  --from-literal=S3_ACCESS_KEY=… \
  --from-literal=S3_SECRET_KEY=… \
  --from-literal=ADMIN_TOKEN="$(openssl rand -hex 24)"

helm install sg-repo server/chart \
  --set existingSecret=sg-repo-keys \
  --set s3.endpoint=https://rfs3.sbin.ru \
  --set s3.bucket=<bucket> \
  --set ingress.host=<host> \
  --set ingress.className=<class> \
  --set 'ingress.annotations.cert-manager\.io/cluster-issuer=<issuer>'
```

Check: `curl https://<host>/api/v1/catalog` answers `{"api":1,…,"entries":[]}`.

The other settings are in [`chart/values.yaml`](chart/values.yaml): the largest pack (`limits.maxPackMb`, 300 MB),
adventures per author (`limits.maxPerAuthor`), signed requests a minute from one address (`limits.ratePerMinute`),
the key prefix in the bucket (`s3.prefix`). An ingress in front of the service must pass `X-Forwarded-For`
(the rate limit counts by it).

## Environment

| Variable | |
|---|---|
| `S3_ENDPOINT` | where the service reaches S3 |
| `S3_PUBLIC_ENDPOINT` | where the apps reach S3 (empty — the same) |
| `S3_REGION` | `us-east-1` by default |
| `S3_BUCKET`, `S3_PREFIX` | the bucket and the prefix of the repository's keys |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | the S3 key |
| `ADMIN_TOKEN` | the admin's token (empty — no admin calls) |
| `MAX_PACK_MB`, `MAX_PER_AUTHOR`, `RATE_PER_MINUTE` | limits |
| `TRUST_PROXY` | `false` — don't read `X-Forwarded-For` |
| `PORT` | 8080 |

## The image

`ghcr.io/pivnoebidlo/scrying-glass-repo` is built by GitHub Actions (`.github/workflows/repo-image.yml`): the tag
`repo-v<version>` makes the image `<version>`, which the chart's `appVersion` points to. The first time, make the
package public in GitHub (Packages → scrying-glass-repo → Package settings → Change visibility).

By hand: `docker build -f server/Dockerfile -t scrying-glass-repo .` (from the repository root: the image takes the
shared protocol `src/shared/repo.ts`). Node 24, no dependencies.

## Locally

```sh
S3_ENDPOINT=http://127.0.0.1:9000 S3_BUCKET=test S3_ACCESS_KEY=… S3_SECRET_KEY=… node server/src/main.ts
```

Then in the app: Settings → Community → Add a repository, address `http://127.0.0.1:8080`. Tests: `npm test` (the service
with an in-memory bucket, `tests/repo.test.ts`).
