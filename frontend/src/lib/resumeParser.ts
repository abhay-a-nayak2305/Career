import * as pdfjs from 'pdfjs-dist'

// Set worker from unpkg CDN for reliable version matching
// @ts-ignore
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export interface Skill {
  name: string
  category: 'technical' | 'soft' | 'domain'
  experienceYears?: number
  confidence: number
}

export interface Achievement {
  description: string
  metrics?: string
}

export interface SkillProfile {
  technicalSkills: Skill[]
  softSkills: Skill[]
  domainExperience: string[]
  achievements: Achievement[]
  experienceLevel: 'entry' | 'mid' | 'senior' | 'staff' | 'principal'
  totalYearsExperience: number
}

// Common technical skills for pattern matching
const TECHNICAL_SKILLS = new Set([
  'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++', 'c#', 'ruby', 'php',
  'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'remix',
  'node.js', 'express', 'nestjs', 'django', 'flask', 'fastapi', 'spring',
  'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
  'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'ansible',
  'git', 'ci/cd', 'github actions', 'jenkins', 'circleci',
  'graphql', 'rest api', 'grpc', 'websockets',
  'tailwindcss', 'css', 'html', 'sass', 'less'
])

const SOFT_SKILLS = new Set([
  'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
  'agile', 'scrum', 'project management', 'mentoring', 'code review',
  'technical writing', 'presentation', 'collaboration'
])

/**
 * Robust text extraction from files
 */
export async function extractText(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
      let fullText = ''
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const strings = content.items.map((item: any) => item.str)
        fullText += strings.join(' ') + '\n'
      }
      
      return fullText
    } catch (error) {
      console.error('PDF parsing failed, falling back to text:', error)
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      // Clean up text
      const cleanText = text.replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ')
      resolve(cleanText)
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

/**
 * Extract skills from resume text
 */
export function extractSkills(text: string): SkillProfile {
  const lowerText = text.toLowerCase()
  
  // Extract technical skills
  const technicalSkills: Skill[] = []
  TECHNICAL_SKILLS.forEach(skill => {
    if (lowerText.includes(skill)) {
      // Try to estimate experience years
      const yearsMatch = lowerText.match(new RegExp('(\\d+)\\s*(year|yr).*?' + skill.replace('.', '\\.'), 'i'))
      technicalSkills.push({
        name: skill,
        category: 'technical',
        experienceYears: yearsMatch ? parseInt(yearsMatch[1]) : undefined,
        confidence: 0.8
      })
    }
  })

  // Extract soft skills
  const softSkills: Skill[] = []
  SOFT_SKILLS.forEach(skill => {
    if (lowerText.includes(skill)) {
      softSkills.push({
        name: skill,
        category: 'soft',
        confidence: 0.7
      })
    }
  })

  // Extract achievements (look for bullet points with metrics)
  const achievements: Achievement[] = []
  const bulletPoints = text.match(/[•\-*]\s*(.*?)(?=\n|$)/g) || []
  bulletPoints.forEach(point => {
    const cleanPoint = point.replace(/^[•\-*]\s*/, '').trim()
    if (cleanPoint.length > 20) {
      const metrics = cleanPoint.match(/(\d+%|\d+x|\$\d+|\d+\+|\d+)\s*(increase|decrease|improved|reduced|saved|grew)/i)
      achievements.push({
        description: cleanPoint,
        metrics: metrics ? metrics[0] : undefined
      })
    }
  })

  // Estimate total years experience
  const yearMatches = lowerText.match(/(\d+)\+?\s*(years|yrs)/g)
  let totalYears = 0
  if (yearMatches) {
    const years = yearMatches.map(m => {
      const match = m.match(/\d+/)
      return match ? parseInt(match[0]) : 0
    })
    totalYears = Math.max(...years, 0)
  }

  // Determine experience level
  let experienceLevel: SkillProfile['experienceLevel'] = 'entry'
  if (totalYears >= 10) experienceLevel = 'principal'
  else if (totalYears >= 7) experienceLevel = 'staff'
  else if (totalYears >= 4) experienceLevel = 'senior'
  else if (totalYears >= 2) experienceLevel = 'mid'

  return {
    technicalSkills,
    softSkills,
    domainExperience: [],
    achievements,
    experienceLevel,
    totalYearsExperience: totalYears
  }
}

/**
 * Main parser function - client side only
 */
export async function parseResume(file: File): Promise<SkillProfile> {
  if (!file) {
    throw new Error('No file provided')
  }

  // Handle both PDF and DOCX as text for demo
  const text = await extractText(file)
  return extractSkills(text)
}
