'use client'

import { Suspense, useEffect, useState } from 'react'
import { RecentSalesList } from './recent-sales-list'
import {getRecentSales} from "@/app/dashboard/actions";

interface Sale {
  id: string
  name: string
  email: string
  amount: number
  initials: string
}

export function RecentSales() {
  const [sales, setSales] = useState<Sale[]>([])

  useEffect(() => {
    getRecentSales().then(setSales)
  }, [])

  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="h-[400px] flex items-center justify-center">Loading...</div>}>
        <RecentSalesList sales={sales} />
      </Suspense>
    </div>
  )
}
