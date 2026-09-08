# CLAUDE.md

Guidance for Claude Code when working with code in this repository.

All agent guidance is maintained in a single source of truth — AGENTS.md:

@AGENTS.md

Commands, architecture, code style, data shapes, CMS setup, and pitfalls all live there. This file intentionally duplicates nothing to avoid drift.

## Images

Store in `public/assets/images/`:
- `people/` - Team photos (400×400px, named `bio-lastname.jpg`)
- `papers/` - Paper thumbnails (500×300px, named `paper1.jpg`)
- `posts/` - News images (800×600px+, descriptive names)

Use absolute paths: `/assets/images/people/bio-chan.jpg`. Optimize: JPG @ 85%, <500KB.
