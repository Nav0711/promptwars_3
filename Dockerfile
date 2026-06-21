# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
# Install build essentials for native dependencies if any
RUN apk add --no-cache libc6-compat openssl
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Run stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat openssl

# Copy dependency files and build outputs
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Set network binding and port
EXPOSE 8080
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"
ENV DATABASE_URL="file:./dev.db"
ENV NEXTAUTH_SECRET="ecoloop-dev-secret-change-in-production"
ENV NEXTAUTH_URL="http://localhost:8080"

# Run prisma db push to ensure database schema is up to date, then start Next.js production server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm run start"]
