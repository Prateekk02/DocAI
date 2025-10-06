FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci 

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variable for build
ENV NEXT_TELEMETRY_DISABLE 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production 
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uuid 1001 next.js

COPY --from=builder --chown=next.js:node.js /app/.next/standalone ./
COPY --from=builder --chown=next.js:node.js /app/.next/static ./next/static

USER next.js

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD [ "node",  "server.js" ]



