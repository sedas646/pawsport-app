# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json eslint.config.js ./
COPY src/ src/
RUN npm run build

# Stage 2: Python runtime
FROM python:3.12-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend code
COPY backend/ /app/backend/

# Copy built frontend from stage 1
COPY --from=frontend-build /app/dist /app/dist

# Expose port (Render sets $PORT)
EXPOSE 8000

# Run uvicorn, binding to $PORT (default 8000 for local)
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
