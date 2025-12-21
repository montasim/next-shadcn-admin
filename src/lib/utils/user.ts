/**
 * User utility functions for handling user data and display formatting
 */

export interface UserBasicInfo {
  firstName?: string | null
  lastName?: string | null
  name?: string
  email: string
}

/**
 * Generates user initials for avatar display
 *
 * @param user - User object containing name, firstName, lastName, and email
 * @returns Two-character uppercase string for avatar fallback
 *
 * Priority:
 * 1. First character of firstName + First character of lastName
 * 2. First two characters of firstName
 * 3. First two characters of name
 * 4. First two characters of email
 */
export function getUserInitials(user: UserBasicInfo): string {
  // First character of firstName + First character of lastName
  if (user.firstName && user.lastName) {
    return (user.firstName[0] + user.lastName[0]).toUpperCase()
  }

  // First two characters of firstName
  if (user.firstName) {
    return user.firstName.substring(0, 2).toUpperCase()
  }

  // First two characters of name
  if (user.name) {
    return user.name.substring(0, 2).toUpperCase()
  }

  // First two characters of email (ultimate fallback)
  return user.email.substring(0, 2).toUpperCase()
}

/**
 * Generates a user display name with fallbacks
 *
 * @param user - User object containing name, firstName, lastName, username, and email
 * @returns Display name string
 *
 * Priority:
 * 1. firstName + lastName
 * 2. firstName
 * 3. lastName
 * 4. username
 * 5. First part of email before @
 * 6. "User"
 */
export function getUserDisplayName(user: {
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  name?: string
  email: string
}): string {
  // firstName + lastName
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  }

  // firstName
  if (user.firstName) {
    return user.firstName
  }

  // lastName
  if (user.lastName) {
    return user.lastName
  }

  // username
  if (user.username) {
    return user.username
  }

  // First part of email before @
  if (user.name) {
    return user.name
  }

  return user.email.split('@')[0] || 'User'
}