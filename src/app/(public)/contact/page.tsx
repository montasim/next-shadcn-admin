'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { ContactPageSkeleton } from '@/components/contact/contact-page-skeleton'
import { Mail, MessageSquare, Twitter, Github, Facebook, Instagram, Linkedin, Loader2, Send } from 'lucide-react'
import Link from 'next/link'

// Form validation schema
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().max(200, 'Subject is too long').optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

interface SiteSettings {
  siteName: string
  supportEmail: string | null
  contactEmail: string | null
  socialTwitter: string | null
  socialGithub: string | null
  socialFacebook: string | null
  socialInstagram: string | null
  socialLinkedIn: string | null
}

export default function ContactPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/public/site/settings')
        const data = await response.json()
        if (data.success) {
          setSettings(data.data)
        } else {
          setError('Failed to load contact information')
        }
      } catch (err) {
        console.error('Error fetching site settings:', err)
        setError('Failed to load contact information')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Message sent successfully!',
          description: data.message || 'We will get back to you soon.',
        })
        form.reset()
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to send message',
          description: data.message || 'Please try again later.',
        })
      }
    } catch (err) {
      console.error('Error submitting contact form:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while sending your message. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const socialLinks = [
    { name: 'Twitter/X', icon: Twitter, url: settings?.socialTwitter, color: 'hover:text-blue-400' },
    { name: 'GitHub', icon: Github, url: settings?.socialGithub, color: 'hover:text-gray-700 dark:hover:text-gray-300' },
    { name: 'Facebook', icon: Facebook, url: settings?.socialFacebook, color: 'hover:text-blue-600' },
    { name: 'Instagram', icon: Instagram, url: settings?.socialInstagram, color: 'hover:text-pink-500' },
    { name: 'LinkedIn', icon: Linkedin, url: settings?.socialLinkedIn, color: 'hover:text-blue-700' },
  ].filter(link => link.url)

  if (loading) {
    return <ContactPageSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <main className="container mx-auto p-4 py-8 md:py-12">
          <div className="text-center py-16">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto p-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
                Contact Us
              </h1>
              <p className="text-muted-foreground">
                Get in touch with the {settings?.siteName || 'team'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your.email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="What is this regarding?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us more about your inquiry..."
                              className="min-h-[150px] resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact Info */}
          <div className="space-y-6">
            {/* Email Contacts */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4 text-primary" />
                  Email Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {settings?.supportEmail && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Support
                    </div>
                    <a
                      href={`mailto:${settings.supportEmail}`}
                      className="text-sm hover:text-primary transition-colors font-medium"
                    >
                      {settings.supportEmail}
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      For technical support and account-related issues
                    </p>
                  </div>
                )}

                {settings?.contactEmail && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      General Inquiries
                    </div>
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="text-sm hover:text-primary transition-colors font-medium"
                    >
                      {settings.contactEmail}
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      For business inquiries and general questions
                    </p>
                  </div>
                )}

                {!settings?.supportEmail && !settings?.contactEmail && (
                  <p className="text-sm text-muted-foreground">
                    No email contacts configured at this time.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Connect With Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                {socialLinks.length > 0 ? (
                  <div className="space-y-2">
                    {socialLinks.map((link) => {
                      const Icon = link.icon
                      return (
                        <a
                          key={link.name}
                          href={link.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors ${link.color}`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{link.name}</span>
                        </a>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No social media accounts configured at this time.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Info */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                We typically respond to all inquiries within 1-2 business days.
              </p>
              <p className="text-sm text-muted-foreground">
                For the fastest response, please include as much detail as possible in your message.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
