import { SkillProfile, Skill } from './resumeParser'

export type GapType = 'strong' | 'adjacent' | 'new' | 'critical'

export interface SkillGap {
  skill: string
  gapType: GapType
  required: boolean
  priority: number
  similarity: number
  estimatedLearningHours: number
  prerequisiteSkills: string[]
}

export interface GapAnalysisResult {
  currentSkills: Skill[]
  requiredSkills: Skill[]
  gaps: SkillGap[]
  overallMatchPercentage: number
  criticalGapsCount: number
}

// Skill adjacency matrix - how similar skills are (0-1)
// This represents how much existing knowledge transfers
const SKILL_ADJACENCY: Record<string, Record<string, number>> = {
  'react': {
    'vue': 0.7,
    'angular': 0.5,
    'svelte': 0.6,
    'next.js': 0.8,
    'remix': 0.75,
    'typescript': 0.6,
    'javascript': 0.9
  },
  'javascript': {
    'typescript': 0.8,
    'python': 0.4,
    'go': 0.3,
    'rust': 0.2,
    'node.js': 0.7
  },
  'python': {
    'go': 0.5,
    'rust': 0.3,
    'java': 0.4,
    'r': 0.6,
    'tensorflow': 0.5,
    'pytorch': 0.5
  },
  'node.js': {
    'express': 0.8,
    'nestjs': 0.7,
    'django': 0.4,
    'flask': 0.5
  },
  'postgresql': {
    'mysql': 0.7,
    'mongodb': 0.4,
    'cassandra': 0.3,
    'redis': 0.4
  },
  'docker': {
    'kubernetes': 0.6,
    'aws': 0.5,
    'terraform': 0.5,
    'gcp': 0.4
  },
  'aws': {
    'gcp': 0.7,
    'azure': 0.7,
    'kubernetes': 0.5
  }
}

// Base learning hours for each skill (assuming 40hr work week focus)
const BASE_LEARNING_HOURS: Record<string, number> = {
  'javascript': 80,
  'typescript': 40,
  'react': 60,
  'vue': 50,
  'angular': 100,
  'next.js': 40,
  'node.js': 60,
  'python': 80,
  'go': 80,
  'rust': 160,
  'postgresql': 60,
  'mongodb': 40,
  'redis': 30,
  'docker': 40,
  'kubernetes': 120,
  'aws': 120,
  'terraform': 60,
  'tailwindcss': 20,
  'graphql': 40,
  'git': 30
}

// Critical skills for roles - these are must-haves
const CRITICAL_SKILLS: Record<string, string[]> = {
  'frontend-engineer': ['javascript', 'react', 'html', 'css', 'typescript'],
  'backend-engineer': ['node.js', 'python', 'postgresql', 'rest api', 'git'],
  'full-stack-engineer': ['javascript', 'react', 'node.js', 'postgresql', 'git'],
  'devops-engineer': ['docker', 'kubernetes', 'aws', 'linux', 'terraform'],
  'data-scientist': ['python', 'sql', 'machine learning', 'pandas', 'tensorflow']
}

/**
 * Calculate similarity between a known skill and target skill
 */
function calculateSkillSimilarity(userSkill: string, targetSkill: string): number {
  const user = userSkill.toLowerCase();
  const target = targetSkill.toLowerCase();
  
  if (user === target) return 1.0
  
  // Substring matching for ESCO skills (e.g. "javascript" inside "JavaScript Framework")
  if (target.includes(user)) return 0.8
  if (user.includes(target)) return 0.8
  
  const adjacency = SKILL_ADJACENCY[user]?.[target]
  if (adjacency !== undefined) return adjacency
  
  // Check reverse direction
  const reverseAdjacency = SKILL_ADJACENCY[target]?.[user]
  if (reverseAdjacency !== undefined) return reverseAdjacency
  
  // Default low similarity
  return 0.1
}

/**
 * Find the highest similarity score between user's skills and a target skill
 */
function findBestSimilarity(userSkills: Skill[], targetSkill: string): { similarity: number; closestSkill?: string } {
  let bestSimilarity = 0
  let closestSkill: string | undefined
  
  userSkills.forEach(userSkill => {
    const similarity = calculateSkillSimilarity(userSkill.name, targetSkill)
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity
      closestSkill = userSkill.name
    }
  })
  
  return { similarity: bestSimilarity, closestSkill }
}

/**
 * Calculate estimated learning hours considering existing skills
 */
function calculateLearningHours(targetSkill: string, similarity: number): number {
  const baseHours = BASE_LEARNING_HOURS[targetSkill.toLowerCase()] || 80
  return Math.round(baseHours * (1 - similarity))
}

/**
 * Determine gap type based on similarity
 */
function determineGapType(similarity: number, isCritical: boolean): GapType {
  // If the skill is a very strong match (>80%), it's Strong
  if (similarity >= 0.8) return 'strong'
  
  // If it's a critical skill but similarity is low, mark as Critical
  if (isCritical && similarity < 0.4) return 'critical'
  
  // If it's somewhat similar, it's Adjacent
  if (similarity >= 0.3) return 'adjacent'
  
  // Otherwise it's a completely New skill needed
  return 'new'
}

/**
 * Perform gap analysis between user profile and target role
 */
export function performGapAnalysis(
  userProfile: SkillProfile,
  targetRole: string,
  requiredSkills: Skill[]
): GapAnalysisResult {
  // Create a more robust slug for role matching
  const roleSlug = targetRole.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  
  // Map target roles to our critical skills map
  const roleMapping: Record<string, string> = {
    'frontend-engineer': 'frontend-engineer',
    'backend-engineer': 'backend-engineer',
    'full-stack-engineer': 'full-stack-engineer',
    'devops-engineer': 'devops-engineer',
    'data-scientist': 'data-scientist',
    'accounting-analyst': 'backend-engineer' // Fallback example
  }
  
  const mappedRole = roleMapping[roleSlug] || roleSlug
  const criticalSkills = CRITICAL_SKILLS[mappedRole] || []
  
  const gaps: SkillGap[] = requiredSkills.map(requiredSkill => {
    const { similarity, closestSkill } = findBestSimilarity(userProfile.technicalSkills, requiredSkill.name)
    const isCritical = criticalSkills.includes(requiredSkill.name.toLowerCase()) || requiredSkill.confidence > 0.9
    const gapType = determineGapType(similarity, isCritical)
    
    return {
      skill: requiredSkill.name,
      gapType,
      required: isCritical,
      priority: isCritical ? 10 : (1 - similarity) * 5,
      similarity,
      estimatedLearningHours: calculateLearningHours(requiredSkill.name, similarity),
      prerequisiteSkills: closestSkill ? [closestSkill] : []
    }
  })

  // Calculate overall match percentage (weighted towards critical skills)
  const totalSkillScore = gaps.reduce((sum, gap) => {
    const weight = gap.required ? 2 : 1
    return sum + (gap.similarity * weight)
  }, 0)
  const totalWeight = gaps.reduce((sum, gap) => sum + (gap.required ? 2 : 1), 0)
  
  const overallMatchPercentage = totalWeight > 0 
    ? Math.round((totalSkillScore / totalWeight) * 100)
    : 0
  
  const criticalGapsCount = gaps.filter(g => g.gapType === 'critical').length

  return {
    currentSkills: userProfile.technicalSkills,
    requiredSkills,
    gaps: gaps.sort((a, b) => b.priority - a.priority),
    overallMatchPercentage,
    criticalGapsCount
  }
}
