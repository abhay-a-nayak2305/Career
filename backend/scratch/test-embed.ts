import OpenAI from 'openai'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY
  })

  try {
    console.log('Testing with :free suffix...')
    const res1 = await openai.embeddings.create({
      model: 'nomic-ai/nomic-embed-text-v1.5:free',
      input: 'test',
      dimensions: 768
    })
    console.log('Success with :free!')
  } catch (e: any) {
    console.error('Failed with :free:', e.message)
  }

  try {
    console.log('Testing without :free suffix...')
    const res2 = await openai.embeddings.create({
      model: 'nomic-ai/nomic-embed-text-v1.5',
      input: 'test',
      dimensions: 768
    })
    console.log('Success without :free!')
  } catch (e: any) {
    console.error('Failed without :free:', e.message)
  }
}

main()
