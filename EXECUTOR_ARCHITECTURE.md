# 🤖 Executor 系统架构说明文档

## 📋 目录
- [系统概述](#系统概述)
- [架构设计](#架构设计)
- [Executor Manager](#executor-manager)
- [Executor](#executor)
- [任务调度流程](#任务调度流程)
- [容器管理](#容器管理)
- [配置管理](#配置管理)
- [API 接口](#api-接口)
- [钩子系统](#钩子系统)
- [部署运行](#部署运行)

---

## 🎯 系统概述

**Executor 系统** 是 poco-agent 的核心执行引擎,负责调度和执行 AI Agent 任务。系统由两个主要组件组成:

### 核心组件

#### 1. **Executor Manager** (任务调度器)
- **端口**: 8001
- **职责**: 任务调度、容器管理、任务分发
- **技术栈**: FastAPI + APScheduler + Docker SDK

#### 2. **Executor** (执行器)
- **端口**: 8080 (动态分配)
- **职责**: 执行 Claude Agent 任务、钩子管理、回调处理
- **技术栈**: FastAPI + Claude Agent SDK

### 系统特点

- 🔄 **任务调度**: 支持即时任务和定时任务的调度
- 🐳 **容器隔离**: 基于 Docker 的任务执行隔离
- 🔌 **钩子扩展**: 灵活的钩子系统支持功能扩展
- 📊 **实时回调**: 任务执行过程的实时状态回调
- 🔁 **重试机制**: 任务失败自动重试
- 📈 **并发控制**: 支持并发任务执行限制

---

## 🏗️ 架构设计

### 系统架构图

```
┌─────────────┐
│   Backend   │ (端口: 8000)
│   FastAPI   │
└──────┬──────┘
       │ 创建 Session
       │ 存储状态
       ▼
┌─────────────────────────┐
│   Executor Manager      │ (端口: 8001)
│   ├── APScheduler       │ 任务调度
│   ├── ContainerPool     │ 容器池管理
│   ├── TaskDispatcher    │ 任务分发
│   └── RunPullService    │ 任务拉取
└───────────┬─────────────┘
            │ 调度任务
            ▼
    ┌───────────────┐
    │ Docker Engine │
    └───────┬───────┘
            │ 创建/管理容器
            ▼
    ┌──────────────────┐
    │   Executor       │ (端口: 动态)
    │   ├── AgentSDK   │ Claude Agent 执行
    │   ├── Hooks      │ 钩子系统
    │   └── Callbacks  │ 回调处理
    └──────────────────┘
```

### 数据流

```
1. 用户请求 → Frontend → Backend
2. Backend → 创建 AgentSession
3. Backend → Executor Manager (创建任务)
4. Executor Manager → APScheduler (调度任务)
5. TaskDispatcher → ContainerPool (获取容器)
6. ContainerPool → Docker (创建/启动容器)
7. TaskDispatcher → Executor (发送任务)
8. Executor → AgentSDK (执行 Agent)
9. Hooks → Executor Manager (回调)
10. Executor Manager → Backend (更新状态)
11. Backend → Frontend (状态更新)
```

---

## 🔧 Executor Manager

### 概述

**Executor Manager** 是任务调度和容器管理的核心服务,负责将用户任务分发到 Executor 容器中执行。

### 核心模块

#### 1. TaskService (任务服务)

**位置**: [task_service.py](executor_manager/app/services/task_service.py)

**主要功能**:
- 创建任务并调度执行
- 查询任务状态
- 会话管理和复用

**关键方法**:

```python
async def create_task(
    user_id: str,
    prompt: str,
    config: dict,
    session_id: str | None = None
) -> TaskCreateResponse:
    """创建任务并调度执行

    Args:
        user_id: 用户 ID
        prompt: 任务提示词
        config: 任务配置
        session_id: 可选的会话 ID,用于继续对话

    Returns:
        包含 task_id, session_id, executor_url 的响应
    """
```

**任务创建流程**:
1. 检查是否复用现有会话,否则创建新会话
2. 根据配置获取或创建执行器容器
3. 使用 APScheduler 调度任务执行
4. 返回任务 ID 和容器信息

#### 2. TaskDispatcher (任务分发器)

**位置**: [task_dispatcher.py](executor_manager/app/scheduler/task_dispatcher.py)

**主要功能**:
- 分发任务到 Executor 容器
- 解析和准备任务配置
- 处理任务失败和重试

**核心分发流程**:

```python
@staticmethod
async def dispatch(
    task_id: str,
    session_id: str,
    prompt: str,
    config: dict,
    sdk_session_id: str | None = None
) -> None:
    """分发任务到执行器

    工作流程:
    1. 解析配置 (ConfigResolver)
    2. 准备技能文件 (SkillStager)
    3. 准备输入附件 (AttachmentStager)
    4. 获取或创建容器 (ContainerPool)
    5. 更新会话状态为 'running'
    6. 调用 Executor API 执行任务
    7. 异常处理和容器清理
    """
```

#### 3. ContainerPool (容器池)

**位置**: [container_pool.py](executor_manager/app/services/container_pool.py)

**主要功能**:
- 管理 Executor Docker 容器
- 支持临时和持久化容器模式
- 容器生命周期管理

**容器模式**:

##### 临时模式 (Ephemeral)
- 每个任务使用独立容器
- 任务完成后自动销毁
- 适用于一次性任务

##### 持久化模式 (Persistent)
- 容器可被多个任务复用
- 需要手动销毁
- 适用于长期会话

**关键方法**:

```python
async def get_or_create_container(
    session_id: str,
    user_id: str,
    container_mode: str = "ephemeral",
    container_id: str | None = None
) -> tuple[str, str]:
    """获取或创建容器

    Args:
        session_id: 会话 ID
        user_id: 用户 ID
        container_mode: ephemeral | persistent
        container_id: 可选的容器 ID,用于复用

    Returns:
        (executor_url, container_id) 元组

    流程:
    1. 检查容器是否已存在
    2. 创建工作空间 Volume
    3. 启动 Docker 容器
    4. 等待容器就绪
    5. 等待 HTTP 服务就绪
    6. 返回访问 URL 和容器 ID
    """
```

**容器配置**:
- **镜像**: 由 `EXECUTOR_IMAGE` 配置
- **端口映射**: 容器 8000 → 主机随机端口
- **工作空间**: `/workspace` 挂载
- **环境变量**:
  - `ANTHROPIC_AUTH_TOKEN`: Anthropic API Token
  - `ANTHROPIC_BASE_URL`: API Base URL
  - `DEFAULT_MODEL`: 默认模型
  - `WORKSPACE_PATH`: 工作空间路径
  - `USER_ID`: 用户 ID
  - `SESSION_ID`: 会话 ID

#### 4. RunPullService (任务拉取服务)

**位置**: [run_pull_service.py](executor_manager/app/services/run_pull_service.py)

**主要功能**:
- 后台服务,定期拉取待执行任务
- 支持多种调度模式 (immediate/scheduled/nightly)
- 并发控制和租约管理

**调度模式**:

##### 1. Immediate (即时任务)
- 默认启用
- 轮询间隔: 2 秒 (可配置)
- 适用于用户主动触发的任务

##### 2. Scheduled (定时任务)
- 默认启用
- 轮询间隔: 2 秒 (可配置)
- 适用于用户设定特定执行时间的任务

##### 3. Nightly (夜间任务)
- 默认启用
- 时间窗口: UTC 02:00-08:00 (可配置)
- 适用于批量处理和定期维护任务

**工作流程**:

```python
async def poll(schedule_modes: list[str] | None = None) -> None:
    """轮询任务队列

    1. 检查并发限制 (Semaphore)
    2. 调用 Backend 认领任务 (claim_run)
    3. 创建异步任务处理
    4. 解析配置和准备文件
    5. 获取或创建容器
    6. 调用 Executor 执行任务
    7. 更新任务状态
    8. 异常处理和容器清理
    """
```

**并发控制**:
- 使用 `asyncio.Semaphore` 控制并发数
- 默认最大并发: 5 (可配置)
- 任务完成后释放信号量

#### 5. ExecutorClient (执行器客户端)

**位置**: [executor_client.py](executor_manager/app/services/executor_client.py)

**主要功能**:
- 与 Executor 服务通信
- 发送任务执行请求
- 传递追踪 ID

**关键方法**:

```python
async def execute_task(
    executor_url: str,
    session_id: str,
    prompt: str,
    callback_url: str,
    callback_token: str,
    config: dict,
    callback_base_url: str | None = None,
    sdk_session_id: str | None = None
) -> str:
    """调用 Executor 执行任务

    请求格式:
    POST {executor_url}/v1/tasks/execute
    {
        "session_id": "uuid",
        "prompt": "任务描述",
        "callback_url": "http://...",
        "callback_token": "token",
        "callback_base_url": "http://...",
        "config": {...},
        "sdk_session_id": "claude_sdk_id"
    }

    追踪头:
    - X-Request-ID: 请求 ID
    - X-Trace-ID: 追踪 ID
    """
```

### API 接口

#### 1. 创建任务

```http
POST /api/v1/tasks
Content-Type: application/json

{
  "user_id": "user_123",
  "prompt": "请帮我分析这段代码",
  "config": {
    "container_mode": "ephemeral",
    "model": "claude-sonnet-4-20250514"
  },
  "session_id": "optional_session_id"
}

Response:
{
  "task_id": "task_uuid",
  "session_id": "session_uuid",
  "status": "scheduled",
  "executor_url": "http://localhost:12345",
  "container_id": "exec-abc123"
}
```

#### 2. 查询任务状态

```http
GET /api/v1/tasks/{task_id}

Response:
{
  "task_id": "task_uuid",
  "status": "scheduled",
  "next_run_time": "2024-01-22T10:30:00Z"
}
```

#### 3. 查询会话状态

```http
GET /api/v1/sessions/{session_id}

Response:
{
  "session_id": "session_uuid",
  "user_id": "user_123",
  "status": "running",
  "sdk_session_id": "claude_sdk_id",
  "created_at": "2024-01-22T10:00:00Z"
}
```

#### 4. 容器统计

```http
GET /api/v1/executor/stats

Response:
{
  "total_active": 3,
  "persistent_containers": 1,
  "ephemeral_containers": 2,
  "containers": [
    {
      "container_id": "exec-abc123",
      "name": "executor-abc123",
      "status": "running",
      "mode": "ephemeral"
    }
  ]
}
```

---

## ⚙️ Executor

### 概述

**Executor** 是实际执行 Claude Agent 任务的容器化服务,基于 Claude Agent SDK 构建,通过钩子系统实现功能扩展。

### 核心模块

#### 1. AgentExecutor (Agent 执行引擎)

**位置**: [core/engine.py](executor/app/core/engine.py)

**主要功能**:
- 执行 Claude Agent 任务
- 管理钩子生命周期
- 处理工作空间和状态

**执行流程**:

```python
async def execute(prompt: str, config: TaskConfig) -> None:
    """执行 Agent 任务

    流程:
    1. 触发 before_execution 钩子
    2. 设置工作空间环境
    3. 克隆 Git 仓库 (如有)
    4. 准备 MCP 服务器配置
    5. 准备技能文件
    6. 准备输入文件
    7. 创建 Claude Agent
    8. 执行 Agent (同步或流式)
    9. 处理工具调用钩子
    10. 触发 after_execution 钩子
    11. 清理和错误处理
    """
```

**Agent 配置**:
- **Model**: 由 config 指定
- **Max Turns**: 默认 100
- **Custom Instructions**: 支持自定义指令
- **MCP Servers**: 支持多个 MCP 服务器
- **Skills**: 支持加载技能预设

#### 2. 钩子系统

**位置**: [hooks/](executor/app/hooks/)

Executor 使用灵活的钩子系统支持功能扩展。

##### 钩子生命周期

```
before_execution()
    ↓
工作空间初始化
    ↓
Agent 执行开始
    ↓
on_agent_turn() [循环]
    ├── on_tool_call()
    └── on_response()
    ↓
Agent 执行结束
    ↓
after_execution()
```

##### 内置钩子

###### 1. CallbackHook (回调钩子)

**位置**: [hooks/callback.py](executor/app/hooks/callback.py)

**功能**: 将 Agent 执行状态回调到 Executor Manager

**回调事件**:
- `task_started`: 任务开始
- `tool_call`: 工具调用
- `agent_response`: Agent 响应
- `task_completed`: 任务完成
- `task_failed`: 任务失败

**回调格式**:

```json
{
  "event": "tool_call",
  "session_id": "session_uuid",
  "data": {
    "turn": 1,
    "tool_name": "read_file",
    "tool_input": {...},
    "tool_output": {...}
  }
}
```

###### 2. WorkspaceHook (工作空间钩子)

**位置**: [hooks/workspace.py](executor/app/hooks/workspace.py)

**功能**: 管理工作空间文件和状态

**主要操作**:
- 初始化工作空间
- 记录文件变更
- 生成工作空间清单
- 上传到对象存储

###### 3. TodoHook (TODO 钩子)

**功能**: 管理任务待办事项

**操作**:
- 提取 Agent 的 TODO 列表
- 更新 TODO 状态
- 回调 TODO 变更

#### 3. CallbackClient (回调客户端)

**位置**: [core/callback.py](executor/app/core/callback.py)

**功能**: 向 Executor Manager 发送回调

**方法**:

```python
async def send_callback(event: str, data: dict) -> None:
    """发送回调到 Executor Manager

    Args:
        event: 事件类型
        data: 事件数据

    请求格式:
    POST {callback_url}
    Authorization: Bearer {callback_token}
    {
        "event": "tool_call",
        "session_id": "uuid",
        "data": {...}
    }
    """
```

#### 4. UserInputClient (用户输入客户端)

**位置**: [core/user_input.py](executor/app/core/user_input.py)

**功能**: 处理 Agent 需要用户输入的场景

**流程**:
1. Agent 触发用户输入请求
2. 通过 API 创建输入请求记录
3. 等待用户响应 (轮询)
4. 返回用户输入给 Agent

### API 接口

#### 执行任务

```http
POST /v1/tasks/execute
Content-Type: application/json

{
  "session_id": "session_uuid",
  "prompt": "请分析代码",
  "callback_url": "http://executor-manager:8001/api/v1/callback",
  "callback_token": "token",
  "callback_base_url": "http://executor-manager:8001",
  "config": {
    "model": "claude-sonnet-4-20250514",
    "repo_url": "https://github.com/user/repo",
    "git_branch": "main",
    "mcp_config": {...},
    "skill_files": {...},
    "input_files": [...]
  },
  "sdk_session_id": "claude_sdk_id"
}

Response:
{
  "status": "accepted",
  "session_id": "session_uuid"
}
```

---

## 🔄 任务调度流程

### 完整流程图

```
┌──────────┐
│  用户    │
└────┬─────┘
     │ 1. 创建任务
     ▼
┌──────────────┐
│   Backend    │
├──────────────┤
│ 创建 Session │
│ 创建 Run     │
└────┬─────────┘
     │ 2. Session 创建完成
     ▼
┌─────────────────┐
│ Executor Manager│
├─────────────────┤
│ TaskService     │
└────┬────────────┘
     │ 3. 调度任务
     ▼
┌─────────────────┐
│  APScheduler    │
├─────────────────┤
│ 任务队列        │
└────┬────────────┘
     │ 4. 触发调度
     ▼
┌─────────────────┐
│ TaskDispatcher  │
├─────────────────┤
│ 解析配置        │
│ 准备文件        │
└────┬────────────┘
     │ 5. 获取容器
     ▼
┌─────────────────┐
│ ContainerPool   │
├─────────────────┤
│ Docker 操作     │
└────┬────────────┘
     │ 6. 容器就绪
     ▼
┌─────────────────┐
│ ExecutorClient  │
├─────────────────┤
│ HTTP 调用       │
└────┬────────────┘
     │ 7. 发送任务
     ▼
┌─────────────────┐
│   Executor      │
├─────────────────┤
│ AgentExecutor   │
└────┬────────────┘
     │ 8. 执行 Agent
     ▼
┌─────────────────┐
│  Claude Agent   │
├─────────────────┤
│ 工具调用        │
│ 代码执行        │
└────┬────────────┘
     │ 9. 回调状态
     ▼
┌─────────────────┐
│  CallbackHook   │
├─────────────────┤
│ 发送回调        │
└────┬────────────┘
     │ 10. 状态更新
     ▼
┌──────────────────┐
│ Executor Manager │
│ (Callback API)   │
└────┬─────────────┘
     │ 11. 持久化
     ▼
┌──────────────┐
│   Backend    │
├──────────────┤
│ 更新状态     │
│ 记录消息     │
│ 记录工具执行 │
└──────────────┘
```

### 任务状态流转

```
queued (排队)
    ↓
running (运行中)
    ↓
┌───────────────┐
│   completed   │ ← 成功
│   failed      │ ← 失败
└───────────────┘
```

### 重试机制

**配置**:
- `retry_attempts`: 最大重试次数 (默认: 3)
- `retry_delay_seconds`: 重试延迟 (默认: 60 秒)

**触发条件**:
- 容器启动失败
- Executor 服务不可达
- Agent 执行异常
- 回调失败

---

## 🐳 容器管理

### 容器生命周期

#### 1. 创建阶段

```python
# 容器创建参数
container = docker_client.containers.run(
    image="opencowork/executor:latest",
    name=f"executor-{session_id[:8]}",
    environment={
        "ANTHROPIC_AUTH_TOKEN": "...",
        "WORKSPACE_PATH": "/workspace",
        "USER_ID": "user_123",
        "SESSION_ID": "session_uuid"
    },
    volumes={
        workspace_volume: {
            "bind": "/workspace",
            "mode": "rw"
        }
    },
    ports={"8000/tcp": None},  # 随机端口
    detach=True,
    auto_remove=True,
    labels={
        "owner": "executor_manager",
        "session_id": "session_uuid",
        "container_mode": "ephemeral"
    }
)
```

#### 2. 就绪检查

**容器状态检查**:
- 轮询 `container.status`
- 超时时间: 30 秒

**服务健康检查**:
- 轮询 `http://localhost:{port}/health`
- 超时时间: 60 秒
- 间隔: 1 秒

#### 3. 运行阶段

**容器资源**:
- CPU: 无限制 (默认)
- 内存: 无限制 (默认)
- 磁盘: 工作空间 Volume

**网络配置**:
- 端口映射: 容器 8000 → 主机随机端口
- 主机访问: `host.docker.internal` → `host-gateway`

#### 4. 清理阶段

**临时容器**:
- 任务完成后自动停止
- `auto_remove=True` 自动删除

**持久化容器**:
- 保持运行状态
- 可被后续任务复用
- 需要手动清理

### 工作空间管理

**工作空间结构**:
```
/var/lib/opencowork/workspaces/
├── user_{user_id}/
│   └── session_{session_id}/
│       ├── .git/              # Git 仓库
│       ├── .mcp-servers/      # MCP 服务器配置
│       ├── .skills/           # 技能文件
│       ├── input/             # 输入文件
│       └── output/            # 输出文件
```

**Volume 挂载**:
- **主机路径**: `/var/lib/opencowork/workspaces/user_{user_id}/session_{session_id}`
- **容器路径**: `/workspace`
- **模式**: `rw` (读写)

**清理策略**:
- 默认禁用自动清理
- 可配置清理间隔和保留天数
- 支持归档到 S3 对象存储

---

## ⚙️ 配置管理

### Executor Manager 配置

**位置**: [executor_manager/app/core/settings.py](executor_manager/app/core/settings.py)

#### 服务配置

```python
# 服务基本配置
app_name: str = "Executor Manager"
app_version: str = "0.1.0"
host: str = "0.0.0.0"
port: int = 8001
debug: bool = False
```

#### 外部服务

```python
# Backend 服务
backend_url: str = "http://localhost:8000"

# Executor 服务 (默认 URL,实际使用容器动态 URL)
executor_url: str = "http://localhost:8080"

# 回调基础 URL
callback_base_url: str = "http://localhost:8001"
```

#### 调度配置

```python
# 并发控制
max_concurrent_tasks: int = 5

# 任务超时
task_timeout_seconds: int = 3600

# 重试配置
retry_attempts: int = 3
retry_delay_seconds: int = 60

# 安全令牌
callback_token: str = "change-this-token-in-production"
internal_api_token: str = "change-this-token-in-production"
```

#### 任务拉取配置

```python
# 任务拉取开关
task_pull_enabled: bool = True

# 默认拉取间隔
task_pull_interval_seconds: int = 2

# 租约时长
task_claim_lease_seconds: int = 30

# 即时任务队列
task_pull_immediate_enabled: bool = True
task_pull_immediate_interval_seconds: int | None = None  # 使用默认值

# 定时任务队列
task_pull_scheduled_enabled: bool = True
task_pull_scheduled_interval_seconds: int | None = None

# 夜间任务队列
task_pull_nightly_enabled: bool = True
task_pull_nightly_poll_interval_seconds: int = 2
task_pull_nightly_timezone: str = "UTC"
task_pull_nightly_start_hour: int = 2
task_pull_nightly_start_minute: int = 0
task_pull_nightly_window_minutes: int = 360  # 6小时窗口
```

#### Anthropic 配置

```python
# API 认证
anthropic_token: str = ""
anthropic_base_url: str = "https://api.anthropic.com"

# 默认模型
default_model: str = "claude-sonnet-4-20250514"
```

#### 容器配置

```python
# 容器限制
max_executor_containers: int = 10

# Executor 镜像
executor_image: str = "opencowork/executor:latest"
```

#### 工作空间配置

```python
# 工作空间根目录
workspace_root: str = "/var/lib/opencowork/workspaces"

# 清理配置
workspace_cleanup_enabled: bool = False
workspace_cleanup_interval_hours: int = 24
workspace_max_age_hours: int = 24

# 归档配置
workspace_archive_enabled: bool = True
workspace_archive_days: int = 7
workspace_ignore_dot_files: bool = True
```

#### S3 配置

```python
# S3 对象存储
s3_endpoint: str | None = None
s3_access_key: str | None = None
s3_secret_key: str | None = None
s3_region: str = "us-east-1"
s3_bucket: str | None = None
s3_force_path_style: bool = True
```

### Executor 配置

Executor 主要通过环境变量配置,由 Executor Manager 在创建容器时注入:

```bash
# Anthropic API
ANTHROPIC_AUTH_TOKEN=sk-ant-...
ANTHROPIC_BASE_URL=https://api.anthropic.com
DEFAULT_MODEL=claude-sonnet-4-20250514

# 工作空间
WORKSPACE_PATH=/workspace

# 会话信息
USER_ID=user_123
SESSION_ID=session_uuid

# 调试模式
DEBUG=false
```

### 环境变量示例

**.env 示例 (Executor Manager)**:

```bash
# Service
DEBUG=false
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8001

# External Services
BACKEND_URL=http://backend:8000
CALLBACK_BASE_URL=http://executor-manager:8001

# Scheduler
MAX_CONCURRENT_TASKS=5
TASK_TIMEOUT_SECONDS=3600
RETRY_ATTEMPTS=3
RETRY_DELAY_SECONDS=60

# Security
CALLBACK_TOKEN=your-secure-token
INTERNAL_API_TOKEN=your-secure-token

# Task Pull
TASK_PULL_ENABLED=true
TASK_PULL_INTERVAL_SECONDS=2
TASK_CLAIM_LEASE_SECONDS=30

# Task Pull - Immediate Queue
TASK_PULL_IMMEDIATE_ENABLED=true
TASK_PULL_IMMEDIATE_INTERVAL_SECONDS=2

# Task Pull - Scheduled Queue
TASK_PULL_SCHEDULED_ENABLED=true
TASK_PULL_SCHEDULED_INTERVAL_SECONDS=2

# Task Pull - Nightly Queue
TASK_PULL_NIGHTLY_ENABLED=true
TASK_PULL_NIGHTLY_POLL_INTERVAL_SECONDS=2
TASK_PULL_NIGHTLY_TIMEZONE=UTC
TASK_PULL_NIGHTLY_START_HOUR=2
TASK_PULL_NIGHTLY_START_MINUTE=0
TASK_PULL_NIGHTLY_WINDOW_MINUTES=360

# Anthropic
ANTHROPIC_AUTH_TOKEN=sk-ant-api-key
ANTHROPIC_BASE_URL=https://api.anthropic.com
DEFAULT_MODEL=claude-sonnet-4-20250514

# Container
MAX_EXECUTOR_CONTAINERS=10
EXECUTOR_IMAGE=opencowork/executor:latest

# Workspace
WORKSPACE_ROOT=/var/lib/opencowork/workspaces
WORKSPACE_CLEANUP_ENABLED=false
WORKSPACE_ARCHIVE_ENABLED=true

# S3
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_REGION=us-east-1
S3_BUCKET=your-bucket
S3_FORCE_PATH_STYLE=true
```

---

## 🔌 钩子系统

### 钩子接口

**位置**: [executor/app/hooks/base.py](executor/app/hooks/base.py)

```python
class Hook(ABC):
    """钩子基类"""

    async def before_execution(self, config: TaskConfig) -> None:
        """任务执行前调用"""
        pass

    async def on_agent_turn(self, turn: int, state: AgentState) -> None:
        """每轮 Agent 交互时调用"""
        pass

    async def on_tool_call(
        self,
        turn: int,
        tool_name: str,
        tool_input: dict,
        tool_output: Any
    ) -> None:
        """工具调用时调用"""
        pass

    async def on_response(self, turn: int, response: str) -> None:
        """Agent 响应时调用"""
        pass

    async def after_execution(self, success: bool, error: str | None) -> None:
        """任务执行后调用"""
        pass
```

### 自定义钩子示例

```python
from app.hooks.base import Hook
from app.schemas.request import TaskConfig

class MyCustomHook(Hook):
    """自定义钩子示例"""

    async def before_execution(self, config: TaskConfig) -> None:
        print("任务开始执行")

    async def on_tool_call(
        self,
        turn: int,
        tool_name: str,
        tool_input: dict,
        tool_output: Any
    ) -> None:
        print(f"工具调用: {tool_name}")
        # 记录到外部系统
        await self.log_to_external_system(tool_name, tool_input, tool_output)

    async def after_execution(self, success: bool, error: str | None) -> None:
        if success:
            print("任务执行成功")
        else:
            print(f"任务执行失败: {error}")
```

### 钩子注册

```python
# 在 task.py 中注册钩子
hooks = [
    WorkspaceHook(),
    CallbackHook(client=callback_client),
    MyCustomHook(),  # 添加自定义钩子
]

executor = AgentExecutor(
    session_id=req.session_id,
    hooks=hooks,
    user_input_client=user_input_client
)
```

---

## 🚀 部署运行

### 本地开发

#### 1. 启动 Executor Manager

```bash
cd executor_manager

# 安装依赖
uv sync

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 启动服务
uv run python -m app.main

# 或使用 uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

#### 2. 构建 Executor 镜像

```bash
cd executor

# 构建 Docker 镜像
docker build -t opencowork/executor:latest -f docker/executor/Dockerfile .
```

#### 3. 访问服务

- **Executor Manager API**: http://localhost:8001/docs
- **Health Check**: http://localhost:8001/api/v1/health

### Docker Compose 部署

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  backend:
    image: opencowork/backend:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/postgres
    depends_on:
      - postgres

  executor-manager:
    image: opencowork/executor-manager:latest
    ports:
      - "8001:8001"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - workspace-data:/var/lib/opencowork/workspaces
    environment:
      - BACKEND_URL=http://backend:8000
      - CALLBACK_BASE_URL=http://executor-manager:8001
      - ANTHROPIC_AUTH_TOKEN=${ANTHROPIC_AUTH_TOKEN}
      - EXECUTOR_IMAGE=opencowork/executor:latest
      - WORKSPACE_ROOT=/var/lib/opencowork/workspaces
    depends_on:
      - backend

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
  workspace-data:
```

**启动**:

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f executor-manager

# 停止服务
docker-compose down
```

### 生产部署建议

#### 1. 资源限制

为容器配置资源限制:

```python
container = docker_client.containers.run(
    ...,
    mem_limit="4g",
    cpu_count=2,
    ...
)
```

#### 2. 监控和日志

- 启用结构化日志
- 配置日志聚合 (如 ELK Stack)
- 设置告警规则

#### 3. 高可用

- 部署多个 Executor Manager 实例
- 使用负载均衡器
- 配置健康检查

#### 4. 安全加固

- 使用安全的 Token
- 启用 HTTPS
- 限制容器权限
- 定期更新镜像

#### 5. 性能优化

- 调整并发限制
- 配置合适的超时时间
- 优化 Docker 镜像大小
- 使用镜像缓存

---

## 📊 监控和调试

### 日志查看

#### Executor Manager 日志

```bash
# 查看服务日志
docker logs -f executor-manager

# 查看特定会话日志 (通过 grep)
docker logs executor-manager | grep "session_id=xxx"
```

#### Executor 容器日志

```bash
# 列出所有 Executor 容器
docker ps --filter "label=owner=executor_manager"

# 查看特定容器日志
docker logs -f executor-abc123
```

### 健康检查

#### Executor Manager

```bash
curl http://localhost:8001/api/v1/health
```

#### Executor

```bash
curl http://localhost:{port}/health
```

### 容器统计

```bash
curl http://localhost:8001/api/v1/executor/stats
```

### 调试模式

启用调试模式:

```bash
# Executor Manager
DEBUG=true uvicorn app.main:app --reload

# Executor (通过环境变量)
docker run -e DEBUG=true opencowork/executor:latest
```

---

## 🔗 相关链接

- **Claude Agent SDK**: https://github.com/anthropics/claude-agent-sdk
- **FastAPI**: https://fastapi.tiangolo.com/
- **APScheduler**: https://apscheduler.readthedocs.io/
- **Docker SDK**: https://docker-py.readthedocs.io/

---

## 📝 总结

Executor 系统通过 **Executor Manager** 和 **Executor** 两个组件的配合,实现了灵活、可扩展的 AI Agent 任务执行平台:

### 核心优势

1. 🔄 **灵活调度**: 支持即时、定时、夜间多种调度模式
2. 🐳 **容器隔离**: Docker 容器提供安全的执行环境
3. 🔌 **可扩展性**: 钩子系统支持功能扩展
4. 📊 **实时反馈**: 回调机制提供实时执行状态
5. 🔁 **高可用**: 支持重试和并发控制
6. 📈 **可监控**: 完善的日志和监控体系

### 适用场景

- 🤖 AI Agent 任务自动化
- 📊 代码分析和审查
- 🔧 自动化运维任务
- 📝 文档生成和处理
- 🧪 自动化测试执行

---

**文档更新时间**: 2024-01-22
**版本**: v1.0.0
