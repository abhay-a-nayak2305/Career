import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'

dotenv.config()

const BATCH_SIZE = 10
const DELAY_BETWEEN_BATCHES = 1200 // 1.2s to stay under rate limit

async function main() {
  console.log('🚀 ESCO Seeding script starting...')
  if (!process.env.PINECONE_API_KEY) {
    console.error('❌ PINECONE_API_KEY required')
    process.exit(1)
  }

  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY
  })
  
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  const index = pinecone.index(process.env.PINECONE_INDEX || 'career-path')

  async function embed(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'openai/text-embedding-3-large',
        input: text,
        dimensions: 2048
      })
      // @ts-ignore
      return response.data[0].embedding
    } catch (error: any) {
      console.error(`  Embedding failed for text: "${text.substring(0, 30)}..." - Error: ${error.message}`)
      throw error
    }
  }

  async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  const skipSkills = process.argv.includes('--skip-skills') || process.argv.includes('--only-occupations')
  const skipOccupations = process.argv.includes('--skip-occupations') || process.argv.includes('--only-skills')

  const allSkills = []
  const allOccupations = []

  if (!skipSkills) {
    console.log('🔍 Fetching all skills from ESCO API...')
  
  // Fetch all ESCO skills (13,485 total)
  try {
    let nextUrl = `https://ec.europa.eu/esco/api/search?type=skill&limit=1000&language=en`
    
    while (nextUrl) {
      const response = await fetch(nextUrl)
      const data: any = await response.json()
      
      if (!data._embedded || !data._embedded.results) {
        console.log('  No more skills found in current path')
        break
      }
      
      const skills = data._embedded.results
      allSkills.push(...skills)
      console.log(`  Fetched ${allSkills.length} / ${data.total} skills...`)
      
      nextUrl = data._links?.next?.href || null
      if (nextUrl) await delay(500)
    }
  } catch (e) {
    console.error('❌ Failed to fetch skills from ESCO API:', e)
  }

  console.log(`✅ Total skills collected: ${allSkills.length}`)
  console.log('\n🧠 Generating embeddings and seeding Pinecone...')

  // Process in batches
  for (let i = 0; i < allSkills.length; i += BATCH_SIZE) {
    const batch = allSkills.slice(i, i + BATCH_SIZE)
    const vectors = []

    for (const skill of batch) {
      try {
        const name = skill.preferredLabel?.en || skill.title || 'Unknown Skill'
        const description = skill.description?.en?.literal || ''
        const skillText = `${name} ${description} skill`
        const embedding = await embed(skillText)

        vectors.push({
          id: `esco::skill::${skill.uri}`,
          values: embedding,
          metadata: {
            type: 'skill',
            source: 'esco',
            name: name,
            description: description,
            skillType: skill.skillType,
            reuseLevel: skill.reuseLevel,
            uri: skill.uri
          }
        })
      } catch (e: any) {
        // Silently skip failed embeddings
      }
    }

    if (vectors.length > 0) {
      try {
        await index.upsert(vectors)
        console.log(`  Seeded ${Math.min(i + BATCH_SIZE, allSkills.length)} / ${allSkills.length} skills`)
      } catch (upsertError: any) {
        console.error('  Pinecone upsert failed:', upsertError.message)
      }
      await delay(DELAY_BETWEEN_BATCHES) 
    }
  }
  } else {
    console.log('⏩ Skipping skills seeding...')
  }

  if (!skipOccupations) {
    console.log('\n🔗 Seeding occupations/roles...')
  // Fetch all 3,008 occupations
  try {
    let nextUrl = `https://ec.europa.eu/esco/api/search?type=occupation&limit=1000&language=en`
    
    while (nextUrl) {
      const response = await fetch(nextUrl)
      const data: any = await response.json()
      
      if (!data._embedded || !data._embedded.results) {
        console.log('  No more occupations found in current path')
        break
      }
      
      const occupations = data._embedded.results
      allOccupations.push(...occupations)
      console.log(`  Fetched ${allOccupations.length} / ${data.total} occupations...`)
      
      nextUrl = data._links?.next?.href || null
      if (nextUrl) await delay(500)
    }
  } catch (e) {
    console.error('❌ Failed to fetch occupations from ESCO API:', e)
  }

  console.log(`✅ Total occupations collected: ${allOccupations.length}`)

  // Seed occupations
  for (let i = 0; i < allOccupations.length; i += BATCH_SIZE) {
    const batch = allOccupations.slice(i, i + BATCH_SIZE)
    const vectors = []

    for (const role of batch) {
      try {
        const name = role.preferredLabel?.en || role.title || 'Unknown Occupation'
        const description = role.description?.en?.literal || ''
        const roleText = `${name} ${description} job role occupation`
        const embedding = await embed(roleText)

        vectors.push({
          id: `esco::occupation::${role.uri}`,
          values: embedding,
          metadata: {
            type: 'occupation',
            source: 'esco',
            name: name,
            description: description,
            iscoGroup: role.iscoGroup,
            uri: role.uri
          }
        })
      } catch (e) {
        console.error(`Failed to process role`)
      }
    }

    if (vectors.length > 0) {
      await index.upsert(vectors)
      console.log(`  Processed occupations ${Math.min(i + BATCH_SIZE, allOccupations.length)} / ${allOccupations.length}`)
      await delay(DELAY_BETWEEN_BATCHES)
    }
  }
  } else {
    console.log('⏩ Skipping occupations seeding...')
  }

  console.log('\n🎉 ESCO seeding complete!')
  console.log(`📊 Total skills seeded: ${allSkills.length}`)
  console.log(`📊 Total occupations seeded: ${allOccupations.length}`)
}

main().catch(console.error)
