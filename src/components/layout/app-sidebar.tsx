'use client'

import { useState, useEffect } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '../ui/sidebar'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { sidebarData } from './data/sidebar-data'
import {useAuth} from "@/context/auth-context"
import type { NavGroup as NavGroupType } from './types'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  // Fix hydration mismatch by only rendering after client mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Determine if user has admin privileges
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  // Filter navigation groups based on user role
  let filteredNavGroups: NavGroupType[] = []

  if (isMounted && user) {
    if (isAdmin) {
      // Admin: show all groups, but remove redundant Dashboard from "Other" group
      filteredNavGroups = sidebarData.navGroups.map(group => {
        if (group.title === 'Other') {
          return {
            ...group,
            items: group.items.filter(item => item.title !== 'Dashboard')
          }
        }
        return group
      })
    } else {
      // Regular User: show only "Other" group (which now includes Dashboard)
      filteredNavGroups = sidebarData.navGroups.filter(group => group.title === 'Other')
    }
  }

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {isMounted && filteredNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        {isMounted && user && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
