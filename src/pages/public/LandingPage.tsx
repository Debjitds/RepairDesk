import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/primitives'

/**
 * Landing page per Stitch `landingpage.html`:
 * WebGL dotted interactive background, sticky brutalist nav, hero with
 * terminal telemetry panel, product telemetry strip, feature cards, footer.
 */
function DotGridCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return

    const vs = `attribute vec2 a_position; varying vec2 v_texCoord;
void main(){ v_texCoord = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }`
    const fs = `precision highp float;
varying vec2 v_texCoord; uniform float u_time; uniform vec2 u_resolution; uniform vec2 u_mouse;
void main(){
    vec2 uv = v_texCoord; vec2 pixelCoords = uv * u_resolution;
    float spacing = 24.0;
    vec2 gridPos = mod(pixelCoords, spacing);
    vec2 cellCenter = floor(pixelCoords / spacing) * spacing + spacing * 0.5;
    float dist = distance(u_mouse, cellCenter);
    float radius = 120.0;
    float influence = smoothstep(radius, 0.0, dist);
    vec2 dir = normalize(cellCenter - u_mouse);
    float displacement = pow(influence, 1.5) * 12.0;
    vec2 offset = dir * displacement;
    vec2 dotCenter = cellCenter + offset;
    float dotDist = distance(pixelCoords, dotCenter);
    float dotSize = 1.1;
    float alpha = smoothstep(dotSize + 0.8, dotSize, dotDist);
    vec3 dotColor = vec3(0.08, 0.08, 0.08);
    float pulse = 0.04 * sin(u_time * 0.5 + cellCenter.x * 0.01 + cellCenter.y * 0.01);
    float finalAlpha = alpha * (0.32 + pulse);
    gl_FragColor = vec4(dotColor, finalAlpha);
}`

    function cs(type: number, src: string) {
      const s = gl!.createShader(type)!
      gl!.shaderSource(s, src)
      gl!.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs))
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes = gl.getUniformLocation(prog, 'u_resolution')
    const uMouse = gl.getUniformLocation(prog, 'u_mouse')

    const canvasEl: HTMLCanvasElement = canvas
    const ctx: WebGLRenderingContext = gl
    function syncSize() {
      canvasEl.width = window.innerWidth
      canvasEl.height = window.innerHeight
    }
    window.addEventListener('resize', syncSize)
    syncSize()

    const mouse = { x: canvasEl.width / 2, y: canvasEl.height / 2 }
    const onMove = (e: MouseEvent) => {
      const rect = canvasEl.getBoundingClientRect()
      if (rect.width && rect.height) {
        const nx = (e.clientX - rect.left) / rect.width
        const ny = 1.0 - (e.clientY - rect.top) / rect.height
        mouse.x = nx * canvasEl.width
        mouse.y = ny * canvasEl.height
      }
    }
    window.addEventListener('mousemove', onMove)

    let raf = 0
    function render(t: number) {
      ctx.viewport(0, 0, canvasEl.width, canvasEl.height)
      if (uTime) ctx.uniform1f(uTime, t * 0.001)
      if (uRes) ctx.uniform2f(uRes, canvasEl.width, canvasEl.height)
      if (uMouse) ctx.uniform2f(uMouse, mouse.x, mouse.y)
      ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(render)
    }
    render(0)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', syncSize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return <canvas ref={ref} className="fixed inset-0 w-full h-full pointer-events-none -z-10" aria-hidden="true" />
}

export default function LandingPage() {
  return (
    <div className="antialiased relative min-h-screen selection:bg-signal-orange selection:text-white">
      <DotGridCanvas />

      {/* Sticky brutalist top nav */}
      <header className="bg-surface sticky top-0 w-full z-50 border-b-[3px] border-primary">
        <div className="flex justify-between items-center h-20 px-4 md:px-10 max-w-[1400px] mx-auto">
          <Link className="flex items-center gap-2 group" to="/">
            <Icon name="precision_manufacturing" className="text-[32px] text-primary select-none leading-none" />
            <span className="font-headline font-black text-2xl tracking-tighter uppercase text-primary">
              RepairDesk
            </span>
            <span className="hidden sm:inline-block font-mono text-[10px] bg-electric-yellow border border-primary px-1.5 py-0.5 ml-1 font-bold">
              MCP v1.2
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 font-headline font-bold text-xs tracking-wider uppercase">
            <a className="px-4 py-2 border-b-[3px] border-signal-orange text-primary transition-colors flex items-center gap-1.5" href="#platform">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-orange" />
              Platform
            </a>
            <a className="px-4 py-2 text-primary hover:text-signal-orange transition-colors" href="#features">Features</a>
            <a className="px-4 py-2 text-primary hover:text-signal-orange transition-colors flex items-center gap-1" href="#webmcp">
              WebMCP
              <span className="font-mono text-[9px] bg-primary text-electric-yellow px-1 py-0.2">AGENT API</span>
            </a>
            <a className="px-4 py-2 text-primary hover:text-signal-orange transition-colors" href="#workflow">Workflow</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link className="font-headline font-bold text-xs uppercase px-3 py-2 text-primary hover:text-signal-orange transition-colors" to="/auth">
              Login
            </Link>
            <Link
              className="neo-btn bg-signal-orange text-white border-2 border-primary shadow-neo font-headline text-xs tracking-wider uppercase font-bold px-5 py-2.5 flex items-center gap-1.5 hover:bg-signal-orange-dark"
              to="/auth"
            >
              Get Started
              <Icon name="arrow_forward" className="text-sm" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 md:px-10 max-w-[1400px] mx-auto pt-8 md:pt-14 space-y-24 pb-16">
        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 border-2 border-primary bg-surface px-3 py-1 font-mono text-xs font-bold uppercase shadow-neo-sm">
              <span className="w-2 h-2 rounded-full bg-signal-orange animate-pulse" />
              [ REPAIR OPERATIONS ] • NEXT-GEN WORKBENCH
            </div>
            <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-black uppercase tracking-tight leading-[0.98] text-primary">
              REPAIR OPERATIONS.
              <br />
              <span className="bg-electric-yellow px-3 border-[3px] border-primary inline-block mt-2 transform -rotate-1 shadow-neo">
                NOW AGENT-READY.
              </span>
            </h1>
            <p className="font-body text-base md:text-lg text-[#3A3A3A] font-medium max-w-xl border-l-4 border-signal-orange pl-4 py-1 leading-relaxed">
              Manage assets, repairs, and technicians. Let AI agents operate your workflow through native WebMCP
              tools. The authoritative operating system for technical repair centers.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                className="neo-btn inline-flex items-center justify-center gap-2 bg-signal-orange text-white border-2 border-primary shadow-neo font-headline text-sm tracking-wider uppercase font-bold px-8 py-4 hover:bg-signal-orange-dark"
                href="#features"
              >
                <span>EXPLORE REPAIRDESK</span>
                <Icon name="arrow_forward" className="text-base" />
              </a>
              <Link
                className="neo-btn inline-flex items-center justify-center gap-2 bg-surface text-primary border-2 border-primary shadow-neo font-headline text-sm tracking-wider uppercase font-bold px-8 py-4 hover:bg-surface-dim"
                to="/auth"
              >
                <Icon name="terminal" className="text-base text-primary" />
                <span>SEE WEBMCP IN ACTION</span>
              </Link>
            </div>
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-mono font-semibold text-primary border-t-2 border-primary/20 max-w-xl">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>ASSETS</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>REPAIRS</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>TECHNICIANS</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5 bg-electric-yellow/50 border border-primary px-1.5 py-0.5">
                <span className="w-2 h-2 rounded-full bg-signal-orange" />
                <span>WEBMCP SUITE</span>
              </div>
            </div>
          </div>

          {/* Hero right: live telemetry panel */}
          <div className="lg:col-span-5 border-[3px] border-primary bg-[#1A1A1A] text-white shadow-neo-lg flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between border-b-2 border-[#333] px-4 py-3 bg-[#111]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#FF5F56] rounded-full border border-black/40" />
                <div className="w-2.5 h-2.5 bg-[#FFBD2E] rounded-full border border-black/40" />
                <div className="w-2.5 h-2.5 bg-[#27C93F] rounded-full border border-black/40" />
                <span className="font-mono text-[11px] text-gray-400 font-bold uppercase ml-2 tracking-wider">
                  REPAIRDESK / SYSTEM VIEW
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                <span className="font-mono text-[10px] text-green-400 uppercase font-semibold">ONLINE (14ms)</span>
              </div>
            </div>
            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="border-2 border-primary bg-warm-cream text-primary p-3 shadow-neo-sm relative">
                <div className="flex items-center justify-between border-b border-primary/20 pb-1.5 mb-2 font-headline uppercase font-bold text-[11px]">
                  <div className="flex items-center gap-1.5 text-signal-orange">
                    <Icon name="mark_chat_unread" className="text-sm" />
                    <span>INCOMING USER TELEMETRY</span>
                  </div>
                  <span className="text-[9px] bg-primary text-white px-1 font-mono">PRIORITY_1</span>
                </div>
                <p className="font-body text-xs font-semibold leading-snug">
                  "Device{' '}
                  <span className="bg-electric-yellow px-1 border border-primary font-mono text-[11px]">RD-892</span>{' '}
                  is overheating during stress tests. Initiate diagnostic protocol."
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-electric-yellow py-0.5">
                <span className="h-4 w-[2px] bg-[#444]" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400">
                  DISPATCHED TO AGENT WEBMCP
                </span>
                <span className="h-4 w-[2px] bg-[#444]" />
              </div>
              <div className="border-2 border-[#333] bg-[#222222] p-3.5 space-y-2 relative">
                <div className="flex items-center justify-between border-b border-[#3a3a3a] pb-2">
                  <div className="flex items-center gap-1.5 text-electric-yellow">
                    <Icon name="terminal" className="text-base" />
                    <span className="font-headline font-bold text-xs uppercase tracking-wide">WEBMCP TOOLS ENGAGED</span>
                  </div>
                  <span className="bg-electric-yellow text-primary font-bold text-[9px] px-1.5 py-0.5 border border-black uppercase">
                    ACTIVE AGENT
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] leading-relaxed text-gray-300 font-mono">
                  <div className="flex items-center justify-between">
                    <span>&gt; get_asset_status("RD-892")</span>
                    <span className="text-green-400 font-bold bg-green-950/80 px-1 border border-green-800">[OK]</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>&gt; verify_warranty("RD-892")</span>
                    <span className="text-signal-orange font-bold bg-orange-950/80 px-1 border border-orange-800">
                      [EXPIRED]
                    </span>
                  </div>
                  <div className="text-gray-400">
                    <span>&gt; create_repair_ticket(issue="Thermal Runaway", priority="HIGH")</span>
                  </div>
                  <div className="flex items-center gap-1 text-electric-yellow text-[10px] pt-1">
                    <Icon name="sync" className="text-xs" />
                    <span>Awaiting bench routing...</span>
                    <span className="w-1.5 h-3 bg-electric-yellow inline-block animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="border-2 border-primary bg-warm-cream text-primary p-2.5 shadow-neo-sm">
                  <div className="font-headline text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    ASSET INTAKE
                  </div>
                  <div className="font-headline font-black text-sm text-primary">PROJ-023 / RD-892</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[9px] bg-red-100 text-red-900 border border-red-700 px-1 font-bold">
                      TEMP: 98°C
                    </span>
                    <span className="text-[9px] text-gray-600 font-mono">BAY 4</span>
                  </div>
                </div>
                <div className="border-2 border-primary bg-electric-yellow text-primary p-2.5 shadow-neo-sm">
                  <div className="font-headline text-[10px] font-bold uppercase tracking-wider text-black/70 mb-1">
                    DISPATCHED TICKET
                  </div>
                  <div className="font-headline font-black text-sm text-primary">#RD-1042</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[9px] bg-primary text-white px-1 font-bold uppercase">TECH: T. MILLER</span>
                    <span className="text-[9px] font-bold underline uppercase">QUEUE #2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product telemetry strip */}
        <section className="border-[3px] border-primary bg-surface shadow-neo">
          <div className="grid grid-cols-2 md:grid-cols-5 divide-y-2 md:divide-y-0 md:divide-x-2 divide-primary">
            <div className="p-4 md:p-5 flex flex-col justify-between group hover:bg-warm-cream transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-headline font-bold text-xs uppercase tracking-wider text-gray-600">Assets Managed</span>
                <Icon name="inventory_2" className="text-sm text-primary" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-headline font-black text-3xl md:text-4xl text-primary">124</span>
                <span className="font-mono text-[10px] bg-green-200 text-green-900 px-1 border border-green-800 font-bold">100% SYNC</span>
              </div>
            </div>
            <div className="p-4 md:p-5 flex flex-col justify-between group hover:bg-warm-cream transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-headline font-bold text-xs uppercase tracking-wider text-gray-600">Open Repairs</span>
                <Icon name="build" className="text-sm text-primary" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-headline font-black text-3xl md:text-4xl text-primary">17</span>
                <span className="font-mono text-[10px] text-gray-500 font-medium">Active bench</span>
              </div>
            </div>
            <div className="p-4 md:p-5 flex flex-col justify-between bg-signal-orange/10 group hover:bg-signal-orange/20 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-headline font-bold text-xs uppercase tracking-wider text-signal-orange font-black">Critical Issues</span>
                <Icon name="warning" className="text-sm text-signal-orange" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-headline font-black text-3xl md:text-4xl text-signal-orange">03</span>
                <span className="font-mono text-[10px] bg-signal-orange text-white px-1 font-bold">ESCALATED</span>
              </div>
            </div>
            <div className="p-4 md:p-5 flex flex-col justify-between bg-electric-yellow/20 group hover:bg-electric-yellow/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-headline font-bold text-xs uppercase tracking-wider text-primary">In Repair</span>
                <Icon name="hourglass_top" className="text-sm text-primary" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-headline font-black text-3xl md:text-4xl text-primary">08</span>
                <span className="font-mono text-[10px] bg-electric-yellow border border-primary px-1 font-bold">ON BENCH</span>
              </div>
            </div>
            <div className="p-4 md:p-5 col-span-2 md:col-span-1 flex flex-col justify-between group hover:bg-warm-cream transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-headline font-bold text-xs uppercase tracking-wider text-gray-600">Resolved Today</span>
                <Icon name="task_alt" className="text-sm text-green-600" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-headline font-black text-3xl md:text-4xl text-green-700">21</span>
                <span className="font-mono text-[10px] text-green-700 font-bold">98.4% SLA</span>
              </div>
            </div>
          </div>
        </section>

        {/* Platform transition header */}
        <section className="text-center py-6 border-y-[3px] border-primary relative" id="platform">
          <div className="max-w-2xl mx-auto space-y-2">
            <span className="font-mono text-xs uppercase font-bold text-signal-orange tracking-widest">
              [ UNIFIED WORKBENCH ARCHITECTURE ]
            </span>
            <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-primary">
              ONE SYSTEM. EVERY REPAIR.
            </h2>
            <p className="font-body text-sm md:text-base text-gray-700 font-medium max-w-lg mx-auto">
              From equipment intake to autonomous resolution, RepairDesk keeps every operational detail connected
              between bench techs and AI agents.
            </p>
          </div>
        </section>

        {/* Feature cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8" id="features">
          {/* Card 1: Asset Control */}
          <div className="neo-card lg:col-span-7 border-[3px] border-primary bg-warm-cream p-6 md:p-8 shadow-neo flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-primary flex items-center justify-center text-white border-2 border-primary shadow-neo-sm">
                  <Icon name="inventory_2" className="text-2xl" />
                </div>
                <span className="font-mono text-xs font-bold bg-white border-2 border-primary px-2.5 py-1 shadow-neo-sm">
                  FULL LIFECYCLE ASSET CONTROL
                </span>
              </div>
              <h3 className="font-headline text-2xl font-black uppercase text-primary mb-2">ASSET CONTROL</h3>
              <p className="font-body text-sm text-gray-700 font-medium mb-6">
                Track every unit, part, and tool in your facility with absolute precision. Comprehensive lifecycle
                records from intake, warranty validation, to decommission.
              </p>
            </div>
            <div className="border-2 border-primary bg-white shadow-neo-sm overflow-hidden">
              <div className="bg-primary text-white px-3 py-1.5 font-mono text-[11px] font-bold flex justify-between items-center">
                <span>ASSET REGISTRY TELEMETRY</span>
                <span className="text-electric-yellow">ACTIVE / IN REPAIR / RETIRED</span>
              </div>
              <div className="divide-y border-t border-primary font-mono text-xs">
                {[
                  ['PROJ-023', 'Laser Projector 4K', 'FAULT: OVERHEAT', 'BAY-4'],
                  ['LAP-018', 'Dell Precision 5570', 'BATTERY SWAP', 'BAY-1'],
                  ['MON-044', 'ProArt 32-inch', 'READY TO DEPLOY', 'STORAGE A'],
                ].map(([tag, name, badge, bay]) => (
                  <div key={tag} className="p-2.5 flex items-center justify-between hover:bg-yellow-50">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{tag}</span>
                      <span className="text-gray-600 font-body text-xs">{name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-red-100 text-red-900 border border-red-700 px-1.5 py-0.5 text-[10px] font-bold">
                        {badge}
                      </span>
                      <span className="font-bold">{bay}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Repair Intelligence */}
          <div className="neo-card lg:col-span-5 border-[3px] border-primary bg-[#1A1A1A] text-white p-6 md:p-8 shadow-neo flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-white text-primary flex items-center justify-center border-2 border-white shadow-neo-sm">
                  <Icon name="analytics" className="text-2xl" />
                </div>
                <span className="font-mono text-xs font-bold bg-signal-orange text-white px-2.5 py-1 border border-white">
                  HISTORY-DRIVEN DIAGNOSIS
                </span>
              </div>
              <h3 className="font-headline text-2xl font-black uppercase text-electric-yellow mb-2">
                REPAIR INTELLIGENCE
              </h3>
              <p className="font-body text-sm text-gray-300 font-medium mb-6">
                Historical repair records surface recurring faults and past resolutions instantly. Every ticket
                builds institutional knowledge for technicians and agents.
              </p>
            </div>
            <div className="border-2 border-[#444] bg-[#222] p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-gray-300 border-b border-[#333] pb-2">
                <span className="text-electric-yellow font-bold uppercase">• Repair History Records</span>
                <span className="text-white">EVERY TICKET</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>Repeated failure detection</span>
                    <span className="text-signal-orange font-bold">4 repairs / 6 mo</span>
                  </div>
                  <div className="w-full bg-[#111] h-2 border border-[#444]">
                    <div className="bg-signal-orange h-full" style={{ width: '64%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>Warranty visibility</span>
                    <span className="text-electric-yellow font-bold">Active / Expiring / Expired</span>
                  </div>
                  <div className="w-full bg-[#111] h-2 border border-[#444]">
                    <div className="bg-electric-yellow h-full" style={{ width: '28%' }} />
                  </div>
                </div>
              </div>
              <div className="pt-2 text-[11px] text-gray-400 bg-[#151515] p-2 border border-[#333]">
                <span className="text-white font-bold">Technician context:</span> Asset history, warranty state, and
                prior resolutions available directly on every ticket.
              </div>
            </div>
          </div>

          {/* Card 3: Technician Workflow */}
          <div className="neo-card lg:col-span-5 border-[3px] border-primary bg-warm-cream p-6 md:p-8 shadow-neo flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-signal-orange text-white flex items-center justify-center border-2 border-primary shadow-neo-sm">
                  <Icon name="engineering" className="text-2xl" />
                </div>
                <span className="font-mono text-xs font-bold bg-primary text-white px-2.5 py-1">
                  ASSIGNED → RESOLVED
                </span>
              </div>
              <h3 className="font-headline text-2xl font-black uppercase text-primary mb-2">TECHNICIAN WORKFLOW</h3>
              <p className="font-body text-sm text-gray-700 font-medium mb-6">
                Structured repair lifecycle from assignment through diagnosis, repair, and resolution with notes,
                status transitions, and full audit history.
              </p>
            </div>
            <div className="border-2 border-primary bg-surface p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center font-headline font-bold text-xs uppercase border-b border-primary pb-1.5">
                <span>Repair Lifecycle</span>
                <span className="text-signal-orange font-mono">ROLE-ENFORCED</span>
              </div>
              <div className="space-y-2">
                {['OPEN', 'ASSIGNED', 'DIAGNOSING', 'IN_REPAIR', 'RESOLVED', 'CLOSED'].map((s, i, arr) => (
                  <div key={s} className="flex items-center justify-between">
                    <span className="font-bold">{s.replace('_', ' ')}</span>
                    <span className={i < arr.length - 1 ? 'text-signal-orange' : 'text-green-700 font-bold'}>
                      {i < arr.length - 1 ? '→' : '✓'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-gray-600 pt-1 border-t border-primary/20 flex justify-between">
                <span>Every transition validated server-side</span>
                <span className="text-green-700 font-bold">Invalid moves rejected</span>
              </div>
            </div>
          </div>

          {/* Card 4: WebMCP / Agent-Ready */}
          <div
            className="neo-card lg:col-span-7 border-[3px] border-primary bg-electric-yellow p-6 md:p-8 shadow-neo flex flex-col justify-between relative overflow-hidden"
            id="webmcp"
          >
            <div className="absolute top-0 right-0 bg-signal-orange text-white font-headline text-xs uppercase font-black px-4 py-1.5 border-l-2 border-b-2 border-primary shadow-neo-sm">
              CORE DIFFERENTIATOR
            </div>
            <div>
              <div className="w-12 h-12 bg-white text-signal-orange flex items-center justify-center border-2 border-primary shadow-neo-sm mb-6">
                <Icon name="smart_toy" className="text-2xl font-black" />
              </div>
              <h3 className="font-headline text-3xl font-black uppercase text-primary mb-2">WEBMCP / AGENT-READY</h3>
              <p className="font-body text-base text-primary font-medium mb-6 max-w-xl">
                Expose your repair operation to AI agents securely. Our native WebMCP implementation allows
                autonomous systems to query assets, create tickets, and update repairs safely — under your exact
                permissions.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-white border-2 border-primary p-3 shadow-neo-sm">
                <div className="font-headline font-bold text-primary uppercase text-[11px] mb-1">PROTOCOL STATUS</div>
                <div className="flex items-center gap-1.5 font-bold text-green-700">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  WEBMCP ACTIVE
                </div>
                <div className="text-[10px] text-gray-500 mt-1">JSON-RPC / Streamable HTTP</div>
              </div>
              <div className="bg-white border-2 border-primary p-3 shadow-neo-sm">
                <div className="font-headline font-bold text-primary uppercase text-[11px] mb-1">PERMISSION GATE</div>
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <Icon name="lock" className="text-sm text-signal-orange" />
                  ROLE-ENFORCED
                </div>
                <div className="text-[10px] text-gray-500 mt-1">Same RBAC as the app</div>
              </div>
              <div className="bg-white border-2 border-primary p-3 shadow-neo-sm">
                <div className="font-headline font-bold text-primary uppercase text-[11px] mb-1">AGENT TOOLSET</div>
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <Icon name="build_circle" className="text-sm text-primary" />
                  09 LIVE TOOLS
                </div>
                <div className="text-[10px] text-gray-500 mt-1">Full audit logging</div>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow section */}
        <section id="workflow" className="border-[3px] border-primary bg-surface shadow-neo">
          <div className="border-b-2 border-primary px-6 py-4 flex items-center justify-between">
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-primary flex items-center gap-2">
              <Icon name="account_tree" className="text-2xl" />
              HUMAN + AGENT OPERATING MODEL
            </h2>
            <span className="font-mono text-[10px] font-bold uppercase bg-electric-yellow border border-primary px-2 py-1">
              ONE AUTHORIZATION MODEL
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: '01',
                title: 'HUMAN REQUEST',
                desc: 'Employee reports an issue through the app — or asks their AI agent in natural language.',
                icon: 'person',
              },
              {
                step: '02',
                title: 'AGENT VIA WEBMCP',
                desc: 'The agent calls structured tools — search_assets, create_repair_ticket — under the user\u2019s exact permissions.',
                icon: 'smart_toy',
              },
              {
                step: '03',
                title: 'REPAIRDESK OPERATIONS',
                desc: 'The same authenticated backend enforces RBAC, runs the real workflow, and writes auditable history.',
                icon: 'precision_manufacturing',
              },
            ].map((s) => (
              <div key={s.step} className="border-2 border-primary bg-warm-cream p-4 shadow-neo-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-headline font-black text-2xl text-signal-orange">{s.step}</span>
                  <Icon name={s.icon} className="text-2xl text-primary" />
                </div>
                <div className="font-headline font-bold text-sm uppercase tracking-wide text-primary">{s.title}</div>
                <p className="font-body text-xs text-gray-700 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white w-full border-t-[3px] border-primary">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-10 px-4 md:px-10 max-w-[1400px] mx-auto gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icon name="precision_manufacturing" className="text-[28px] text-white select-none leading-none" />
              <span className="font-headline font-black text-xl uppercase tracking-tight">RepairDesk</span>
            </div>
            <p className="font-body text-xs text-gray-400">© 2026 RepairDesk Inc. Built for humans. Ready for agents.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 font-headline text-xs uppercase font-bold tracking-wider">
            <a className="text-gray-400 hover:text-white transition-colors" href="#platform">Documentation</a>
            <a className="text-electric-yellow hover:underline transition-colors" href="#webmcp">WebMCP Protocol</a>
            <a className="text-gray-400 hover:text-white transition-colors" href="#">Privacy</a>
            <a className="text-gray-400 hover:text-white transition-colors" href="#">Terms</a>
            <a className="text-gray-400 hover:text-white transition-colors flex items-center gap-1" href="#">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Status
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
