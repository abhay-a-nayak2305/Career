import { SkillGap } from './gapAnalysis'

export interface RoadmapItem {
  skill: string
  topics: string[]
  resources: Array<{
    title: string
    url: string
    type: 'documentation' | 'tutorial' | 'course' | 'video'
  }>
  practiceProject: string
  estimatedHours: number
  milestone: string
  phase: 'month1' | 'month2' | 'month3'
}

export interface PersonalizedRoadmap {
  month1: RoadmapItem[]
  month2: RoadmapItem[]
  month3: RoadmapItem[]
  totalEstimatedHours: number
  keyMilestones: string[]
}

// Skill topic breakdowns - what exactly to learn
const SKILL_TOPICS: Record<string, string[]> = {
  'react': ['Components & Props', 'Hooks (useState, useEffect)', 'State Management', 'Performance Optimization', 'Testing'],
  'typescript': ['Basic Types', 'Interfaces & Types', 'Generics', 'Utility Types', 'Type Guards'],
  'next.js': ['Routing', 'Data Fetching', 'Server Components', 'Deployment', 'Optimizations'],
  'node.js': ['Event Loop', 'Express.js', 'Middleware', 'Error Handling', 'Authentication'],
  'postgresql': ['Basic Queries', 'Joins', 'Indexes', 'Transactions', 'Performance Tuning'],
  'docker': ['Containers vs VMs', 'Dockerfile', 'Compose', 'Networks', 'Volumes'],
  'kubernetes': ['Pods', 'Deployments', 'Services', 'Ingress', 'Helm Charts'],
  'aws': ['EC2', 'S3', 'Lambda', 'API Gateway', 'IAM'],
  'python': ['Data Structures', 'Functions', 'OOP', 'Decorators', 'Async/Await'],
  'tailwindcss': ['Utility First', 'Responsive Design', 'Dark Mode', 'Custom Config', 'Plugins']
}

// Curated free resources for each skill
const SKILL_RESOURCES: Record<string, Array<{ title: string; url: string; type: 'documentation' | 'tutorial' | 'course' | 'video' }>> = {
  'react': [
    { title: 'React Official Docs', url: 'https://react.dev/learn', type: 'documentation' },
    { title: 'React Beta Tutorial', url: 'https://react.dev/tutorial', type: 'tutorial' },
    { title: 'Fireship React Course', url: 'https://www.youtube.com/watch?v=TNhaISOUy6Q', type: 'video' }
  ],
  'typescript': [
    { title: 'TypeScript Docs', url: 'https://www.typescriptlang.org/docs/', type: 'documentation' },
    { title: 'Total TypeScript', url: 'https://www.totaltypescript.com/tutorials', type: 'course' },
    { title: 'TypeScript Crash Course', url: 'https://www.youtube.com/watch?v=BCg4U1FzODs', type: 'video' }
  ],
  'next.js': [
    { title: 'Next.js Docs', url: 'https://nextjs.org/docs', type: 'documentation' },
    { title: 'Next.js Learn', url: 'https://nextjs.org/learn', type: 'course' }
  ],
  'node.js': [
    { title: 'Node.js Docs', url: 'https://nodejs.org/docs/latest/api/', type: 'documentation' },
    { title: 'Express Guide', url: 'https://expressjs.com/en/guide/routing.html', type: 'tutorial' }
  ],
  'postgresql': [
    { title: 'PostgreSQL Docs', url: 'https://www.postgresql.org/docs/', type: 'documentation' },
    { title: 'Postgres Tutorial', url: 'https://www.postgresqltutorial.com/', type: 'tutorial' }
  ],
  'docker': [
    { title: 'Docker Docs', url: 'https://docs.docker.com/', type: 'documentation' },
    { title: 'Docker for Beginners', url: 'https://docker-curriculum.com/', type: 'course' }
  ],
  'kubernetes': [
    { title: 'Kubernetes Docs', url: 'https://kubernetes.io/docs/', type: 'documentation' },
    { title: 'Kubernetes Tutorial', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', type: 'tutorial' }
  ]
}

// Practice projects for each skill
const PRACTICE_PROJECTS: Record<string, string> = {
  'react': 'Build a todo app with filtering and local storage persistence',
  'typescript': 'Convert an existing JavaScript project to TypeScript with strict mode',
  'next.js': 'Build a blog with dynamic routes and markdown content',
  'node.js': 'Build a REST API with authentication and CRUD operations',
  'postgresql': 'Design and implement a database schema for an e-commerce site',
  'docker': 'Containerize a full stack application with docker-compose',
  'kubernetes': 'Deploy a microservices application to a local Kubernetes cluster',
  'aws': 'Build a serverless API with Lambda, API Gateway, and DynamoDB',
  'python': 'Build a data processing pipeline with pandas',
  'tailwindcss': 'Recreate a popular website homepage using only Tailwind'
}

/**
 * Generate a personalized 90-day roadmap based on skill gaps
 */
export function generateRoadmap(gaps: SkillGap[]): PersonalizedRoadmap {
  // Sort gaps by priority (critical first, then by learning efficiency)
  const sortedGaps = [...gaps].sort((a, b) => {
    // Critical first
    if (a.required && !b.required) return -1
    if (!a.required && b.required) return 1
    
    // Then by learning efficiency (hours per priority point)
    const aEfficiency = a.priority / Math.max(a.estimatedLearningHours, 1)
    const bEfficiency = b.priority / Math.max(b.estimatedLearningHours, 1)
    
    return bEfficiency - aEfficiency
  })

  // Distribute skills across 3 months
  // Month 1: Critical gaps and highest efficiency skills
  // Month 2: Medium priority and skill multipliers
  // Month 3: Nice-to-have and complementary skills
  
  const month1: RoadmapItem[] = []
  const month2: RoadmapItem[] = []
  const month3: RoadmapItem[] = []
  
  let month1Hours = 0
  let month2Hours = 0
  let month3Hours = 0
  
  // Assume ~80 hours per month of focused learning
  const MONTHLY_HOUR_CAP = 80

  sortedGaps.forEach(gap => {
    const item: RoadmapItem = {
      skill: gap.skill,
      topics: SKILL_TOPICS[gap.skill.toLowerCase()] || ['Core concepts', 'Advanced patterns', 'Best practices', 'Real-world application'],
      resources: SKILL_RESOURCES[gap.skill.toLowerCase()] || [
        { title: 'Official Documentation', url: '#', type: 'documentation' },
        { title: 'Recommended Tutorial', url: '#', type: 'tutorial' }
      ],
      practiceProject: PRACTICE_PROJECTS[gap.skill.toLowerCase()] || `Build a small project using ${gap.skill}`,
      estimatedHours: gap.estimatedLearningHours,
      milestone: `Successfully build ${PRACTICE_PROJECTS[gap.skill.toLowerCase()] || 'a practical project'}`,
      phase: 'month1'
    }

    // Assign to appropriate month
    if (month1Hours + gap.estimatedLearningHours <= MONTHLY_HOUR_CAP && (gap.required || gap.gapType === 'critical')) {
      item.phase = 'month1'
      month1.push(item)
      month1Hours += gap.estimatedLearningHours
    } else if (month2Hours + gap.estimatedLearningHours <= MONTHLY_HOUR_CAP) {
      item.phase = 'month2'
      month2.push(item)
      month2Hours += gap.estimatedLearningHours
    } else if (month3Hours + gap.estimatedLearningHours <= MONTHLY_HOUR_CAP) {
      item.phase = 'month3'
      month3.push(item)
      month3Hours += gap.estimatedLearningHours
    }
  })

  const totalEstimatedHours = month1Hours + month2Hours + month3Hours
  
  const keyMilestones = [
    `Month 1: Complete ${month1.length} critical skills, ${month1Hours} hours`,
    `Month 2: Complete ${month2.length} secondary skills, ${month2Hours} hours`,
    `Month 3: Complete ${month3.length} advanced skills, ${month3Hours} hours`,
    `Total: ${totalEstimatedHours} hours of focused learning`
  ]

  return {
    month1,
    month2,
    month3,
    totalEstimatedHours,
    keyMilestones
  }
}
