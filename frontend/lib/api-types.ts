/**
 * API Types matching backend schemas
 * Based on backend/app/schemas
 */

// ============ Response Wrapper ============

export interface ApiResponse<T> {
  data: T;
  message: string;
  code?: string;
}

// ============ Session Types ============

export interface TaskConfig {
  repo_url?: string | null;
  git_branch: string;
  mcp_config: Record<string, unknown>;
  skill_files: Record<string, unknown>;
}

// ============ Execution Types ============

export type TodoStatus = "pending" | "in_progress" | "completed";

export interface TodoItem {
  content: string;
  status: TodoStatus;
  active_form: string | null;
}

export type McpServerStatus = "connected" | "disconnected" | "error";

export interface McpStatusItem {
  server_name: string;
  status: McpServerStatus;
  message: string | null;
}

export type FileChangeStatus = "added" | "modified" | "deleted" | "renamed";

export interface FileChange {
  path: string;
  status: FileChangeStatus;
  added_lines: number;
  deleted_lines: number;
  diff: string | null;
  old_path: string | null;
}

export interface WorkspaceState {
  repository: string | null;
  branch: string | null;
  total_added_lines: number;
  total_deleted_lines: number;
  file_changes: FileChange[];
  last_change: string;
}

export type ArtifactType =
  | "text"
  | "code_diff"
  | "image"
  | "ppt"
  | "pdf"
  | "markdown"
  | "json";

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content?: string;
  url?: string;
  metadata?: {
    language?: string;
    size?: number;
    format?: string;
  };
  created_at: string;
}

export interface SkillUse {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  duration?: number;
  created_at: string;
}

export interface StatePatch {
  todos?: TodoItem[];
  mcp_status?: McpStatusItem[];
  workspace_state?: WorkspaceState;
  artifacts?: Artifact[];
  skills_used?: SkillUse[];
  current_step?: string;
}

export type ExecutionStatus = "accepted" | "running" | "completed" | "failed";

export interface NewMessage {
  title: string;
}

export interface ExecutionSession {
  session_id: string;
  time: string;
  status: ExecutionStatus;
  progress: number;
  new_message?: NewMessage;
  state_patch: StatePatch;
  task_name?: string;
  user_prompt?: string;
}

export interface Session {
  session_id: string; // UUID
  user_id: string;
  sdk_session_id?: string | null;
  config_snapshot?: Record<string, unknown> | null;
  workspace_archive_url?: string | null;
  status: string;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface SessionCreateRequest {
  user_id: string;
  config?: TaskConfig | null;
}

export interface SessionUpdateRequest {
  status?: string | null;
  sdk_session_id?: string | null;
  workspace_archive_url?: string | null;
}

// ============ Message Types ============

export interface Message {
  id: number;
  role: string;
  content: Record<string, unknown>;
  text_preview?: string | null;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

// ============ Tool Execution Types ============

export interface ToolExecution {
  id: number;
  session_id: string; // UUID
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: string | null;
  status: string;
  error_message?: string | null;
  started_at: string; // ISO datetime
  completed_at?: string | null;
  created_at: string; // ISO datetime
}

// ============ Usage Types ============

export interface Usage {
  total_cost_usd?: number | null;
  total_input_tokens?: number | null;
  total_output_tokens?: number | null;
  total_duration_ms?: number | null;
}

// ============ Search Result Types ============

export interface SearchResultTask {
  id: string; // session_id
  title: string;
  status: string;
  timestamp: string;
  type: "task";
}

export interface SearchResultProject {
  id: string;
  name: string;
  taskCount?: number;
  type: "project";
}

export interface SearchResultMessage {
  id: number;
  content: string;
  chatId: string; // session_id
  timestamp: string;
  type: "message";
}

export type SearchResult =
  | SearchResultTask
  | SearchResultProject
  | SearchResultMessage;

// ============ User Types ============

export interface UserProfile {
  id: string;
  email: string;
  avatar?: string;
  plan: "free" | "pro" | "team";
  planName: string;
}

export interface UserCredits {
  total: number | string;
  free: number | string;
  dailyRefreshCurrent: number;
  dailyRefreshMax: number;
  refreshTime: string;
}

// ============ Skill Types ============

export interface Skill {
  id: string;
  nameKey: string;
  descKey: string;
  source: string;
}

// ============ Project Types ============

export interface ProjectItem {
  id: string;
  name: string;
  icon?: string;
  taskCount: number;
}

export interface TaskHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  status: "pending" | "running" | "completed" | "failed";
  projectId?: string;
}

// ============ Frontend Chat Types ============

export type ConnectedTool = {
  id: string;
  name: string;
  icon: string;
};

export type MessageRole = "user" | "assistant" | "system";

export type MessageStatus =
  | "sending"
  | "sent"
  | "streaming"
  | "completed"
  | "failed";

export type ToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: "pending" | "running" | "completed" | "failed";
};

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  timestamp?: string;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    duration?: number;
    toolCalls?: ToolCall[];
  };
  parentId?: string;
};

export type ChatSession = {
  id: string;
  taskId: string;
  title: string;
  messages: ChatMessage[];
  status: "pending" | "running" | "completed" | "failed"; // TaskStatus
  model: string;
  createdAt: string;
  updatedAt: string;
};

export type ModelInfo = {
  id: string;
  name: string;
  description: string;
  icon: string;
  provider: "anthropic" | "openai" | "google";
};

export type UsageStats = {
  credits: number;
  tokensUsed: number;
  duration: number;
  todayUsage: number;
  weekUsage: number;
  monthUsage: number;
};

export type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
};

// ============ Workspace Types ============

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
  url?: string;
  mimeType?: string;
}
