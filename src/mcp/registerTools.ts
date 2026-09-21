import { TOOLS, executeTool, toolManifest } from '@/mcp/tools'
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

export function nativeWebmcpAvailable(): boolean {
  return typeof document !== 'undefined' && typeof document.modelContext?.registerTool === 'function'
}

function getToolsForRole(role: AppRole) {
  return TOOLS.filter((t) => {
    if (!t.roles) return true
    return t.roles.includes(role)
  })
}

export function registerNativeWebmcpTools(role: AppRole): Promise<boolean> {
  if (registrationPromise && registeredRole === role) return registrationPromise
  registeredRole = role
  registrationPromise = (async () => {
    const mc = document.modelContext
    if (!mc || typeof mc.registerTool !== 'function') return false

    const toolsToRegister = getToolsForRole(role)

    for (const tool of toolsToRegister) {
      try {
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
    console.warn('[webmcp] native tool registration failed:', err)
    return false
  })
  return registrationPromise
}

export function resetRegistration() {
  registrationPromise = null
  registeredRole = null
}

export function nativeWebmcpManifest(role?: AppRole) {
  const manifest = toolManifest()
  if (!role) return manifest
  return manifest.filter((m) => {
    if (!m.roles || m.roles.length === 0) return true
    return m.roles.includes(role)
  })
}
