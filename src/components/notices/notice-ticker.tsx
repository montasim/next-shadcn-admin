'use client'

import { useEffect, useState } from 'react'
import { Megaphone } from 'lucide-react'

interface Notice {
  id: string
  title: string
  content: string
  order: number
}

interface NoticesResponse {
  success: boolean
  data: {
    notices: Notice[]
    total: number
  }
}

export function NoticeTicker() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchNotices() {
      try {
        const res = await fetch('/api/public/notices', {
          cache: 'no-store',
        })
        if (res.ok) {
          const data: NoticesResponse = await res.json()
          setNotices(data.data.notices)
        }
      } catch (error) {
        console.error('Failed to fetch notices:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotices()
  }, [])

  // Don't render anything while loading or if no notices
  if (isLoading || notices.length === 0) {
    return null
  }

  // Duplicate notices to create seamless loop
  const duplicatedNotices = [...notices, ...notices]

  return (
    <div className="w-full border-b bg-primary/5 dark:bg-primary/10">
      <div className="container mx-auto">
        <div className="flex items-center gap-4 overflow-hidden">
          {/* Icon Section */}
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 shrink-0">
            <Megaphone className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Notices</span>
          </div>

          {/* Scrolling Notices */}
          <div className="flex-1 overflow-hidden">
            <div className="notice-scroll-container">
              <div className="notice-scroll-content">
                {duplicatedNotices.map((notice, index) => (
                  <div key={`${notice.id}-${index}`} className="notice-item">
                    <span className="font-semibold text-primary">{notice.title}</span>
                    <span className="mx-2 text-muted-foreground">:</span>
                    <span>{notice.content}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .notice-scroll-container {
          overflow: hidden;
          white-space: nowrap;
        }

        .notice-scroll-content {
          display: inline-flex;
          animation: scroll 40s linear infinite;
        }

        .notice-scroll-container:hover .notice-scroll-content {
          animation-play-state: paused;
        }

        .notice-item {
          display: inline-flex;
          align-items: center;
          padding: 0.75rem 2rem;
          font-size: 0.875rem;
        }

        .notice-item:not(:last-child)::after {
          content: '•';
          margin-left: 2rem;
          color: hsl(var(--primary));
          font-weight: bold;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  )
}
