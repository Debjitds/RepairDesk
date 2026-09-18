import { TOOLS, executeTool, toolManifest } from '@/mcp/tools'

/**
 * Native WebMCP registration layer.
 *
 * Registers the EXISTING RepairDesk tools (src/mcp/tools.ts) through the
 * browser's native WebMCP API (`document.modelContext.registerTool`), so
 * that WebMCP-capable agents and Chrome's WebMCP Tool Inspector can discover
 * and execute them on the authenticated application page.
 *
 * There is no duplicate business logic here: every registered handler is a
 * thin wrapper that delegates to the existing `executeTool()` layer, which
 * enforces authentication (Supabase session), role-based authorization,
 * and Supabase RLS/business RPCs, and writes audit records.
 *
 * Because the browser registry has no per-role filtering, all tools are
 * registered with the current session; role enforcement happens at execute
 * time inside `executeTool()` (FORBIDDEN) exactly as in the JSON-RPC bridge.
 */

const MUTATING_TOOLS = new Set(['create_repair_ticket', 'update_repair_status', 'add_repair_note'])

async function mcpContent(outcome: Awaited<ReturnType<typeof executeTool>>) {
  if (!outcome.success) {
    // Surface authorization/validation failures as MCP-shaped error content
    // (same convention as the JSON-RPC bridge) so the agent sees the code
    // and message instead of a generic script error.
    return {
      content: [
        {
          type: 'text',
          text: `ERROR [${outcome.error?.code ?? 'INTERNAL_ERROR'}]: ${outcome.error?.message ?? 'Tool execution failed'}`,
        },
      ],
      isError: true,
    }
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(outcome.result, null, 2) }],
    isError: false,
  }
}

let registrationPromise: Promise<boolean> | null = null

/** Feature-detect the native WebMCP API on this document. */
export function nativeWebmcpAvailable(): boolean {
  return typeof document !== 'undefined' && typeof document.modelContext?.registerTool === 'function'
}

/**
 * Idempotently register all existing RepairDesk tools with the browser's
 * native WebMCP registry. Duplicate registration is a no-op (Chrome rejects
 * duplicate tool names, e.g. under React StrictMode double-mount).
 *
 * Tool availability across the auth lifecycle:
 * - Registration happens once per page load; handlers resolve the CURRENT
 *   Supabase session on every call, so login/logout/session-refresh/role
 *   changes are enforced per execution rather than per registration.
 * - Signed-out calls fail with UNAUTHENTICATED inside executeTool(); no
 *   anonymous or unauthenticated tool access exists.
 */
export function registerNativeWebmcpTools(): Promise<boolean> {
  if (registrationPromise) return registrationPromise
  registrationPromise = (async () => {
    const mc = document.modelContext
    if (!mc || typeof mc.registerTool !== 'function') return false

    for (const tool of TOOLS) {
      await mc.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: {
          title: tool.name,
          readOnlyHint: !MUTATING_TOOLS.has(tool.name),
          destructiveHint: false,
          idempotentHint: !MUTATING_TOOLS.has(tool.name),
        },
        execute: async (input) => mcpContent(await executeTool(tool.name, input ?? {})),
      })
    }
    return true
  })().catch((err) => {
    // Allow a later retry if registration failed (e.g. transient issue)
    registrationPromise = null
    console.warn('[webmcp] native tool registration failed:', err)
    return false
  })
  return registrationPromise
}

/** Manifest of tools registered natively (for debugging/inspection). */
export function nativeWebmcpManifest() {
  return toolManifest()
}
