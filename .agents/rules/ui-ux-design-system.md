# UI/UX Design System & Architectural Directives

> **Benchmark Standard**: The Teammate Head-to-Head page (`/head-to-head`) represents the apex aesthetic, architectural density, and UX maturity of this project. Every other page in the application must be refactored to match this exact level of craftsmanship, responsiveness, and motorsport visual identity.

---

## 1. Core Architectural Philosophy: The Monolithic 1px Grid

### Anti-Pattern: "AI Floating Bubble Cards"
- **Banned**: Disconnected cards floating in empty space with excessive outer margins (`m-6`, `p-8`), heavy rounded corners (`rounded-2xl` on every nested child), and generic low-contrast gray borders (`border-zinc-800`).
- **Banned**: Redundant modal popups duplicating page content. Deep-link directly to dedicated views instead.

### Mandated: Monolithic Seamless Grid Architecture
- **Unified Outer Container**: A singular high-end shell (`rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl`).
- **Contiguous 1px Border Matrix**: Inner sections and telemetry cells share borders rather than floating independently:
  - Container uses `border-t border-l border-white/10 bg-zinc-950/60 overflow-hidden`.
  - Children use `border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors`.
  - Result: A razor-sharp, seamless instrument cluster reminiscent of telemetry screens in F1 pit garages.

---

## 2. Color Palette & Dynamic Team Liveries

### Base Surfaces
- **App Canvas**: `bg-black` or `bg-zinc-950`.
- **Primary Cards/Panels**: `bg-zinc-950` with subtle `bg-zinc-900/40` backdrops.
- **Borders**: Crisp, micro-subtle `border-white/10` (hover: `hover:border-white/20`).
- **Dividers & Structural Lines**: `border-white/10` or `border-zinc-800/80`.

### Dynamic Team Liveries & Ambient Lighting
- **Team Accent Glow**: Subtle ambient glows at the top or behind hero cutouts:
  ```tsx
  <div
    className="absolute top-0 inset-x-0 h-40 opacity-20 blur-3xl pointer-events-none"
    style={{ backgroundColor: theme.primary }}
  />
  ```
- **Contrast Awareness**: Always inspect `theme.textColor === 'dark'` to select appropriate foregrounds (`text-zinc-950` vs `text-white`).
- **Livery Accent Strips**: 2px to 3px solid team accent bars along key structural dividers.

---

## 3. Typography & Information Hierarchy

### Strict Contrast Rules
- **Data Labels & Metric Titles**: `text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider`.
- **Secondary Annotations**: `text-xs font-mono text-zinc-400` (NEVER drop below `text-zinc-400` for readable labels).
- **Primary Data Values**: `font-black font-mono text-white` (size scaled from `text-base` to `text-3xl`).
- **Driver / Constructor Names**: `font-black uppercase tracking-tight text-white`.

### Font Roles
- **Mono (`font-mono`)**: All telemetry, positions, gap deltas, points, session times, round numbers (`R01`, `P01`, `-0.142s`, `25 pts`).
- **Sans (`font-sans`)**: Grand Prix titles, driver first names, circuit names, editorial narratives.

---

## 4. Layout, Vertical Rhythm & High-Density Cockpit Design

### Desktop Vertical Rhythm
- **Tight, Intentional Spacing**: Avoid huge 40-60px empty vertical gaps.
- Use `space-y-4` to `space-y-6` on outer flows, `py-2.5` to `py-3.5` on inner headers, and `gap-3` to `gap-5` on metric grids.
- **Never Shrink Critical Visualizations**: When compacting height, reduce container margins, padding, and sub-labels—**do not shrink charts, maps, or portraits** below readable thresholds (e.g. radar chart preserved at >=285px, font size 20px on axes).

### Segmented Toolbar Controls
- Compact, architectural segmented controls for tabs and filters:
  ```tsx
  <div className="inline-flex p-0.5 rounded-lg bg-zinc-950 border border-white/10">
    <button className={cn(
      "px-3 py-1 rounded-md text-xs font-mono font-bold transition-all",
      active ? "bg-zinc-800 text-white shadow-sm ring-1 ring-white/10" : "text-zinc-400 hover:text-white"
    )}>
      Mode
    </button>
  </div>
  ```

---

## 5. Motorsports Domain Details & Visual Polish

- **Official Country Flags**: Always render `CountryFlag` next to Grand Prix, circuits, and driver nationalities.
- **Driver Portraits**:
  - Left driver facing inward right (`left.webp`).
  - Right driver facing inward left (`right.webp`).
  - Cutout overflow styling with gradient base fade (`from-transparent to-zinc-950`).
- **Status Classification Badges**:
  - `DNF`: `bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded`.
  - `DSQ`: `bg-rose-950/60 text-rose-300 border border-rose-700/50 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded`.
  - Position Badges: Winner in livery tint or amber (`bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40`), classified finishes in crisp `text-white font-mono`.
- **Proportional Split Bars**:
  - Calculate exact ratios with graceful clamping (`Math.max(10, Math.min(90, d1Pct))`) so neither bar vanishes completely.
  - Height: `h-2` to `h-2.5`, full-bleed or `rounded-full` in `bg-zinc-900 border border-white/10`.

---

## 6. Mobile Responsiveness Directives

- **No Destructive Hiding**: Never simply hide key data or comparisons on mobile.
- **Horizontal Ribbons**: Use momentum scrolling ribbons with subtle fade masks for team/circuit selectors (`overflow-x-auto scrollbar-none`).
- **Split Comparison Cards**: On narrow screens, translate table rows into structured duel cards with clear driver badges and deltas.
- **Touch Targets**: All interactive triggers must be at least `44px` tall (`min-h-[44px]` or adequate padding).

---

## 7. Page Refactoring Workflow Checklist

When taking a page to refactor:
1. **Audit**: Identify loose floating cards, wasted vertical space, low-contrast text, missing flags, or unresponsive layouts.
2. **Structure**: Reorganize into a monolithic hero/matrix shell using the 1px grid architecture.
3. **Data Polish**: Apply monospace numbers, high-contrast labels, and authentic motorsports badges.
4. **Mobile Polish**: Ensure touch controls, horizontal ribbons, and responsive card degradation.
5. **Verification**: Run `npx tsc --noEmit` and review visual layout across breakpoints (`375px`, `768px`, `1024px`, `1440px`).
