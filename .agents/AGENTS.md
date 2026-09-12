# Project Rules

- **Code Comments and Documentation Language**: All code comments, JSDoc/TSDoc annotations, README files, and any project-scoped documentation MUST be written in English.
- **Git Commit Messages**: All git commit messages suggested to the user MUST strictly follow the Conventional Commits specification (e.g. `feat(scope): ...`, `fix(scope): ...`).
- **UI/UX Design Benchmark (`/head-to-head`)**: The Teammate Head-to-Head page is the project's apex design benchmark. All page refactors must conform to [.agents/rules/ui-ux-design-system.md](file:///C:/Users/Админ/WebstormProjects/f1-data-demo/.agents/rules/ui-ux-design-system.md):
  - **Monolithic 1px Grid Architecture**: Ban loose "AI floating bubble cards" with random rounded corners and margins. Use unified outer shells (`rounded-3xl border border-white/10 bg-zinc-950`) with contiguous 1px shared borders (`border-t border-l border-white/10` parent, `border-b border-r border-white/10 bg-zinc-900/20` children).
  - **Typography & High Contrast**: Monospace (`font-mono`) for all telemetry/timings/positions; uppercase tracking for labels (`text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider`). Never drop readable text below `text-zinc-400`.
  - **Compact Cockpit Density**: Eliminate large empty vertical gaps (`py-2.5` to `py-3.5`, `space-y-4` to `space-y-6`), while preserving chart/map prominence.
  - **Motorsports Polish**: Country flags beside Grand Prix/nationalities, driver cutouts with proper inwards orientation, distinctive DNF/DSQ badges, and dynamic team livery glows (`opacity-20 blur-3xl`).
  - **Mobile Adaptability**: No destructive hiding. Use horizontal ribbons with smooth scrolling, structured split comparison cards, and >=44px touch targets.

