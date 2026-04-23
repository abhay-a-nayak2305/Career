import { Hono } from 'hono'
import { cors } from 'hono/cors'
import OpenAI from 'openai'

const app = new Hono()

// CORS configuration
app.use('*', cors({
  origin: '*',
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

// Types
type Bindings = {
  OPENROUTER_API_KEY: string
  PINECONE_API_KEY: string
  PINECONE_INDEX: string
}

type Skill = {
  name: string
  category: 'technical' | 'soft' | 'domain'
  experienceYears?: number
  confidence: number
}

type GapAnalysisRequest = {
  currentSkills: Skill[]
  targetRole: string
}

// Sample data for demo
const sampleSkills = {
  'Frontend Engineer': [
    { name: 'javascript', category: 'technical', confidence: 1 },
    { name: 'typescript', category: 'technical', confidence: 1 },
    { name: 'react', category: 'technical', confidence: 1 },
    { name: 'next.js', category: 'technical', confidence: 0.8 },
    { name: 'tailwindcss', category: 'technical', confidence: 0.7 },
    { name: 'html', category: 'technical', confidence: 1 },
    { name: 'css', category: 'technical', confidence: 1 },
    { name: 'git', category: 'technical', confidence: 1 }
  ],
  'Backend Engineer': [
    { name: 'node.js', category: 'technical', confidence: 1 },
    { name: 'python', category: 'technical', confidence: 1 },
    { name: 'postgresql', category: 'technical', confidence: 1 },
    { name: 'docker', category: 'technical', confidence: 0.8 },
    { name: 'aws', category: 'technical', confidence: 0.7 },
    { name: 'git', category: 'technical', confidence: 1 }
  ]
}

const sampleRoadmap = {
  month1: [
    {
      skill: 'typescript',
      topics: ['Basic Types', 'Interfaces', 'Generics', 'Utility Types'],
      resources: [
        { title: 'TypeScript Docs', url: 'https://www.typescriptlang.org/docs/', type: 'documentation' }
      ],
      practiceProject: 'Convert a JS project to TypeScript',
      estimatedHours: 40,
      milestone: 'Strict mode enabled',
      phase: 'month1'
    },
    {
      skill: 'react',
      topics: ['Hooks', 'State Management', 'Performance', 'Testing'],
      resources: [
        { title: 'React Docs', url: 'https://react.dev/learn', type: 'documentation' }
      ],
      practiceProject: 'Build a todo app with local storage',
      estimatedHours: 30,
      milestone: 'App built',
      phase: 'month1'
    }
  ],
  month2: [
    {
      skill: 'next.js',
      topics: ['Routing', 'Data Fetching', 'Server Components', 'Deployment'],
      resources: [
        { title: 'Next.js Docs', url: 'https://nextjs.org/docs', type: 'documentation' }
      ],
      practiceProject: 'Build a blog with dynamic routes',
      estimatedHours: 45,
      milestone: 'Blog deployed',
      phase: 'month2'
    }
  ],
  month3: [
    {
      skill: 'tailwindcss',
      topics: ['Utility First', 'Responsive Design', 'Custom Config', 'Dark Mode'],
      resources: [
        { title: 'Tailwind Docs', url: 'https://tailwindcss.com/docs', type: 'documentation' }
      ],
      practiceProject: 'Recreate a popular landing page',
      estimatedHours: 25,
      milestone: 'Page complete',
      phase: 'month3'
    }
  ],
  totalEstimatedHours: 140,
  keyMilestones: [
    'Month 1: TypeScript + React fundamentals',
    'Month 2: Next.js full stack development',
    'Month 3: Modern CSS and styling'
  ]
}

// 100% FREE LLM - Llama 3 8B
const getLLMClient = (apiKey: string) => {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey
  })
}

const FREE_LLM_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'
const PRODUCTION_EMBEDDING_MODEL = 'openai/text-embedding-3-large'

// Get required skills for a target role using semantic search in ESCO dataset
app.post('/api/skills/required', async (c) => {
  const { targetRole } = await c.req.json()
  const { OPENROUTER_API_KEY, PINECONE_API_KEY, PINECONE_INDEX } = c.env as Bindings
  
  try {
    // 1. Generate embedding for the search query
    const llm = getLLMClient(OPENROUTER_API_KEY)
    const embeddingResponse = await llm.embeddings.create({
      model: PRODUCTION_EMBEDDING_MODEL,
      input: `essential and technical skills for ${targetRole} professional role`,
      dimensions: 2048
    })

    // 2. Fetch Pinecone Index host using REST API
    const hostResponse = await fetch(`https://api.pinecone.io/indexes/${PINECONE_INDEX}`, {
      headers: { 'Api-Key': PINECONE_API_KEY }
    })
    
    if (!hostResponse.ok) {
      throw new Error(`Failed to get Pinecone index host: ${await hostResponse.text()}`)
    }
    
    const hostData = await hostResponse.json() as { host: string }
    const host = hostData.host

    // 3. Query vectors directly using fetch API to bypass Cloudflare `ajv` constraints
    const queryResponse = await fetch(`https://${host}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vector: embeddingResponse.data[0].embedding,
        topK: 20,
        filter: { type: 'skill' },
        includeMetadata: true
      })
    })

    if (!queryResponse.ok) {
      throw new Error(`Failed to query Pinecone: ${await queryResponse.text()}`)
    }

    const queryData = await queryResponse.json() as any

    // 4. Map results to the Skill format
    if (queryData.matches && queryData.matches.length > 0) {
      const requiredSkills = queryData.matches.map((match: any) => ({
        name: match.metadata?.name || 'Unknown Skill',
        category: 'technical' as const,
        confidence: match.score || 0.8
      }))
      return c.json({ requiredSkills })
    }

    // Fallback to sample data if no matches found
    const skills = sampleSkills[targetRole as keyof typeof sampleSkills] || sampleSkills['Frontend Engineer']
    return c.json({ requiredSkills: skills })

  } catch (error) {
    console.error('Semantic search failed:', error)
    // Fallback to sample data on error
    const skills = sampleSkills[targetRole as keyof typeof sampleSkills] || sampleSkills['Frontend Engineer']
    return c.json({ requiredSkills: skills })
  }
})

// Perform gap analysis using FREE Llama 3
app.post('/api/analysis/gap', async (c) => {
  const { currentSkills, targetRole } = await c.req.json<GapAnalysisRequest>()
  const { OPENROUTER_API_KEY } = c.env as Bindings
  
  try {
    const llm = getLLMClient(OPENROUTER_API_KEY)
    
    // Attempt AI-powered gap analysis
    if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'your-openrouter-api-key') {
      try {
        const response = await llm.chat.completions.create({
          model: FREE_LLM_MODEL,
          messages: [{
            role: 'system',
            content: 'You are a career expert. Analyze the skill gaps between the user\'s current skills and the target role requirements. Provide a JSON response with gaps, overallMatchPercentage, and criticalGapsCount.'
          }, {
            role: 'user',
            content: `Current Skills: ${JSON.stringify(currentSkills)}\nTarget Role: ${targetRole}`
          }],
          response_format: { type: 'json_object' }
        })
        
        const result = JSON.parse(response.choices[0].message.content || '{}')
        return c.json(result)
      } catch (aiError) {
        console.error('AI Analysis failed, falling back to mock:', aiError)
        return c.json({ error: 'AI Analysis failed' }, 500)
      }
    }
    
    return c.json({ error: 'AI Key missing' }, 500)
  } catch (error) {
    return c.json({ error: 'Failed to perform gap analysis' }, 500)
  }
})

// Generate personalized roadmap using FREE Llama 3
app.post('/api/roadmap', async (c) => {
  const { gaps, targetRole } = await c.req.json()
  const { OPENROUTER_API_KEY } = c.env as Bindings
  
  try {
    const llm = getLLMClient(OPENROUTER_API_KEY)
    
    // Attempt AI-powered roadmap generation
    if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'your-openrouter-api-key') {
      try {
        const response = await llm.chat.completions.create({
          model: FREE_LLM_MODEL,
          messages: [{
            role: 'system',
            content: 'You are a career expert. Generate a 90-day learning roadmap based on the identified gaps and target role. Return a JSON object matching the PersonalizedRoadmap structure.'
          }, {
            role: 'user',
            content: `Target Role: ${targetRole}\nGaps: ${JSON.stringify(gaps)}`
          }],
          response_format: { type: 'json_object' }
        })
        
        const result = JSON.parse(response.choices[0].message.content || '{}')
        return c.json(result)
      } catch (aiError) {
        console.error('AI Roadmap failed, falling back to mock:', aiError)
        return c.json({ error: 'AI Roadmap failed' }, 500)
      }
    }
    
    return c.json({ error: 'AI Key missing' }, 500)
  } catch (error) {
    return c.json({ error: 'Failed to generate roadmap' }, 500)
  }
})

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    models: {
      embedding: PRODUCTION_EMBEDDING_MODEL,
      llm: FREE_LLM_MODEL,
      note: 'High-fidelity 2048-dim embeddings active'
    }
  })
})

export default app
