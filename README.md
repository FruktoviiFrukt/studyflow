This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Backend setup

The backend uses PostgreSQL (via Docker) and Prisma as the ORM.

### Prerequisites

- **Node.js 22 (LTS).** Prisma 7 does not support odd-numbered (non-LTS) Node releases such as 23. Check your version with `node -v`; if it isn't `v22.x.x`, install nvm-windows (https://github.com/coreybutler/nvm-windows/releases) (or nvm on macOS/Linux) and run:
  ```bash
  nvm install 22
  nvm use 22
  ```
- **Docker Desktop**, with the WSL2 backend on Windows:
  1. Confirm you're on Windows 10 (build 19041+) or Windows 11.
  2. Open PowerShell as Administrator and run `wsl --install`, then restart your computer.
  3. If this fails with a virtualization error, enable Intel VT-x / AMD SVM Mode in your BIOS/UEFI (usually Del, F2, F10, or Esc at boot), then retry.
  4. Verify with `wsl -l -v` that your distro shows version 2 (if not: `wsl --set-default-version 2`).
  5. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), keeping the default "Use WSL 2 instead of Hyper-V" option checked, then restart.
  6. Launch Docker Desktop and wait for the whale icon in the tray to go stable/green.
  7. Verify with `docker --version`, `docker compose version`, and `docker run hello-world`.

  On macOS/Linux, just install Docker Desktop (macOS) or Docker Engine (Linux) normally — no WSL2 step needed.

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment file and adjust it if needed:
   ```bash
   cp .env.example .env
   ```
3. Start the PostgreSQL container:
   ```bash
   npm run db:up
   ```
4. Apply database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```

Other useful commands:

- `npm run db:down` — stop the database container.
- `npm run db:studio` — open Prisma Studio to browse the database.

### How to verify it worked

This branch only adds backend infrastructure — the site's pages look exactly the same as before, there's no visible change to check in the browser. Instead, confirm:

- `docker compose ps` (or `npm run db:up`) shows the db container as running.
- `npm run db:studio` opens in the browser and shows a `User` table (empty is expected).
- `npm run lint` and `npm run build` both complete without errors.

### Troubleshooting

- **Port 5432 already in use**: you likely have a native PostgreSQL install listening on the default port. This project's `docker-compose.yml` and `.env.example` already map the container to `5433` instead — if you changed the port yourself, make sure `docker-compose.yml`, `.env`, and `.env.example` agree.
- **Docker commands fail / hang**: make sure Docker Desktop is actually running (check the tray icon) before running `npm run db:up` or `prisma migrate`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
