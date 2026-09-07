# CC Lab Website

<div align="center">

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![Netlify](https://img.shields.io/badge/Deployed_on-Netlify-00C7B7?logo=netlify&logoColor=white)

**Structural Bioinformatics & Molecular Dynamics Laboratory**

*Xi'an Jiaotong-Liverpool University (XJTLU)*

[Live Site](https://cc-lab-xjtlu.netlify.app) · [Report Bug](https://github.com/colinzyang/cc-lab-website/issues) · [Request Feature](https://github.com/colinzyang/cc-lab-website/issues)

</div>

---

## Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Routing](#routing)
- [Content Management](#content-management)
- [Image Management](#image-management)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## About

This repository contains the source code for the **CC Lab Website** — the official online presence of the Structural Bioinformatics & Molecular Dynamics Laboratory at Xi'an Jiaotong-Liverpool University (XJTLU).

### The Lab

CC Lab focuses on understanding protein structure-function relationships through computational approaches. Our research combines:

- **Structural Bioinformatics** — Analyzing and predicting protein structures
- **Molecular Dynamics Simulations** — Studying protein dynamics at atomic resolution
- **Machine Learning** — Developing AI-powered tools for drug discovery

The lab is based in the School of Science at XJTLU and affiliated with the Center for Intelligent RNA Therapeutics.

### This Website

The site serves as a platform to showcase our research, team, and publications. Built with modern web technologies, it features:

| Feature | Description |
|---------|-------------|
| **Decap CMS** | Non-technical team members can update content via `/admin/` |
| **BibTeX Import** | Batch import publications with automatic author formatting |
| **Dark Mode** | Toggle between light and dark themes |
| **Responsive** | Mobile-first design that works on all devices |
| **Type-Safe** | Full TypeScript strict mode for reliability |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 18 |
| **Language** | TypeScript 5 |
| **Routing** | React Router v6 (HashRouter) |
| **Styling** | Tailwind CSS v4 |
| **Animation** | Framer Motion |
| **Icons** | Lucide React |
| **Build** | Vite 5 |
| **CMS** | Decap CMS |

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/colinzyang/cc-lab-website.git
cd cc-lab-website

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |

---

## Project Structure

```
.
├── components/              # Page & UI components (Home, Member, Research, Publication, News, Contact, …)
├── src/
│   ├── context/             # Breadcrumb context provider
│   ├── hooks/               # Shared hooks (e.g., useDocumentTitle)
│   ├── lib/
│   │   ├── dataLoader.ts    # Typed JSON loaders, caching & interfaces
│   │   └── utils/
│   │       └── bibtexParser.ts  # BibTeX parsing utilities
│   └── index.css            # Tailwind v4 entry + @theme tokens
├── public/
│   ├── data/                # JSON content (members, publications, news, research, resources, labInfo)
│   ├── admin/               # Decap CMS (config + BibTeX import widget)
│   └── assets/images/       # people/, papers/, posts/
├── App.tsx                  # HashRouter, layout & routes
├── index.html               # HTML shell (fonts, Material Symbols, Netlify Identity)
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration (strict)
├── AGENTS.md / CLAUDE.md    # Developer & coding-agent guidelines
├── CONTRIBUTING.md          # Contribution guidelines
└── CODE_OF_CONDUCT.md       # Code of Conduct
```

---

## Routing

The site uses **hash-based routing** for static hosting compatibility.

| Route | Page |
|-------|------|
| `/` | Home (Hero + Recent Posts) |
| `/#/member` | Team Members |
| `/#/research` | Research Directions |
| `/#/publication` | Research Publications |
| `/#/news` | News & Events |
| `/#/contact` | Contact Information |

Unknown paths fall back to the home page.

---

## Content Management

### Decap CMS

Access the CMS to manage content without touching code:

- **Development:** `http://localhost:5173/admin/`
- **Production:** `https://cc-lab-xjtlu.netlify.app/admin/`

### Editable Collections

| Collection | Description |
|------------|-------------|
| **Members** | Lab members (PI, current members, alumni) |
| **Publications** | Research papers organized by year |
| **News** | News and event announcements |
| **Research** | Research directions and key areas |
| **Resources & Software** | Tools and software listings |
| **Lab Info** | Lab description and contact information |

### BibTeX Import

The CMS includes a custom BibTeX widget for batch importing publications with:
- Automatic author name format conversion
- DOI-based link generation
- Preprint detection (arXiv, bioRxiv, ChemRxiv)
- Duplicate detection

### Manual Editing

Edit JSON files directly in `public/data/`. Hard-refresh the browser (Cmd+Shift+R) to see changes during development.

---

## Deployment

The site is automatically deployed to [Netlify](https://www.netlify.com/) when pushing to the `main` branch.

### Configuration

Build settings are defined in `netlify.toml`:
- **Build command:** `npm run build`
- **Publish directory:** `dist/`
- **SPA routing:** Redirects all routes to `index.html`

### Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

Or manually:
1. Connect your GitHub repository to Netlify
2. Build settings will be auto-detected from `netlify.toml`
3. Push to main branch to trigger deployment

---

## Image Management

### Directories

| Directory | Purpose | Recommended Size |
|-----------|---------|------------------|
| `public/assets/images/people/` | Team photos | 400×400px |
| `public/assets/images/papers/` | Publication thumbnails | 500×300px |
| `public/assets/images/posts/` | News/blog images | 800×600px+ |

### Naming Conventions

- **People:** `bio-lastname.jpg` (e.g., `bio-chan.jpg`)
- **Papers:** `paperX.jpg` (e.g., `paper1.jpg`)
- **Posts:** `descriptive-name.jpg`

### Optimization

- Format: JPG at 85% quality
- File size: Under 500KB

---

## Development Notes

- **TypeScript strict mode** — `strict`, `noUnusedLocals` and `noUnusedParameters` are enabled; run `npx tsc --noEmit` to type-check
- **Tailwind CSS v4** — theme tokens are defined in the `@theme` block of `src/index.css` (no separate config file)
- **Dark mode** — class-based; use the `dark:` prefix
- **Responsive** — mobile-first design built with CSS Grid/Flexbox; primary breakpoint `md:` (768px)
- **Data caching** — loaders cache JSON in memory; hard-refresh the browser (Cmd+Shift+R) to pick up manual JSON edits

For detailed coding conventions, see [AGENTS.md](./AGENTS.md) and [CLAUDE.md](./CLAUDE.md).

---

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details on the development workflow, coding standards, commit conventions, and pull request process.

- [Report a Bug](https://github.com/colinzyang/cc-lab-website/issues)
- [Request a Feature](https://github.com/colinzyang/cc-lab-website/issues)

### Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report any unacceptable behavior to [Chun.Chan@xjtlu.edu.cn](mailto:Chun.Chan@xjtlu.edu.cn).

---

## License

This project is open-sourced under the [MIT License](./LICENSE).

---

## Contact

**CC Lab @ XJTLU**

- **Principal Investigator:** Kevin Chan
- **Email:** [Chun.Chan@xjtlu.edu.cn](mailto:Chun.Chan@xjtlu.edu.cn)
- **School:** School of Science, Center for Intelligent RNA Therapeutics
- **Website:** [https://cc-lab-xjtlu.netlify.app](https://cc-lab-xjtlu.netlify.app)
