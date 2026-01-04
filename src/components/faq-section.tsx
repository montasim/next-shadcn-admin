'use client'

import { ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const faqs = [
  {
    question: "Can I change my plan later?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, you'll receive credit towards future billing periods."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards including Visa, Mastercard, American Express, and Discover. Payments are processed securely through Stripe."
  },
  {
    question: "Is there a free trial?",
    answer: "We offer a 14-day free trial for both Premium and Premium Plus plans. You can explore all premium features before committing to a subscription."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely! You can cancel your subscription at any time. Your access will continue until the end of your current billing period."
  },
  {
    question: "How do I access my books?",
    answer: "Once you subscribe, you'll have instant access to our entire library through your account. You can read on any device with our responsive design."
  },
  {
    question: "Are there any hidden fees?",
    answer: "No! The price you see is the price you pay. There are no setup fees, cancellation fees, or hidden charges. What you see in your pricing plan is exactly what you'll be billed."
  },
  {
    question: "Can I share my account?",
    answer: "Each subscription is for individual use. If you're interested in team or family plans, please contact our support for custom solutions."
  },
  {
    question: "What if I need technical support?",
    answer: "Our support team is available 24/7 to help you with any technical issues. You can reach us through the contact form in your account settings."
  }
]

export function FAQSection() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const toggleItem = (index: number) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {faqs.map((faq, index) => (
          <Collapsible
            key={index}
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
