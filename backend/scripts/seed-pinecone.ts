import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import * as fs from 'fs'
import * as path from 'path'

// Load datasets
const skills = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/skills.json'), 'utf8'))
const adjacency = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/skill-adjacency.json'), 'utf8'))
const resources = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/resources.json'), 'utf8'))

async function main() {
  if (!process.env.PINECONE_API_KEY) {
    console.error('? PINECONE_API_KEY environment variable is required')
    process.exit(1)
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('? OPENROUTER_API_KEY environment variable is required (free tier available)')
    process.exit(1)
  }

  // Use 100% FREE models from OpenRouter
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY
  })
  
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  const indexName = process.env.PINECONE_INDEX || 'careerpath-ai'
  
  console.log('Connecting to Pinecone index:', indexName, '(768 dimensions - 100% FREE embeddings)')
  const index = pinecone.Index(indexName)

  // 100% FREE embedding model - no cost ever
  async function embed(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'nomic-ai/nomic-embed-text-v1.5:free',
      input: text,
      dimensions: 768
    })
    return response.data[0].embedding
  }

  // 1. Seed Skills Taxonomy
  console.log(`\nSeeding ${skills.skills.length} skills...`)
  
  const skillVectors = []
  for (const skill of skills.skills) {
    const embeddingText = `${skill.name} ${skill.category} ${skill.difficulty} difficulty programming skill ${skill.prerequisites.join(' ')}`
    const embedding = await embed(embeddingText)
    
    skillVectors.push({
      id: `skill:${skill.name.toLowerCase().replace(/\s+/g, '-')}`,
      values: embedding,
      metadata: {
        type: 'skill',
        name: skill.name,
        category: skill.category,
        difficulty: skill.difficulty,
        prerequisites: skill.prerequisites.join(','),
        popularity: skill.popularity
      }
    })

    if (skillVectors.length % 10 === 0) {
      console.log(`  Processed ${skillVectors.length}/${skills.skills.length} skills`)
    }
  }

  await index.upsert(skillVectors)
  console.log(`? Seeded ${skillVectors.length} skills`)

  // 2. Seed Skill Adjacency Matrix
  console.log(`\nSeeding skill adjacency relationships...`)
  
  const adjacencyVectors = []
  for (const [skillA, relationships] of Object.entries(adjacency)) {
    for (const [skillB, similarity] of Object.entries(relationships as Record<string, number>)) {
      const embedding = await embed(`${skillA} ${skillB} skill similarity ${similarity}`)
      
      adjacencyVectors.push({
        id: `adjacency:${skillA}:${skillB}`,
        values: embedding,
        metadata: {
          type: 'adjacency',
          skillA,
          skillB,
          similarity
        }
      })
    }
  }

  await index.upsert(adjacencyVectors)
  console.log(`? Seeded ${adjacencyVectors.length} skill relationships`)

  // 3. Seed Learning Resources
  console.log(`\nSeeding ${resources.length} learning resources...`)
  
  const resourceVectors = []
  for (const resource of resources) {
    for (const item of resource.resources) {
      const embedding = await embed(`${resource.skill} ${item.title} ${item.type} learning resource`)
      
      resourceVectors.push({
        id: `resource:${resource.skill.toLowerCase().replace(/\s+/g, '-')}:${Buffer.from(item.title).toString('base64').slice(0, 16)}`,
        values: embedding,
        metadata: {
          type: 'resource',
          skill: resource.skill,
          title: item.title,
          url: item.url,
          resourceType: item.type,
          quality: item.quality
        }
      })
    }

    if (resourceVectors.length % 10 === 0) {
      console.log(`  Processed ${resourceVectors.length} resources`)
    }
  }

  await index.upsert(resourceVectors)
  console.log(`? Seeded ${resourceVectors.length} learning resources`)

  console.log('\nPinecone seeding complete!')
  console.log('\nSummary:')
  console.log(`  Skills:          ${skillVectors.length}`)
  console.log(`  Relationships:   ${adjacencyVectors.length}`)
  console.log(`  Resources:       ${resourceVectors.length}`)
  console.log(`  Total vectors:   ${skillVectors.length + adjacencyVectors.length + resourceVectors.length}`)
  console.log(`  Dimensions:      768`)
  console.log(`  Model:           nomic-ai/nomic-embed-text-v1.5:free (100% FREE)`)
}

main().catch(error => {
  console.error('? Seeding failed:', error)
  process.exit(1)
})
