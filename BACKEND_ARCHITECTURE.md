# 🏗️ Backend 架构说明文档

## 📋 目录
- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [核心架构](#核心架构)
- [数据模型](#数据模型)
- [API 接口](#api-接口)
- [服务层](#服务层)
- [中间件](#中间件)
- [可观测性](#可观测性)
- [配置管理](#配置管理)
- [部署运行](#部署运行)

---

## 🎯 项目概述

**poco-agent Backend** 是一个基于 FastAPI 构建的 AI Agent 管理后端服务,主要功能包括:

- 🤖 **Agent 会话管理**: 创建、管理和追踪 AI Agent 的对话会话
- 📊 **任务调度**: 支持即时任务和定时任务的调度与执行
- 💬 **消息管理**: 处理用户和 AI Agent 之间的消息交互
- 🔧 **工具执行追踪**: 记录和监控 Agent 工具的执行情况
- 📁 **工作空间管理**: 管理会话相关的文件和工作空间
- 🔌 **MCP 服务器集成**: 支持 Model Context Protocol 服务器管理
- 📦 **对象存储**: 集成 S3 兼容对象存储服务
- 📈 **使用统计**: 追踪 API 使用量和成本

---

## 🛠️ 技术栈

### 核心框架
- **[FastAPI](https://fastapi.tiangolo.com/)** v0.128.0: 高性能 Web 框架
- **[Python](https://www.python.org/)** >= 3.12: 编程语言
- **[Uvicorn](https://www.uvicorn.org/)** v0.40.0: ASGI 服务器

### 数据库
- **[PostgreSQL](https://www.postgresql.org/)**: 主数据库
- **[SQLAlchemy](https://www.sqlalchemy.org/)** v2.0.45: ORM 框架
- **[Alembic](https://alembic.sqlalchemy.org/)** v1.18.0: 数据库迁移工具

### 依赖库
- **[Pydantic](https://docs.pydantic.dev/)** v2.12.0: 数据验证和配置管理
- **[boto3](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)** v1.42.28: AWS SDK,用于 S3 对象存储
- **[OpenAI](https://github.com/openai/openai-python)** v2.15.0: OpenAI API 客户端
- **[cryptography](https://cryptography.io/)** v46.0.3: 加密工具库

### 包管理
- **[uv](https://github.com/astral-sh/uv)**: 现代化的 Python 包管理器

---

## 📂 项目结构

```
backend/
├── app/                           # 应用主目录
│   ├── api/                       # API 路由层
│   │   └── v1/                    # API v1 版本
│   │       ├── sessions.py        # 会话管理接口
│   │       ├── messages.py        # 消息管理接口
│   │       ├── runs.py            # 运行任务接口
│   │       ├── projects.py        # 项目管理接口
│   │       ├── tasks.py           # 任务管理接口
│   │       ├── tool_executions.py # 工具执行接口
│   │       ├── attachments.py     # 附件管理接口
│   │       ├── env_vars.py        # 环境变量接口
│   │       ├── mcp_servers.py     # MCP 服务器接口
│   │       ├── skill_presets.py   # 技能预设接口
│   │       ├── skill_installs.py  # 技能安装接口
│   │       ├── user_mcp_installs.py # 用户 MCP 安装接口
│   │       ├── user_input_requests.py # 用户输入请求接口
│   │       ├── callback.py        # 回调接口
│   │       └── schedules.py       # 调度接口
│   │
│   ├── core/                      # 核心模块
│   │   ├── database.py            # 数据库配置
│   │   ├── settings.py            # 应用配置
│   │   ├── deps.py                # 依赖注入
│   │   ├── lifespan.py            # 应用生命周期管理
│   │   ├── middleware/            # 中间件
│   │   │   ├── request_context.py # 请求上下文中间件
│   │   │   └── request_logging.py # 请求日志中间件
│   │   ├── observability/         # 可观测性
│   │   │   ├── logging.py         # 日志配置
│   │   │   └── request_context.py # 请求上下文管理
│   │   └── errors/                # 错误处理
│   │       ├── error_codes.py     # 错误码定义
│   │       ├── exceptions.py      # 自定义异常
│   │       └── exception_handlers.py # 异常处理器
│   │
│   ├── models/                    # 数据模型层 (ORM)
│   │   ├── agent_session.py       # 会话模型
│   │   ├── agent_run.py           # 运行任务模型
│   │   ├── agent_message.py       # 消息模型
│   │   ├── project.py             # 项目模型
│   │   ├── tool_execution.py      # 工具执行模型
│   │   ├── usage_log.py           # 使用日志模型
│   │   ├── env_var.py             # 环境变量模型
│   │   ├── mcp_server.py          # MCP 服务器模型
│   │   ├── skill_preset.py        # 技能预设模型
│   │   ├── user_skill_install.py  # 用户技能安装模型
│   │   ├── user_mcp_install.py    # 用户 MCP 安装模型
│   │   └── user_input_request.py  # 用户输入请求模型
│   │
│   ├── schemas/                   # 数据模式层 (Pydantic)
│   │   ├── session.py             # 会话 Schema
│   │   ├── message.py             # 消息 Schema
│   │   ├── run.py                 # 运行 Schema
│   │   ├── project.py             # 项目 Schema
│   │   ├── task.py                # 任务 Schema
│   │   ├── tool_execution.py      # 工具执行 Schema
│   │   ├── usage.py               # 使用统计 Schema
│   │   ├── env_var.py             # 环境变量 Schema
│   │   ├── mcp_server.py          # MCP 服务器 Schema
│   │   ├── skill_preset.py        # 技能预设 Schema
│   │   ├── user_skill_install.py  # 用户技能安装 Schema
│   │   ├── user_mcp_install.py    # 用户 MCP 安装 Schema
│   │   ├── user_input_request.py  # 用户输入请求 Schema
│   │   ├── workspace.py           # 工作空间 Schema
│   │   ├── input_file.py          # 输入文件 Schema
│   │   ├── callback.py            # 回调 Schema
│   │   └── response.py            # 响应 Schema
│   │
│   ├── repositories/              # 数据访问层
│   │   ├── session_repository.py  # 会话仓库
│   │   ├── message_repository.py  # 消息仓库
│   │   ├── run_repository.py      # 运行仓库
│   │   ├── project_repository.py  # 项目仓库
│   │   ├── tool_execution_repository.py # 工具执行仓库
│   │   ├── usage_log_repository.py # 使用日志仓库
│   │   ├── env_var_repository.py  # 环境变量仓库
│   │   ├── mcp_server_repository.py # MCP 服务器仓库
│   │   ├── skill_preset_repository.py # 技能预设仓库
│   │   ├── user_skill_install_repository.py # 用户技能安装仓库
│   │   ├── user_mcp_install_repository.py # 用户 MCP 安装仓库
│   │   └── user_input_request_repository.py # 用户输入请求仓库
│   │
│   ├── services/                  # 业务逻辑层
│   │   ├── session_service.py     # 会话服务
│   │   ├── session_title_service.py # 会话标题服务
│   │   ├── message_service.py     # 消息服务
│   │   ├── run_service.py         # 运行服务
│   │   ├── project_service.py     # 项目服务
│   │   ├── task_service.py        # 任务服务
│   │   ├── tool_execution_service.py # 工具执行服务
│   │   ├── usage_service.py       # 使用统计服务
│   │   ├── storage_service.py     # 存储服务
│   │   ├── env_var_service.py     # 环境变量服务
│   │   ├── mcp_server_service.py  # MCP 服务器服务
│   │   ├── skill_preset_service.py # 技能预设服务
│   │   ├── user_skill_install_service.py # 用户技能安装服务
│   │   ├── user_mcp_install_service.py # 用户 MCP 安装服务
│   │   ├── user_input_request_service.py # 用户输入请求服务
│   │   └── callback_service.py    # 回调服务
│   │
│   ├── utils/                     # 工具类
│   │   ├── crypto.py              # 加密工具
│   │   ├── workspace.py           # 工作空间工具
│   │   └── workspace_manifest.py  # 工作空间清单工具
│   │
│   └── main.py                    # 应用入口
│
├── alembic/                       # 数据库迁移
│   ├── versions/                  # 迁移版本
│   └── env.py                     # Alembic 配置
│
├── alembic.ini                    # Alembic 配置文件
├── pyproject.toml                 # 项目配置文件
├── uv.lock                        # 依赖锁定文件
├── .env.example                   # 环境变量示例
└── README.md                      # 项目说明
```

---

## 🏛️ 核心架构

### 架构设计原则

Backend 采用 **分层架构** 设计,遵循以下原则:

1. **关注点分离**: API、业务逻辑、数据访问各司其职
2. **依赖注入**: 使用 FastAPI 的依赖注入系统
3. **Repository 模式**: 统一的数据访问接口
4. **服务层**: 封装业务逻辑,保持 API 层简洁
5. **Schema 验证**: 使用 Pydantic 进行严格的数据验证

### 请求处理流程

```
客户端请求
    ↓
[中间件层]
    ├── RequestContextMiddleware (生成 request_id/trace_id)
    ├── CORSMiddleware (处理跨域)
    └── RequestLoggingMiddleware (记录请求日志)
    ↓
[API 路由层] (app/api/v1/)
    ├── 参数验证 (Pydantic Schema)
    ├── 用户认证 (get_current_user_id)
    └── 数据库会话 (get_db)
    ↓
[服务层] (app/services/)
    ├── 业务逻辑处理
    ├── 数据验证
    └── 调用 Repository
    ↓
[数据访问层] (app/repositories/)
    ├── 数据库查询
    ├── 事务管理
    └── 返回 ORM 模型
    ↓
[数据模型层] (app/models/)
    ├── SQLAlchemy ORM 模型
    └── 数据库表映射
    ↓
返回响应 (统一格式)
```

### 应用初始化流程

在 [main.py](backend/app/main.py:11-31) 中定义了应用的创建流程:

```python
def create_app() -> FastAPI:
    settings = get_settings()

    # 1. 配置日志系统
    configure_logging(debug=settings.debug, service_name="backend", ...)

    # 2. 创建 FastAPI 实例
    app = FastAPI(title=settings.app_name, version=settings.app_version, ...)

    # 3. 设置中间件
    setup_middleware(app)

    # 4. 设置异常处理器
    setup_exception_handlers(app, debug=settings.debug)

    # 5. 注册路由
    setup_routers(app)

    return app
```

---

## 💾 数据模型

### 核心实体关系

```
Project (项目)
    ↓ 1:N
AgentSession (会话)
    ↓ 1:N
    ├── AgentMessage (消息)
    ├── AgentRun (运行任务)
    ├── ToolExecution (工具执行)
    ├── UsageLog (使用日志)
    └── UserInputRequest (用户输入请求)
```

### 主要模型说明

#### 1. AgentSession (会话模型)
定义位置: [agent_session.py](backend/app/models/agent_session.py:18-63)

会话是 Agent 交互的核心实体,包含:
- **基本信息**: ID, user_id, project_id, title, status
- **配置快照**: config_snapshot (JSON)
- **工作空间**: workspace_archive_url, workspace_files_prefix, workspace_manifest_key
- **状态管理**: state_patch, workspace_export_status
- **软删除**: is_deleted
- **关联关系**: project, messages, tool_executions, runs, usage_logs, user_input_requests

#### 2. AgentRun (运行任务模型)
定义位置: [agent_run.py](backend/app/models/agent_run.py:25-75)

运行任务表示一次 Agent 的执行,包含:
- **关联**: session_id, user_message_id
- **状态**: status (queued/running/completed/failed), progress
- **调度**: schedule_mode, scheduled_at
- **租约机制**: claimed_by, lease_expires_at (用于任务分发)
- **重试**: attempts, last_error
- **时间**: started_at, finished_at

#### 3. 其他核心模型

- **AgentMessage**: 存储用户和 AI 的消息
- **ToolExecution**: 记录 Agent 工具的执行情况
- **UsageLog**: 追踪 API 使用量和成本
- **Project**: 组织会话的容器
- **EnvVar**: 环境变量配置
- **McpServer**: MCP 服务器配置
- **SkillPreset**: 技能预设
- **UserSkillInstall**: 用户安装的技能
- **UserMcpInstall**: 用户安装的 MCP 服务器
- **UserInputRequest**: 用户输入请求

### 数据库基类

在 [database.py](backend/app/core/database.py:23-38) 中定义了两个基类:

```python
class Base(DeclarativeBase):
    """SQLAlchemy 声明式基类"""
    pass

class TimestampMixin:
    """时间戳混入类,自动管理 created_at 和 updated_at"""
    created_at: Mapped[datetime]  # 创建时间
    updated_at: Mapped[datetime]  # 更新时间
```

---

## 🌐 API 接口

### API 版本管理

所有 API 接口统一挂载在 `/api/v1` 路径下,由 [api/v1/__init__.py](backend/app/api/v1/__init__.py) 统一注册。

### 核心接口分类

#### 1. 会话管理接口 (`/api/v1/sessions`)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/sessions` | 创建新会话 |
| GET | `/sessions` | 列出会话列表 |
| GET | `/sessions/{session_id}` | 获取会话详情 |
| PATCH | `/sessions/{session_id}` | 更新会话 |
| DELETE | `/sessions/{session_id}` | 软删除会话 |
| GET | `/sessions/{session_id}/state` | 获取会话状态 |
| GET | `/sessions/{session_id}/messages` | 获取会话消息 |
| GET | `/sessions/{session_id}/tool-executions` | 获取工具执行记录 |
| GET | `/sessions/{session_id}/usage` | 获取使用统计 |
| GET | `/sessions/{session_id}/workspace/files` | 获取工作空间文件 |

#### 2. 消息接口 (`/api/v1/messages`)
- 创建消息
- 查询消息
- 更新消息

#### 3. 运行任务接口 (`/api/v1/runs`)
- 创建运行任务
- 查询任务状态
- 更新任务进度

#### 4. 项目接口 (`/api/v1/projects`)
- 项目 CRUD 操作

#### 5. 工具执行接口 (`/api/v1/tool-executions`)
- 记录工具执行
- 查询执行历史

#### 6. 附件接口 (`/api/v1/attachments`)
- 上传附件
- 获取附件 URL

#### 7. 环境变量接口 (`/api/v1/env-vars`)
- 管理环境变量

#### 8. MCP 服务器接口 (`/api/v1/mcp-servers`)
- MCP 服务器管理

#### 9. 技能接口
- `/api/v1/skill-presets`: 技能预设管理
- `/api/v1/skill-installs`: 用户技能安装管理

#### 10. 调度接口 (`/api/v1/schedules`)
- 任务调度管理

#### 11. 回调接口 (`/api/v1/callback`)
- 异步回调处理

### 统一响应格式

所有 API 响应都遵循统一格式,定义在 [schemas/response.py](backend/app/schemas/response.py):

```python
{
    "success": true,          // 是否成功
    "data": {...},           // 数据载荷
    "message": "操作成功",    // 消息
    "code": "200000",        // 业务码
    "request_id": "xxx",     // 请求追踪 ID
    "timestamp": "2024-..."  // 时间戳
}
```

错误响应格式:

```python
{
    "success": false,
    "error": {
        "code": "404001",
        "message": "资源未找到",
        "details": {...}
    },
    "request_id": "xxx",
    "timestamp": "2024-..."
}
```

---

## 🔧 服务层

服务层封装业务逻辑,是 Repository 和 API 层之间的桥梁。

### 服务层职责

1. **业务逻辑处理**: 复杂的业务规则
2. **数据验证**: 业务级别的验证
3. **事务管理**: 跨多个 Repository 的事务
4. **权限检查**: 用户权限验证
5. **外部服务调用**: 调用其他服务 (如 OpenAI, S3)

### 核心服务示例

#### SessionService (会话服务)
定义位置: [session_service.py](backend/app/services/session_service.py:16-141)

主要方法:
- `create_session()`: 创建会话,验证项目归属
- `get_session()`: 获取会话,处理未找到异常
- `update_session()`: 更新会话,支持部分字段更新
- `delete_session()`: 软删除会话
- `list_sessions()`: 列出会话,支持分页和过滤
- `find_session_by_sdk_id_or_uuid()`: 通过 SDK ID 或 UUID 查找会话

#### StorageService (存储服务)
负责 S3 对象存储交互:
- 上传文件
- 生成预签名 URL
- 获取工作空间清单
- 管理文件元数据

#### SessionTitleService (会话标题服务)
使用 OpenAI API 自动生成会话标题:
- 基于会话消息内容
- 智能总结对话主题

---

## ⚙️ 中间件

### 中间件执行顺序

中间件按添加顺序从外到内执行,在 [middleware/__init__.py](backend/app/core/middleware/__init__.py:13-29) 中配置:

```
请求 → RequestContextMiddleware → CORSMiddleware → RequestLoggingMiddleware → 应用
```

### 1. RequestContextMiddleware
**位置**: [middleware/request_context.py](backend/app/core/middleware/request_context.py)

**功能**:
- 为每个请求生成唯一的 `request_id` 和 `trace_id`
- 支持从请求头中读取已有的追踪 ID
- 将 ID 存储到 `contextvars` 中,供日志系统使用
- 在响应头中返回追踪 ID

**请求头**:
- `X-Request-Id`: 请求 ID
- `X-Trace-Id`: 追踪 ID (用于分布式追踪)

### 2. CORSMiddleware
**功能**: 处理跨域请求 (CORS)

**配置** (来自 settings):
- `allow_origins`: 允许的源 (默认: localhost:3000)
- `allow_credentials`: 允许携带凭证
- `allow_methods`: 允许所有 HTTP 方法
- `allow_headers`: 允许所有请求头
- `expose_headers`: 暴露追踪 ID 头

### 3. RequestLoggingMiddleware
**位置**: [middleware/request_logging.py](backend/app/core/middleware/request_logging.py)

**功能**:
- 记录每个请求的详细信息
- 记录请求处理时间
- 记录响应状态码
- 自动关联 request_id 和 trace_id

**日志内容**:
- 请求方法和路径
- 请求头 (敏感信息脱敏)
- 响应状态码
- 处理耗时
- 客户端 IP

---

## 📊 可观测性

### 结构化日志系统

#### 日志格式
定义位置: [observability/logging.py](backend/app/core/observability/logging.py:81-113)

日志采用 **键值对格式** (Key-Value Format):

```
2024-01-22T10:30:45.123Z INFO backend app.services.session_service
[request_id=abc-123 trace_id=xyz-789] Created session for user user_123
session_id="uuid-xxx" project_id="uuid-yyy"
```

**日志字段说明**:
- `timestamp`: ISO 8601 格式,UTC 时区
- `level`: 日志级别 (DEBUG/INFO/WARNING/ERROR)
- `service`: 服务名称
- `logger`: 日志记录器名称
- `request_id`: 请求 ID
- `trace_id`: 追踪 ID
- `message`: 日志消息
- `extra fields`: 额外的键值对字段

#### 敏感信息保护
自动脱敏包含以下关键词的字段:
- token, secret, password, authorization, api_key

显示为 `***` 而非真实值。

#### 日志配置

**环境变量**:
- `LOG_LEVEL`: 日志级别 (DEBUG/INFO/WARNING/ERROR)
- `LOG_TO_FILE`: 是否保存到文件 (默认: false)
- `LOG_DIR`: 日志目录 (默认: ./logs)
- `LOG_FILE_NAME`: 日志文件名 (默认: backend.log)
- `LOG_BACKUP_COUNT`: 保留的日志文件数量 (默认: 14)
- `LOG_SQL`: 是否记录 SQL 语句 (默认: false)
- `UVICORN_ACCESS_LOG`: 是否启用 Uvicorn 访问日志 (默认: false)

**日志轮转**:
- 按天轮转 (每天午夜 UTC 时间)
- 自动压缩旧日志
- 自动删除过期日志

#### 降噪配置
自动降低以下日志级别:
- `sqlalchemy.engine.Engine`: 避免大量 SQL 日志
- `uvicorn.access`: 已有自定义请求日志
- `httpx, httpcore, urllib3, botocore, boto3`: 网络库日志

### 请求追踪

#### 上下文管理
使用 Python `contextvars` 实现请求上下文,定义在 [observability/request_context.py](backend/app/core/observability/request_context.py):

```python
# 获取当前请求的追踪 ID
request_id = get_request_id()
trace_id = get_trace_id()
```

#### 分布式追踪
- `request_id`: 单个请求的唯一标识
- `trace_id`: 跨服务的追踪标识,可用于关联多个服务的日志

---

## ⚙️ 配置管理

### 配置类
定义位置: [core/settings.py](backend/app/core/settings.py:7-57)

使用 **Pydantic Settings** 进行配置管理,支持:
- 环境变量加载
- 类型验证
- 默认值设置
- `.env` 文件支持

### 主要配置项

#### 应用配置
```python
APP_NAME=OpenCoWork Backend     # 应用名称
APP_VERSION=0.1.0               # 应用版本
DEBUG=false                     # 调试模式
HOST=0.0.0.0                    # 监听地址
PORT=8000                       # 监听端口
```

#### 数据库配置
```python
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
```

#### CORS 配置
```python
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### 安全配置
```python
SECRET_KEY=change-this-secret-key-in-production
INTERNAL_API_TOKEN=change-this-token-in-production
```

#### 外部服务配置

**Executor Manager** (任务执行器):
```python
EXECUTOR_MANAGER_URL=http://localhost:8001
```

**S3 对象存储**:
```python
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_REGION=us-east-1
S3_BUCKET=your-bucket-name
S3_FORCE_PATH_STYLE=true
S3_PRESIGN_EXPIRES=300  # 预签名 URL 过期时间(秒)
```

**OpenAI**:
```python
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_DEFAULT_MODEL=gpt-4o-mini
```

**文件上传**:
```python
MAX_UPLOAD_SIZE_MB=100  # 最大上传文件大小(MB)
```

### 配置加载

配置通过 `get_settings()` 函数获取,使用 `@lru_cache` 装饰器确保单例:

```python
from app.core.settings import get_settings

settings = get_settings()
print(settings.app_name)
```

---

## 🚀 部署运行

### 环境要求
- **Python**: >= 3.12
- **PostgreSQL**: >= 13
- **S3 兼容存储** (可选): MinIO, AWS S3, 阿里云 OSS 等

### 本地开发

#### 1. 克隆项目
```bash
git clone <repository-url>
cd poco-agent/backend
```

#### 2. 安装依赖
使用 `uv` (推荐):
```bash
uv sync
```

或使用 `pip`:
```bash
pip install -e .
```

#### 3. 配置环境变量
复制 `.env.example` 到 `.env`:
```bash
cp .env.example .env
```

编辑 `.env` 文件,配置数据库和其他服务。

#### 4. 数据库迁移
```bash
# 创建迁移
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

#### 5. 启动服务
```bash
# 使用 uvicorn 直接启动
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 或使用 Python 启动
python -m app.main
```

#### 6. 访问 API 文档
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/v1/health

### 生产部署

#### 使用 Docker (推荐)
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# 安装 uv
RUN pip install uv

# 复制依赖文件
COPY pyproject.toml uv.lock ./

# 安装依赖
RUN uv sync --frozen --no-dev

# 复制应用代码
COPY . .

# 运行数据库迁移
RUN alembic upgrade head

# 启动应用
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 使用 Systemd
```ini
[Unit]
Description=Poco Agent Backend
After=network.target postgresql.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/opt/poco-agent/backend
Environment="PATH=/opt/poco-agent/backend/.venv/bin"
ExecStart=/opt/poco-agent/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

#### 性能优化
- 使用 **Gunicorn + Uvicorn Worker**:
  ```bash
  gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
  ```
- 启用数据库连接池 (已配置在 `database.py` 中)
- 配置 Nginx 反向代理
- 启用 Gzip 压缩

---

## 📝 开发规范

### 代码结构规范
1. **API 层**: 只负责参数验证和响应格式化
2. **服务层**: 封装业务逻辑,调用 Repository
3. **Repository 层**: 只负责数据访问,不包含业务逻辑
4. **Model 层**: 纯数据模型,不包含业务逻辑

### 异常处理
使用自定义异常 `AppException`,定义在 [errors/exceptions.py](backend/app/core/errors/exceptions.py:6-17):

```python
from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException

raise AppException(
    error_code=ErrorCode.NOT_FOUND,
    message="会话未找到",
    details={"session_id": session_id}
)
```

### 日志记录
```python
import logging

logger = logging.getLogger(__name__)

logger.info(
    "会话创建成功",
    extra={
        "session_id": str(session_id),
        "user_id": user_id,
        "project_id": str(project_id) if project_id else None
    }
)
```

### 数据库事务
```python
def create_session(self, db: Session, user_id: str, request: SessionCreateRequest):
    # 数据库操作
    db_session = SessionRepository.create(...)

    # 提交事务
    db.commit()

    # 刷新对象
    db.refresh(db_session)

    return db_session
```

---

## 🔗 相关链接

- **FastAPI 文档**: https://fastapi.tiangolo.com/
- **SQLAlchemy 文档**: https://docs.sqlalchemy.org/
- **Pydantic 文档**: https://docs.pydantic.dev/
- **Alembic 文档**: https://alembic.sqlalchemy.org/
- **Uvicorn 文档**: https://www.uvicorn.org/

---

## 📞 联系方式

如有问题或建议,请通过以下方式联系:
- 提交 Issue
- Pull Request
- 项目讨论区

---

**文档更新时间**: 2024-01-22
**版本**: v1.0.0
