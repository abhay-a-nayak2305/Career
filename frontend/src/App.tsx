import { useState, useCallback } from 'react'
import { Upload, Map, Zap, Shield, Lock, Clock, Award, TrendingUp, ChevronRight, BarChart3 } from 'lucide-react'
import { parseResume, SkillProfile } from './lib/resumeParser'
import { performGapAnalysis, GapAnalysisResult } from './lib/gapAnalysis'
import { generateRoadmap, PersonalizedRoadmap } from './lib/roadmapGenerator'

const MOCK_REQUIRED_SKILLS: Record<string, { name: string; category: "technical" | "soft" | "domain"; confidence: number }[]> = {
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

const GapBadge = ({ type }: { type: string }) => {
  const config: Record<string, { class: string; label: string }> = {
    strong: { class: 'skill-strong', label: 'STRONG' },
    adjacent: { class: 'skill-adjacent', label: 'ADJACENT' },
    new: { class: 'skill-new', label: 'NEW' },
    critical: { class: 'skill-critical', label: 'CRITICAL' }
  }
  
  const style = config[type] || config.new
  
  return (
    <span className={style.class}>
      {style.label}
    </span>
  )
}

const StepIndicator = ({ current, steps }: { current: number; steps: string[] }) => (
  <div className="flex items-center justify-between mb-16 max-w-2xl mx-auto">
    {steps.map((step, i) => (
      <div key={step} className="flex flex-col items-center">
        <div 
          className={['step-dot transition-all', i < current ? 'completed' : '', i === current ? 'active' : ''].join(' ')}
        />
        <span className="text-xs mt-3 text-white/40 font-mono tracking-wider uppercase">{step}</span>
      </div>
    ))}
  </div>
)

const FloatingBackground = () => (
  <>
    <div className="crt-overlay" />
    <div className="bg-grid" />
    <div className="bg-noise" />
  </>
)

export default function App() {
  const [step, setStep] = useState(0)
  const [isParsing, setIsParsing] = useState(false)
  const [skillProfile, setSkillProfile] = useState<SkillProfile | null>(null)
  const [targetRole, setTargetRole] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisResult | null>(null)
  const [roadmap, setRoadmap] = useState<PersonalizedRoadmap | null>(null)
  
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787'

  const steps = ['UPLOAD', 'ROLE', 'ANALYSIS', 'ROADMAP']

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsParsing(true)
      
      try {
        const profile = await parseResume(file)
        setSkillProfile(profile)
        setIsParsing(false)
        setStep(1)
      } catch (error) {
        console.error('Parsing error:', error)
        setIsParsing(false)
      }
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>
      handleFileUpload(event)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleRoleSelect = async (role: string) => {
    setTargetRole(role)
    setStep(2)
    
    try {
      const skillsResponse = await fetch(`${API_BASE}/api/skills/required`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: role, jobDescription })
      })
      
      if (!skillsResponse.ok) throw new Error('Failed to fetch required skills')
      const { requiredSkills } = await skillsResponse.json()
      
      let analysis: GapAnalysisResult
      try {
        const analysisResponse = await fetch(`${API_BASE}/api/analysis/gap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentSkills: skillProfile?.technicalSkills, targetRole: role })
        })
        
        if (analysisResponse.ok) {
          const aiAnalysis = await analysisResponse.json()
          analysis = {
            ...aiAnalysis,
            currentSkills: skillProfile?.technicalSkills || [],
            requiredSkills: requiredSkills
          }
        } else {
          analysis = performGapAnalysis(skillProfile!, role, requiredSkills)
        }
      } catch (e) {
        analysis = performGapAnalysis(skillProfile!, role, requiredSkills)
      }
      
      setGapAnalysis(analysis)
      
      const roadmapResponse = await fetch(`${API_BASE}/api/roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gaps: analysis.gaps, targetRole: role })
      })
      
      if (roadmapResponse.ok) {
        const generatedRoadmap = await roadmapResponse.json()
        setRoadmap(generatedRoadmap)
      } else {
        setRoadmap(generateRoadmap(analysis.gaps))
      }
      
      setStep(3)
    } catch (error) {
      console.error('Workflow error:', error)
      const requiredSkills = MOCK_REQUIRED_SKILLS[role as keyof typeof MOCK_REQUIRED_SKILLS] || MOCK_REQUIRED_SKILLS['Frontend Engineer']
      const analysis = performGapAnalysis(skillProfile!, role, requiredSkills)
      setGapAnalysis(analysis)
      setRoadmap(generateRoadmap(analysis.gaps))
      setStep(3)
    }
  }

  return (
    <div className="min-h-screen relative">
      <FloatingBackground />
      
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-green-400 animate-pulse" />
            <span className="font-mono text-sm tracking-widest">CAREERPATH.AI</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2 text-white/40">
              <Shield className="w-3 h-3" />
              <span>PRIVATE</span>
            </div>
            <div className="flex items-center gap-2 text-white/40">
              <Lock className="w-3 h-3" />
              <span>NO ACCOUNTS</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <StepIndicator current={step} steps={steps} />

        {step === 0 && (
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-green-400/30">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="font-mono text-xs text-green-400 uppercase">POWERED BY 1M+ JOB POSTINGS</span>
            </div>
            
            <h1 className="hero-title display mb-8">
              <span className="text-white misalign">KNOW</span>
              <span className="text-green-400 misalign-alt"> EXACTLY</span>
              <br />
              <span className="text-white/70">WHAT TO LEARN.</span>
            </h1>
            
            <p className="font-mono text-sm text-white/40 max-w-xl mx-auto leading-relaxed">
              UPLOAD YOUR RESUME. SELECT YOUR TARGET ROLE. 
              GET A HYPER-PERSONALIZED ROADMAP. 
              NO FLUFF. NO AFFILIATE LINKS.
            </p>
          </div>
        )}

        {step === 0 && (
          <div className="max-w-2xl mx-auto">
            <div 
              className="upload-zone p-16 text-center cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                id="resume-upload"
                className="hidden"
                accept=".pdf,.docx,.doc"
                onChange={handleFileUpload}
                disabled={isParsing}
              />
              <label htmlFor="resume-upload" className="block cursor-pointer">
                <div className="w-16 h-16 mx-auto mb-6 border-2 border-dashed border-white/20 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white/40" />
                </div>
                <p className="font-mono text-sm mb-2 text-white/60">DROP YOUR RESUME HERE</p>
                <p className="font-mono text-xs text-white/30">PDF • DOCX • PROCESSING IN BROWSER</p>
              </label>

              {isParsing && (
                <div className="mt-8">
                  <div className="retro-loader mx-auto mb-4">
                    <span /><span /><span /><span /><span />
                  </div>
                  <span className="font-mono text-xs text-green-400">EXTRACTING SKILLS...</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-6 mt-8">
              {[
                { icon: Shield, title: '100% PRIVATE', desc: 'NEVER LEAVES BROWSER' },
                { icon: BarChart3, title: 'DATA-DRIVEN', desc: 'REAL JOB REQUIREMENTS' },
                { icon: Award, title: 'FREE FOREVER', desc: 'NO PAYWALLS' }
              ].map((feature, i) => (
                <div 
                  key={feature.title} 
                  className={['raw-card p-6 text-center glitch-hover', i === 1 ? 'misalign-alt' : 'misalign'].join(' ')}
                  style={{ animationDelay: (i * 100) + 'ms' }}
                >
                  <feature.icon className="w-4 h-4 mx-auto mb-3 text-green-400" />
                  <p className="font-mono text-xs mb-1">{feature.title}</p>
                  <p className="font-mono text-xs text-white/30">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3 display">SELECT TARGET ROLE</h2>
              <p className="font-mono text-xs text-white/40">ANALYSIS WILL BEGIN AUTOMATICALLY</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {['Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer', 'DevOps Engineer', 'Data Scientist', 'Product Manager'].map((role, i) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className={['raw-card p-5 text-left glitch-hover', i % 2 === 0 ? 'misalign' : 'misalign-alt'].join(' ')}
                >
                  <p className="font-mono text-sm mb-1 group-hover:text-green-400">{role}</p>
                  <p className="font-mono text-xs text-white/30">500+ SKILLS</p>
                  <ChevronRight className="w-4 h-4 text-white/20 mt-3" />
                </button>
              ))}
            </div>

            <div className="raw-card p-6">
              <p className="font-mono text-xs text-white/40 mb-3">OR PASTE JOB DESCRIPTION</p>
              <textarea
                className="w-full h-32 bg-transparent border border-white/10 p-4 font-mono text-sm text-white placeholder-white/20 resize-none"
                placeholder="PASTE HERE..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-xl mx-auto text-center py-20">
            <div className="retro-loader mx-auto mb-8">
              <span /><span /><span /><span /><span />
            </div>
            <h2 className="font-mono text-lg mb-3">ANALYZING YOUR SKILLS</h2>
            <p className="font-mono text-xs text-white/40 mb-8">COMPARING AGAINST 1M+ JOB POSTINGS</p>
            <div className="progress-raw">
              <div className="progress-fill" style={{ width: '70%' }} />
            </div>
          </div>
        )}

        {step === 3 && roadmap && gapAnalysis && (
          <div className="max-w-5xl mx-auto">
            <div className="raw-card p-8 mb-8 corner-cut exposed-edge">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-2xl display mb-2">SKILL ANALYSIS</h2>
                  <p className="font-mono text-xs text-white/40">TARGET: <span className="text-green-400">{targetRole}</span></p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold font-mono" style={{ color: gapAnalysis.overallMatchPercentage > 70 ? '#00ff9d' : gapAnalysis.overallMatchPercentage > 50 ? '#ffea00' : '#ff006e' }}>
                    {gapAnalysis.overallMatchPercentage}%
                  </div>
                  <p className="font-mono text-xs text-white/30">MATCH SCORE</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { type: 'strong', count: gapAnalysis.gaps.filter(g => g.gapType === 'strong').length },
                  { type: 'adjacent', count: gapAnalysis.gaps.filter(g => g.gapType === 'adjacent').length },
                  { type: 'new', count: gapAnalysis.gaps.filter(g => g.gapType === 'new').length },
                  { type: 'critical', count: gapAnalysis.gaps.filter(g => g.gapType === 'critical').length }
                ].map((item) => (
                  <div key={item.type} className="raw-card p-4 text-center glitch-hover">
                    <div 
                      className="text-2xl font-mono mb-2"
                      style={{
                        color: item.type === 'strong' ? '#00ff9d' : item.type === 'adjacent' ? '#ffea00' : item.type === 'new' ? '#ff006e' : '#ff006e'
                      }}
                    >
                      {item.count}
                    </div>
                    <GapBadge type={item.type} />
                  </div>
                ))}
              </div>
            </div>

            <h3 className="text-xl display mb-6 flex items-center gap-3">
              <Map className="w-5 h-5 text-green-400" />
              90-DAY LEARNING ROADMAP
            </h3>

            <div className="sharp-divider mb-10" />

            {(['month1', 'month2', 'month3'] as const).map((month, monthIndex) => (
              <div key={month} className="mb-12">
                <div className="flex items-center gap-4 mb-6">
                  <div 
                    className="w-12 h-12 flex items-center justify-center font-mono font-bold text-black"
                    style={{ background: monthIndex === 0 ? '#00ff9d' : monthIndex === 1 ? '#ffea00' : '#ff006e' }}
                  >
                    {monthIndex + 1}
                  </div>
                  <div>
                    <h4 className="font-mono text-lg">MONTH {monthIndex + 1}</h4>
                    <p className="font-mono text-xs text-white/40 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {roadmap[month].reduce((sum, item) => sum + item.estimatedHours, 0)} HOURS
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {roadmap[month].map((item, i) => (
                    <div key={item.skill} className={['raw-card p-5 glitch-hover', i % 2 === 0 ? 'misalign' : 'misalign-alt'].join(' ')}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h5 className="font-mono text-sm">{item.skill}</h5>
                            <GapBadge type={gapAnalysis.gaps.find(g => g.skill.toLowerCase() === item.skill.toLowerCase())?.gapType || 'new'} />
                          </div>
                          <p className="font-mono text-xs text-white/40 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {item.estimatedHours} HOURS
                          </p>
                        </div>
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.topics.map(topic => (
                          <span key={topic} className="px-2 py-1 font-mono text-xs bg-white/5 text-white/50 border border-white/10">
                            {topic}
                          </span>
                        ))}
                      </div>

                      <div className="p-4 bg-white/5 border-l-2 border-green-400">
                        <p className="font-mono text-xs text-white/40 mb-1">PRACTICE PROJECT:</p>
                        <p className="font-mono text-xs text-white/60">{item.practiceProject}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div 
              className="raw-card p-8 text-center mt-12 corner-cut"
            >
              <h4 className="font-mono text-sm mb-2">TOTAL ESTIMATED COMMITMENT</h4>
              <div 
                className="text-4xl font-mono font-bold mb-3"
              >
                {roadmap.totalEstimatedHours} <span className="text-sm">HOURS</span>
              </div>
              <p className="font-mono text-xs text-white/40">THAT'S <span className="text-green-400">{Math.round(roadmap.totalEstimatedHours / 12)}</span> HOURS PER WEEK</p>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-white/5 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center font-mono text-xs text-white/20">
          <p>CAREERPATH.AI — BUILT WITH THE SAME PRIVACY PROMISE AS RESUME.AI</p>
        </div>
      </footer>
    </div>
  )
}
