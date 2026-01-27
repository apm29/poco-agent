# 镜像发布（GitHub Actions / GHCR）

仓库已提供 GitHub Actions：`.github/workflows/docker-images.yml`，用于在打 tag 时构建并推送镜像到 GHCR（`ghcr.io`）。

## 触发方式

- 推送 tag：`v*`（例如 `v0.1.0`）
- 或手动触发：GitHub -> Actions -> `docker-images` -> Run workflow（可指定前端的 `NEXT_PUBLIC_API_URL`）

## 产物镜像

默认会推送 4 个镜像（可按需修改 workflow 中的命名）：

- `ghcr.io/<owner>/poco-backend`
- `ghcr.io/<owner>/poco-executor-manager`
- `ghcr.io/<owner>/poco-executor`
- `ghcr.io/<owner>/poco-frontend`

tag 策略：

- `latest`（仅默认分支）
- `sha-<commit>`（每次构建）
- `vX.Y.Z`（当触发来源是 tag）

## 前端 API URL（构建期变量）

Frontend 的 `NEXT_PUBLIC_API_URL` 是 **build-time** 变量（Next.js 会内联到产物）。

建议：

- 在仓库 Settings -> Variables 配置 `NEXT_PUBLIC_API_URL`（用于 tag 构建）
- 或手动触发 workflow 时填入 `frontend_api_url`

## 用发布镜像启动

你可以在 `docker-compose.yml` 中覆盖各服务的 `*_IMAGE` 环境变量：

- `BACKEND_IMAGE`
- `EXECUTOR_MANAGER_IMAGE`
- `EXECUTOR_IMAGE`
- `FRONTEND_IMAGE`

例如：

```bash
export BACKEND_IMAGE=ghcr.io/<owner>/poco-backend:v0.1.0
export EXECUTOR_MANAGER_IMAGE=ghcr.io/<owner>/poco-executor-manager:v0.1.0
export EXECUTOR_IMAGE=ghcr.io/<owner>/poco-executor:v0.1.0
export FRONTEND_IMAGE=ghcr.io/<owner>/poco-frontend:v0.1.0

docker compose up -d
```
