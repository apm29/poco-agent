import { ExecutionSession, FileNode, ChatMessage } from "../api-types";
import { simulateSessionProgress } from "@/app/[lng]/(chat)/model/execution-mocks";

const MOCK_FILES: FileNode[] = [
  {
    id: "folder-1",
    name: "测试文件",
    type: "folder",
    path: "/test",
    children: [
      {
        id: "file-pdf-3",
        name: "arXiv 深度学习论文.pdf",
        type: "file",
        path: "/test/arxiv-2601-07708.pdf",
        url: "https://arxiv.org/pdf/2601.07708",
        mimeType: "application/pdf",
      },
      {
        id: "file-docx-1",
        name: "Word文档示例.docx",
        type: "file",
        path: "/test/sample.docx",
        url: "https://philfan-pic.oss-cn-beijing.aliyuncs.com/test/doc.docx",
        mimeType: "application/msword",
      },
      {
        id: "file-xlsx-1",
        name: "Excel表格示例.xlsx",
        type: "file",
        path: "/test/sample.xlsx",
        url: "https://philfan-pic.oss-cn-beijing.aliyuncs.com/test/xls.xlsx",
        mimeType: "application/vnd.ms-excel",
      },
      {
        id: "file-pptx-1",
        name: "PowerPoint演示文稿.ppt",
        type: "file",
        path: "/test/presentation.ppt",
        url: "https://philfan-pic.oss-cn-beijing.aliyuncs.com/test/ppt.pptx",
        mimeType: "application/vnd.ms-powerpoint",
      },
      {
        id: "file-image-1",
        name: "示例图片1.jpg",
        type: "file",
        path: "/test/image1.jpg",
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        mimeType: "image/jpeg",
      },
    ],
  },
];

export const chatApi = {
  getSession: async (
    sessionId: string,
    currentProgress: number = 0,
  ): Promise<ExecutionSession> => {
    // In a real app: return fetchApi<ExecutionSession>(`/chat/sessions/${sessionId}`);

    // Using the existing mock simulation logic
    return new Promise((resolve) => {
      setTimeout(() => {
        const session = simulateSessionProgress(sessionId, currentProgress);
        resolve(session);
      }, 300);
    });
  },

  /**
   * 创建新的执行会话 (在新会话页面调用)
   */
  createSession: async (prompt: string): Promise<ExecutionSession> => {
    console.log("[Mock API] Creating new session with prompt:", prompt);

    // 模拟网络延迟
    return new Promise((resolve) => {
      setTimeout(() => {
        const sessionId = Date.now().toString();
        // 模拟创建出的新 Session
        const session = simulateSessionProgress(sessionId, 0);
        session.user_prompt = prompt;
        session.task_name = prompt.slice(0, 30);
        console.log("[Mock API] Session created:", sessionId);
        resolve(session);
      }, 800);
    });
  },

  /**
   * 在已有会话中发送新消息
   */
  sendMessage: async (sessionId: string, content: string): Promise<void> => {
    console.log(`[Mock API] Sending message to session ${sessionId}:`, content);

    // 模拟网络延迟
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[Mock API] Message delivered to ${sessionId}`);
        resolve();
      }, 500);
    });
  },

  /**
   * 获取会话消息列表 (目前返回 Mock 的 AI 回复)
   */
  getMessages: async (
    sessionId: string,
    userMessageId?: string,
  ): Promise<ChatMessage[]> => {
    console.log(
      `[Mock API] Fetching messages for session: ${sessionId}${userMessageId ? `, triggered by: ${userMessageId}` : ""}`,
    );

    // 模拟网络延迟和生成思考过程
    return new Promise((resolve) => {
      setTimeout(() => {
        const reply: ChatMessage = {
          id: `msg-reply-${Date.now()}`,
          role: "assistant",
          content:
            "我已经收到您的指令，正在分析当前工作区的上下文。根据您的要求，我将启动相应的自动化流程。您可以关注左侧的任务清单来查看进度。",
          status: "completed",
          timestamp: new Date().toISOString(),
          metadata: {
            model: "claude-sonnet-4.5",
            tokensUsed: 156,
            duration: 1200,
          },
        };
        console.log(`[Mock API] Messages delivered for session ${sessionId}`);
        resolve([reply]);
      }, 1500);
    });
  },

  /**
   * 获取工作区文件列表 (目前返回 Mock 数据)
   */
  getFiles: async (sessionId?: string): Promise<FileNode[]> => {
    console.log("[Mock API] Fetching workspace files for session:", sessionId);
    // 模拟网络延迟
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_FILES), 300);
    });
  },
};
