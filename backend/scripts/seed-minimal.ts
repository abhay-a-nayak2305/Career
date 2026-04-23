import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  if (!process.env.PINECONE_API_KEY) {
    console.error('PINECONE_API_KEY environment variable is required')
    process.exit(1)
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY environment variable is required')
    process.exit(1)
  }

  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY
  })
  
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  const indexName = process.env.PINECONE_INDEX || 'careerpath-ai'
  
  console.log('Connecting to Pinecone index:', indexName)
  const index = pinecone.Index(indexName)

  async function embed(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'nomic-ai/nomic-embed-text-v1.5:free',
      input: text,
      dimensions: 768
    })
    return response.data[0].embedding
  }

  // 1. Seed Skills
  console.log('Seeding skills...')
  
  const skills = [
    { name: 'JavaScript', category: 'language', difficulty: 2, prerequisites: [], popularity: 0.98 },
    { name: 'TypeScript', category: 'language', difficulty: 3, prerequisites: ['JavaScript'], popularity: 0.92 },
    { name: 'Python', category: 'language', difficulty: 2, prerequisites: [], popularity: 0.95 },
    { name: 'React', category: 'frontend', difficulty: 3, prerequisites: ['JavaScript'], popularity: 0.94 },
    { name: 'Next.js', category: 'frontend', difficulty: 3, prerequisites: ['React'], popularity: 0.88 },
    { name: 'Node.js', category: 'backend', difficulty: 3, prerequisites: ['JavaScript'], popularity: 0.92 },
    { name: 'PostgreSQL', category: 'database', difficulty: 3, prerequisites: ['SQL'], popularity: 0.88 },
    { name: 'Docker', category: 'devops', difficulty: 2, prerequisites: [], popularity: 0.88 },
    { name: 'Git', category: 'devops', difficulty: 2, prerequisites: [], popularity: 0.97 }
  ]

  const skillVectors = []
  for (const skill of skills) {
    const embedding = await embed(${skill.name}  programming skill)
    skillVectors.push({
      id: skill:,
      values: embedding,
      metadata: {
        type: 'skill',
        ...skill,
        prerequisites: skill.prerequisites.join(',')
      }
    })
    console.log(  Processed: )
  }

  await index.upsert(skillVectors)
  console.log('Seeded', skillVectors.length, 'skills')

  // 2. Seed Adjacency
  console.log('Seeding skill relationships...')
  
  const adjacency = [
    { from: 'react', to: 'vue', similarity: 0.7 },
    { from: 'javascript', to: 'typescript', similarity: 0.8 },
    { from: 'python', to: 'go', similarity: 0.5 },
    { from: 'docker', to: 'kubernetes', similarity: 0.6 },
    { from: 'react', to: 'next.js', similarity: 0.8 }
  ]

  const adjacencyVectors = []
  for (const rel of adjacency) {
    const embedding = await embed(${rel.from}  skill similarity)
    adjacencyVectors.push({
      id: djacency::,
      values: embedding,
      metadata: { type: 'adjacency', ...rel }
    })
  }

  await index.upsert(adjacencyVectors)
  console.log('Seeded', adjacencyVectors.length, 'relationships')

  // 3. Seed Resources
  console.log('Seeding learning resources...')
  
  const resources = [
    { skill: 'JavaScript', title: 'JavaScript Info', url: 'https://javascript.info/', type: 'documentation', quality: 10 },
    { skill: 'React', title: 'React Docs', url: 'https://react.dev/learn', type: 'documentation', quality: 10 },
    { skill: 'TypeScript', title: 'TypeScript Docs', url: 'https://www.typescriptlang.org/docs/', type: 'documentation', quality: 10 },
    { skill: 'Node.js', title: 'Node.js Docs', url: 'https://nodejs.org/docs/', type: 'documentation', quality: 9 }
  ]

  const resourceVectors = []
  for (const resource of resources) {
    const embedding = await embed(${resource.skill}  learning resource)
    resourceVectors.push({
      id: esource::,
      values: embedding,
      metadata: { type: 'resource', ...resource }
    })
  }

  await index.upsert(resourceVectors)
  console.log('Seeded', resourceVectors.length, 'resources')

  console.log('\nPinecone seeding complete!')
  console.log('Total vectors:', skillVectors.length + adjacencyVectors.length + resourceVectors.length)
}

main().catch(error => {
  console.error('Seeding failed:', error)
  process.exit(1)
})
