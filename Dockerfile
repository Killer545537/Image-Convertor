# Stage 1: Build frontend
FROM node:22 AS frontend-builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app/frontend

COPY frontend/pnpm-lock.yaml frontend/package.json ./

RUN pnpm install

COPY frontend/ ./

RUN pnpm build

# Stage 2: Build backend
FROM rustlang/rust:nightly-slim as backend-builder

WORKDIR /app

COPY /backend ./backend/

RUN cd backend && cargo build --release

# Final Stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-builder /app/backend/target/release/backend ./backend
COPY --from=frontend-builder /app/backend/static ./static

EXPOSE 8080

CMD ["./backend"]

