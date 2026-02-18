# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

## Deployment with Docker

This project can be deployed using Docker and Nginx with HTTPS support.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### SSL Certificates

You need to provide SSL certificates in the `certs/` directory before starting the services.

#### Option 1: Generate Self-Signed Certificates (for Development)

If you don't have purchased keys, you can generate self-signed ones using OpenSSL:

```bash
mkdir certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/server.key \
  -out certs/server.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

#### Option 2: Use Purchased Certificates

If you have purchased certificates (e.g., from Namecheap, DigiCert, etc.):
1. Create a `certs/` directory in the project root.
2. Copy your private key to `certs/server.key`.
3. Copy your certificate (and bundle if applicable) to `certs/server.crt`.

> [!IMPORTANT]
> Ensure the filenames match `server.key` and `server.crt` or update `nginx.conf` and `docker-compose.yml` accordingly.

### Running with Docker Compose

1. **Configure Environment**:
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

2. **Start Services**:
   ```bash
   docker compose up -d
   ```

3. **Access the App**:
   - HTTP: `http://localhost` (will redirect to HTTPS)
   - HTTPS: `https://localhost`

### Troubleshooting

- **Logs**: View logs with `docker compose logs -f`.
- **Permissions**: Ensure the `certs/` directory and files have appropriate read permissions for the Nginx container.

---

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
