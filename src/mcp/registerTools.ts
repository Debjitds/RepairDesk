import { TOOLS, executeTool, type McpTool } from '@/mcp/tools'
import type { AppRole } from '@/types'

const MUTATING_TOOLS = new Set(['create_repair_ticket', 'update_repair_status', 'add_repair_note'])

async function mcpContent(outcome: Awaited<ReturnType<typeof executeTool>>) {
  if (!outcome.success) {
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
let registeredRole: AppRole | null = null
let activeController: AbortController | null = null

export function nativeWebmcpAvailable(): boolean {
  return typeof document !== 'undefined' && typeof document.modelContext?.registerTool === 'function'
}

/**
 * Role → tool allow-list resolution (single source of truth).
 * DENY-by-default: a tool is discoverable only when it declares an explicit
 * non-empty `roles` array containing the user's role. "roles omitted" never
 * means "all roles". Each tool name appears at most once per role.
 */
export function toolsForRole(role: AppRole): McpTool[] {
  const seen = new Set<string>()
  const list: McpTool[] = []
  for (const tool of TOOLS) {
    if (!tool.roles || tool.roles.length === 0) continue
    if (!tool.roles.includes(role)) continue
    if (seen.has(tool.name)) continue
    seen.add(tool.name)
    list.push(tool)
  }
  return list
}

function abortActiveRegistration() {
  // Native WebMCP: aborting the registration AbortSignal unregisters the tools
  // added with it, so no stale tools from the previous role/session remain.
  activeController?.abort()
  activeController = null
}

export function registerNativeWebmcpTools(role: AppRole): Promise<boolean> {
  if (registrationPromise && registeredRole === role) return registrationPromise
  // Login / role change / session change on the same page: drop the previous
  // role's registrations before registering the new set.
  abortActiveRegistration()
  registeredRole = role
  const controller = new AbortController()
  activeController = controller
  registrationPromise = (async () => {
    const mc = document.modelContext
    if (!mc || typeof mc.registerTool !== 'function') return false

    const toolsToRegister = toolsForRole(role)

    for (const tool of toolsToRegister) {
      if (controller.signal.aborted) return false
      try {
        await mc.registerTool(
          {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            annotations: {
              title: tool.name,
              readOnlyHint: !MUTATING_TOOLS.has(tool.name),
              destructiveHint: false,
              idempotentHint: !MUTATING_TOOLS.has(tool.name),
            },
            // Handlers still delegate to executeTool(): authentication,
            // role gating, business rules, and Supabase RLS remain enforced
            // at execution time independently of what is registered here.
            execute: async (input) => mcpContent(await executeTool(tool.name, input ?? {})),
          },
          { signal: controller.signal },
        )
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('Duplicate tool name')) {
          continue
        }
        console.warn(`[webmcp] failed to register ${tool.name}:`, err)
      }
    }
    return true
  })().catch((err) => {
    registrationPromise = null
    registeredRole = null
    activeController = null
    console.warn('[webmcp] native tool registration failed:', err)
    return false
  })
  return registrationPromise
}

export function resetRegistration() {
  // Sign-out: unregister everything so the next session starts from a clean list.
  abortActiveRegistration()
  registrationPromise = null
  registeredRole = null
}

/** Role-scoped discovery manifest derived from the same resolution the native
 * registration uses (kept in sync with toolsForRole — no separate matrix). */
export function nativeWebmcpManifest(role: AppRole) {
  return toolsForRole(role).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
    roles: [...t.roles],
  }))
}
