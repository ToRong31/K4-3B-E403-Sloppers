# Deploy VLearn LabSpace with Docker, Nginx, and Cloudflare Tunnel

The production stack contains PostgreSQL, FastAPI, an Nginx-served Vite build,
and a Cloudflare Tunnel container. PostgreSQL and FastAPI are not
published on host interfaces. Nginx is available only on `127.0.0.1:18080` for
local verification; public traffic reaches it through the tunnel network.
PostgreSQL records and the backend JSON workspace data both use named volumes.

## 1. Configure the application

```bash
cd codebase
cp .env.deploy.example .env.deploy
openssl rand -base64 36
```

Put the generated value in `POSTGRES_PASSWORD`. Add an LLM provider key only
when the backend AI routes need it. The deploy stack uses the persisted HTTP API
and PostgreSQL data source by default. Keep `SESSION_COOKIE_SECURE=true` for the
HTTPS tunnel; temporarily override it to `false` only when testing on plain
`http://127.0.0.1:18080`.

## 2. Start and verify without the tunnel

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build db api web
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
curl -fsS http://127.0.0.1:18080/healthz
curl -fsS http://127.0.0.1:18080/api/v1/ready
```

Open `http://127.0.0.1:18080` on the host to verify the UI.

## 3. Cloudflare Tunnel

The tunnel `labspace-torome` and its DNS route are already configured. Its
non-secret ingress configuration is in `cloudflared/config.yml`. The local
tunnel credential must exist at:

`../.cloudflared/4df41506-15c1-44b3-b6e3-a757f6754eff.json`

Both `.cloudflared/` and `.env.deploy` are ignored by Git. Do not commit or
share the credential file.

Start the full stack:

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml --profile tunnel up -d
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 tunnel
```

Then verify:

```bash
curl -fsS https://labspace.torome.online/healthz
curl -fsS https://labspace.torome.online/api/v1/ready
```

## Operations

```bash
# Rebuild after an application update
docker compose --env-file .env.deploy -f docker-compose.deploy.yml --profile tunnel up -d --build

# Read recent logs
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=200 web api tunnel

# Stop containers while preserving database data
docker compose --env-file .env.deploy -f docker-compose.deploy.yml --profile tunnel down
```

Do not run `down -v` unless deleting the PostgreSQL data is intentional.
