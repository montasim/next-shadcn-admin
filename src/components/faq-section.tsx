'use client'

import { ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

interface FAQ {
  id: string
  question: string
  answer: string
  isActive: boolean
  order: number
}

export function FAQSection() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/faq')
      const result = await response.json()
      if (result.success) {
        setFaqs(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = (index: number) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  if (loading) {
    return (
      <div className="mt-16">
        <h2 className="text-xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (faqs.length === 0) {
    return null
  }

  return (
    <div className="mt-16">
      <h2 className="text-xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {faqs.map((faq, index) => (
          <Collapsible
            key={faq.id}
            open={openItems[index]}
            onOpenChange={() => toggleItem(index)}
            className="border rounded-lg p-4"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between text-left font-medium p-0 hover:bg-transparent"
              >
                <span className="text-base">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 transition-transform duration-200 flex-shrink-0 ml-2 ${
                    openItems[index] ? 'transform rotate-180' : ''
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  )
}
