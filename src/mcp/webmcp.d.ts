/**
 * Ambient typings for the native WebMCP browser API
 * (W3C WebML CG draft: https://webmachinelearning.github.io/webmcp/).
 *
 * Shipping behind `#enable-webmcp-testing` in Chromium 146+; the surface is
 * `document.modelContext` with registerTool / getTools / executeTool /
 * ontoolchange. Verify with feature detection, never assume presence.
 */

interface WebMcpToolAnnotations {
  title?: string
  readOnlyHint?: boolean
  destructiveHint?: boolean
  idempotentHint?: boolean
  openWorldHint?: boolean
}

/** Tool descriptor passed to registerTool(). */
interface WebMcpToolDescriptor {
  name: string
  description: string
  inputSchema?: object
  annotations?: WebMcpToolAnnotations
  execute: (input: unknown, context: { signal: AbortSignal }) => Promise<unknown> | unknown
}

interface WebMcpRegisterOptions {
  signal?: AbortSignal
}

/** Tool object returned by getTools() (executable handle). */
interface WebMcpRegisteredTool {
  name: string
  description: string
  inputSchema?: object
  title?: string
  origin?: string
  window?: unknown
}

interface WebMcpToolChangeEvent extends Event {
  toolName?: string
}

interface ModelContext extends EventTarget {
  registerTool(
    tool: WebMcpToolDescriptor,
    options?: WebMcpRegisterOptions,
  ): Promise<undefined>
  getTools(): Promise<WebMcpRegisteredTool[]>
  executeTool(
    tool: WebMcpRegisteredTool,
    inputArguments: string,
  ): Promise<unknown>
  ontoolchange: ((event: WebMcpToolChangeEvent) => void) | null
}

interface Document {
  readonly modelContext?: ModelContext
}
