import { useState, useEffect } from "react"
import { Mail, Globe } from "lucide-react"

interface ProfileCardProps {
  name?: string
  title?: string
  avatarUrl?: string
  backgroundUrl?: string
  likes?: number
  posts?: number
  views?: number
  instagramUrl?: string
  twitterUrl?: string
  threadsUrl?: string
  onClose?: () => void
}

export function ProfileCard({
  name = "Vora Counselor",
  title = "Senior Legal Associate focusing on AI-assisted research & simplicity.",
  avatarUrl = "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop",
  backgroundUrl = "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop",
  likes = 12400,
  posts = 342,
  views = 89200,
  instagramUrl = "#",
  twitterUrl = "#",
  threadsUrl = "#",
  onClose,
}: ProfileCardProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [expProgress, setExpProgress] = useState(0)
  const [animatedLikes, setAnimatedLikes] = useState(0)
  const [animatedPosts, setAnimatedPosts] = useState(0)
  const [animatedViews, setAnimatedViews] = useState(0)

  // Theme Constants
  const T = {
    bg: '#FFFFFF',
    text: '#333333',
    textMuted: '#6B7280',
    primary: '#D16F54',
    secondary: '#FDF0E7',
    border: '#E5E7EB'
  }

  // Animate experience bar
  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setExpProgress((prev) => {
          if (prev >= 65) {
            clearInterval(interval)
            return 65
          }
          return prev + 1
        })
      }, 20)
      return () => clearInterval(interval)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Animate counters
  useEffect(() => {
    const duration = 2000
    const steps = 60
    const stepDuration = duration / steps

    const likesIncrement = likes / steps
    const postsIncrement = posts / steps
    const viewsIncrement = views / steps

    let currentStep = 0

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        currentStep++
        setAnimatedLikes(Math.min(Math.floor(likesIncrement * currentStep), likes))
        setAnimatedPosts(Math.min(Math.floor(postsIncrement * currentStep), posts))
        setAnimatedViews(Math.min(Math.floor(viewsIncrement * currentStep), views))

        if (currentStep >= steps) {
          clearInterval(interval)
        }
      }, stepDuration)
      return () => clearInterval(interval)
    }, 500)

    return () => clearTimeout(timer)
  }, [likes, posts, views])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  return (
    <div className="w-full max-w-sm mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[2rem] overflow-hidden bg-white border border-gray-100">
      <div className="bg-white rounded-[2rem] overflow-hidden relative">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 z-10 w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm"
          >
            ✕
          </button>
        )}
        
        {/* Header with background */}
        <div className="relative h-32 bg-gray-100 overflow-hidden">
          <img
            src={backgroundUrl}
            alt="Background"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* Follow button */}
          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`absolute top-4 right-4 rounded-full px-5 py-1.5 text-sm font-medium transition-all duration-300 z-10 ${
              isFollowing
                ? "bg-white text-[#D16F54] border border-[#D16F54]"
                : "bg-[#D16F54] text-white hover:bg-[#B85D44]"
            }`}
          >
            {isFollowing ? "Connected" : "Connect"}
            <span className="ml-1 text-md font-bold">{isFollowing ? "✓" : "+"}</span>
          </button>
        </div>

        {/* Profile content */}
        <div className="px-6 pb-6 -mt-10 relative z-10">
          {/* Avatar */}
          <div className="relative w-20 h-20 mb-4">
            <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-white shadow-md">
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Experience bar */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Level 12</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D16F54] to-[#F2D1C9] transition-all duration-1000 ease-out"
                  style={{ width: `${expProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Name and title */}
          <h2 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">{name}</h2>
          <p className="text-gray-500 text-xs leading-relaxed mb-5">{title}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-5 py-3 border-t border-b border-gray-100">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800 mb-0.5">{formatNumber(animatedLikes)}</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Drafts</div>
            </div>
            <div className="text-center border-l border-r border-gray-100">
              <div className="text-lg font-bold text-gray-800 mb-0.5">{animatedPosts}</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Cases</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800 mb-0.5">{formatNumber(animatedViews)}</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Views</div>
            </div>
          </div>

          {/* Social icons */}
          <div className="flex justify-center gap-6">
            <a href={instagramUrl} className="p-2 text-gray-400 hover:text-[#D16F54] hover:bg-[#FDF0E7] rounded-full transition-all">
              <Mail className="w-4 h-4" />
            </a>
            <a href={twitterUrl} className="p-2 text-gray-400 hover:text-[#D16F54] hover:bg-[#FDF0E7] rounded-full transition-all">
              <Globe className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
