const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'email',
  'phoneNumber',
  'ipAddress',
  'ip',
  'creditCard',
  'ssn',
  'token',
  'secret',
  'apiKey',
  'accessToken',
  'refreshToken',
]

/**
 * Redact sensitive information from activity logs
 */
export function redactSensitiveData(data: any): any {
  if (!data) return data

  if (typeof data === 'string') {
    return redactString(data)
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item))
  }

  if (typeof data === 'object') {
    const redacted: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_FIELDS.some(field =>
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        redacted[key] = '[REDACTED]'
      } else {
        redacted[key] = redactSensitiveData(value)
      }
    }
    return redacted
  }

  return data
}

/**
 * Redact a string that might contain sensitive info
 */
function redactString(str: string): string {
  // Check if it looks like an email
  if (str.includes('@') && str.includes('.')) {
    return redactEmail(str)
  }

  // Check if it looks like an IP address
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(str)) {
    return redactIP(str)
  }

  // Check if it looks like a credit card
  if (/^\d{13,19}$/.test(str) && str.length >= 13) {
    return '[REDACTED]'
  }

  return str
}

/**
 * Partially redact email (show first 2 chars)
 */
export function redactEmail(email: string): string {
  if (!email || !email.includes('@')) return '[REDACTED]'
  const [local, domain] = email.split('@')
  if (local.length <= 2) {
    return `**@${domain}`
  }
  return `${local.slice(0, 2)}***@${domain}`
}

/**
 * Partially redact IP address
 */
export function redactIP(ip: string): string {
  if (!ip) return '[REDACTED]'
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`
  }
  return '[REDACTED]'
}

/**
 * Redact IP address if present in metadata
 */
export function redactMetadata(metadata: any): any {
  if (!metadata) return metadata

  const redacted = { ...metadata }

  if (redacted.ipAddress) {
    redacted.ipAddress = redactIP(redacted.ipAddress)
  }

  if (redacted.ip) {
    redacted.ip = redactIP(redacted.ip)
  }

  if (redacted.email) {
    redacted.email = redactEmail(redacted.email)
  }

  return redacted
}
