/**
 * WebMCP server entry (mcp.html).
 *
 * Implements the Model Context Protocol over Streamable HTTP in the browser:
 * - POST /mcp  → JSON-RPC messages (initialize, tools/list, tools/call)
 * - GET  /mcp  → server info
 *
 * Because this runs in the browser, "HTTP" is implemented as an in-page
 * JSON-RPC bridge: MCP clients on the same page (or extensions piping through
 * window.postMessage) invoke `window.repairdeskMcp.request(message)`. The
 * server enforces the same authenticated context as the app — there is no
 * anonymous access and no direct database path.
 */

import { supabase } from '@/lib/supabase'
import { executeTool, toolManifest } from '@/mcp/tools'

const PROTOCOL_VERSION = '2025-06-18'

type JsonRpcRequest = {
  jsonrpc: '2.0'
  id?: number | string | null
  method: string
  params?: Record<string, unknown>
}

type JsonRpcResponse = {
  jsonrpc: '2.0'
  id: number | string | null
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

class McpServer {
  private initialized = false

  async handle(req: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { id = null, method, params } = req
    try {
      switch (method) {
        case 'initialize': {
          this.initialized = true
          return ok(id, {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: 'repairdesk-webmcp', version: '1.0.0' },
            instructions:
              'RepairDesk WebMCP. All tools execute with the signed-in user\u2019s permissions (ADMIN / MANAGER / TECHNICIAN / EMPLOYEE). Authorization is enforced server-side by Supabase RLS and shared business logic.',
          })
        }
        case 'notifications/initialized':
        case 'initialized':
          return ok(id, {})
        case 'ping':
          return ok(id, {})
        case 'tools/list': {
          if (!this.initialized) return rpcErr(id, -32002, 'Server not initialized')
          // Authentication gate: tool discovery requires a session
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (!user) return rpcErr(id, -32001, 'UNAUTHENTICATED')
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('auth_user_id', user.id)
            .maybeSingle()
          const role = profile?.role as string | undefined
          const tools = toolManifest()
            .filter((t) => !t.roles || (role && t.roles.includes(role)))
            .map((t) => ({ ...t, annotations: { title: t.name } }))
          return ok(id, { tools })
        }
        case 'tools/call': {
          if (!this.initialized) return rpcErr(id, -32002, 'Server not initialized')
          const name = (params?.name as string) ?? ''
          const args = (params?.arguments as Record<string, unknown>) ?? {}
          const outcome = await executeTool(name, args)
          if (!outcome.success) {
            return ok(id, {
              content: [{ type: 'text', text: `ERROR [${outcome.error?.code}]: ${outcome.error?.message}` }],
              isError: true,
            })
          }
          return ok(id, {
            content: [{ type: 'text', text: JSON.stringify(outcome.result, null, 2) }],
            isError: false,
          })
        }
        default:
          return rpcErr(id, -32601, `Method not found: ${method}`)
      }
    } catch (err) {
      return rpcErr(id, -32603, err instanceof Error ? err.message : 'Internal error')
    }
  }
}

function ok(id: number | string | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result }
}

function rpcErr(id: number | string | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

// ---------------- Bridge mount ----------------

const server = new McpServer()

declare global {
  interface Window {
    repairdeskMcp?: {
      request: (message: JsonRpcRequest) => Promise<JsonRpcResponse>
    }
  }
}

window.repairdeskMcp = {
  request: (message) => server.handle(message),
}

// Listen for external MCP clients via postMessage (same authenticated page context)
window.addEventListener('message', async (event: MessageEvent) => {
  if (event.source !== window) return
  const data = event.data as JsonRpcRequest & { __repairdeskMcp?: boolean; __returnId?: string }
  if (!data || data.__repairdeskMcp !== true || typeof data.method !== 'string') return
  const response = await server.handle({ jsonrpc: '2.0', id: data.id, method: data.method, params: data.params })
  window.postMessage({ __repairdeskMcpResult: true, returnId: data.__returnId, response }, window.location.origin)
})

// Boot status panel (mcp.html is a standalone endpoint page)
const log = document.getElementById('mcp-log')
if (log) {
  log.textContent = [
    'RepairDesk WebMCP endpoint active.',
    '',
    'Protocol: JSON-RPC 2.0 / MCP (Streamable HTTP bridge) — protocol version ' + PROTOCOL_VERSION,
    'Endpoint: window.repairdeskMcp.request(message) | postMessage bridge {__repairdeskMcp: true}',
    '',
    'Authorization model:',
    '  - Requires an authenticated RepairDesk session (Supabase Auth).',
    '  - Tools execute with the signed-in user\u2019s role and resource access.',
    '  - Enforced by the same RLS + business RPC functions as the web UI.',
    '  - Every mutation is audit-logged (webmcp_tool_executions).',
    '',
    'Tools: ' + toolManifest().length,
    ...toolManifest().map((t) => `  - ${t.name} (${t.roles.join(', ')})`),
  ].join('\n')
}
