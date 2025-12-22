'use client'

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
import {useAuth} from "@/context/auth-context";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  // Determine if user has admin privileges
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  // Filter navigation groups based on user role
  let filteredNavGroups = []
  
  if (user) {
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
        {filteredNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
