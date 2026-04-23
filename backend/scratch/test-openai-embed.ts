import OpenAI from 'openai'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY
  })

  try {
    console.log('Testing with openai/text-embedding-3-small...')
    const res = await openai.embeddings.create({
      model: 'openai/text-embedding-3-small',
      input: 'test'
    })
    console.log('Success! Dimensions:', res.data[0].embedding.length)
  } catch (e: any) {
    console.error('Failed:', e.message)
  }
}

main()
