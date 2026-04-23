# CareerPath.AI

A privacy-first AI platform that tells you exactly what you need to learn to get the job you want.

## Features

### 🔍 Skill Extractor Engine
- Client-side resume parsing (PDF/DOCX)
- No files leave your browser
- Extracts technical skills, soft skills, domain experience, and achievements
- Estimates experience levels

### 🎯 Target Role Selector
- 500+ standardized tech roles
- Job description semantic analysis
- Real skill requirements from 1M+ job postings

### 📊 Gap Analysis Engine
- Semantic skill matching (not just keywords)
- Skill adjacency calculator (React → Vue = 70% transfer)
- Gap categorization: Strong, Adjacent, New, Critical
- Realistic learning time estimates

### 🗺 Personalized Roadmap Generator
- 30/60/90 day learning plans
- Exact topics to learn
- Curated free resources (no affiliate links)
- Practice projects and milestones

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Parsing**: PDF.js + Mammoth (client-side only)
- **Backend**: Cloudflare Workers + Hono
- **AI**: OpenRouter (Llama 3)
- **Vector DB**: Pinecone

## Getting Started

```bash
# Install all dependencies
npm install

# Start both frontend and backend concurrently
npm run dev

# Or start separately:
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:8787

# Build for production
npm run build

# Deploy backend to Cloudflare
npm run deploy
```

## Privacy Guarantee

✅ No accounts required  
✅ No tracking  
✅ Resume never leaves your browser  
✅ No data storage  
✅ Free forever

## Project Structure

```
.
├── frontend/                 # React 18 + Vite + Tailwind
│   ├── src/
│   │   ├── lib/
│   │   │   ├── resumeParser.ts      # Client-side resume extraction
│   │   │   ├── gapAnalysis.ts       # Skill gap analysis logic
│   │   │   └── roadmapGenerator.ts  # Personalized roadmap generation
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── backend/                 # Cloudflare Workers + Hono
│   ├── src/
│   │   └── index.ts         # API endpoints
│   ├── package.json
│   ├── wrangler.toml
│   └── tsconfig.json
└── package.json
```

## Implementation Status

✅ Week 1: Foundation
- [x] Project structure setup
- [x] Resume upload component
- [x] Client-side PDF/DOCX parser
- [x] Skill extraction module
- [x] Basic UI with Tailwind

⏳ Week 2: Core Gap Analysis
- [x] Skill adjacency calculator
- [x] Gap analysis engine
- [ ] Semantic matching with embeddings
- [ ] Pinecone integration

⏳ Week 3: Roadmap Generation
- [x] Roadmap generator
- [x] Resource curation system
- [ ] Timeline estimation
- [ ] Advanced visualization

⏳ Week 4: Advanced Features
- [ ] Career progression simulator
- [ ] Job description import
- [ ] "What if" analysis

## License

MIT
