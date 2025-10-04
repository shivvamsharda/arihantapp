# CLAUDE.md

This file provides general guidance to Claude Code (claude.ai/code) when working with code in this repository.  
It ensures consistency, design alignment, and high-quality implementation across all tasks.

---

## Context
- For context, make sure after implementation, all steps are logged into context.md

## Folder & File Placement Rules

- **Do not create a new subfolder** when scaffolding or initializing.  
- Always work **directly inside the current project directory** where `package.json` is located.  
- Place all generated files, configs, and source code into the existing structure (`src/`, `public/`, etc.).  
- If a tool or command usually asks for a project name (e.g., `npm create vite@latest my-app`), replace it with `.` to indicate the current folder (e.g., `npm create vite@latest .`).  
- Never nest the project inside another folder.

## Architecture Overview

This is a **React 18 website** built with:

- **Vite** bundler for fast dev/build
- **TypeScript** for type safety
- **React Router** for client-side routing
- **MDX** for article content with file-based routing
- **Tailwind CSS** with custom color palette and typography
- **Headless UI** for accessible components
- **Lucide React** for icons
- **Dark mode** using Tailwind theming utilities

---

## Key Architecture Patterns

**Content Management**  
- Articles written in MDX located in `src/app/articles/[slug]/page.mdx`  
- Automatically discovered via `getAllArticles()` in `src/lib/articles.ts` (glob patterns)

**Styling System**  
- Custom color palette in `tailwind.config.ts` under `patrick-*` namespace (blue, orange, etc.)  
- Typography styles centralized in `typography.ts`  
- Mobile-first responsive design

**Component Structure**  
- Layout components in `src/components/` follow a hierarchical pattern (Layout → Container → Section)  
- `ArticleLayout` and `SimpleLayout` provide reusable structures

**Metadata & SEO**  
- Configured in `src/app/layout.tsx`  
- Includes structured data (JsonLd) and analytics integration

**MDX Configuration**  
- Syntax highlighting via `rehype-prism`  
- GitHub Flavored Markdown via `remark-gfm`  
- File tracing for bundling article assets efficiently

---

## Visual Development

### Design Principles
- Refer to `context/design-principles.md` before making any visual/UI change
- Adhere to accessibility and responsive design standards

### Quick Visual Check
After implementing front-end changes:
1. Identify modified components/pages
2. Navigate to affected routes
3. Compare against `context/design-principles.md`
4. Ensure change matches user request & acceptance criteria
5. Run browser console checks for errors
6. Capture full-page screenshot (desktop viewport 1440px)

### Comprehensive Design Review
Use the `@agent-design-review` subagent for:
- Major UI/UX features
- Pre-PR review of significant visual work
- Accessibility & responsiveness testing

---

## shadcn/ui Components

- Built on Radix UI primitives  
- Components in `src/components/ui/`  
- Tailwind v4 with CSS variables for theming  
- Icons: Lucide React

---

## Guidance Memories

- Always ask for clarification upfront if requirements are unclear  
- Use **conventional branch naming** (`feature/*`, `fix/*`, `docs/*`, etc.)  
- Do **not** mention Claude/ChatGPT in commits or PR descriptions  

---

## Linting and Code Quality

- Run `npm run lint` after significant changes or refactors  
- Follow TypeScript strict mode and ESLint rules  
- Ensure Prettier formatting consistency  

---

## CLI Tooling Memories

- Use `gh` CLI for issues, PRs, and repo interactions when possible  
- Prefer automation scripts defined in `package.json`  

---

## Documentation Memories

- Use **context7** to pull the latest docs for external libraries/frameworks  
- Update `README.md` and inline JSDoc comments when adding or refactoring features  

---
