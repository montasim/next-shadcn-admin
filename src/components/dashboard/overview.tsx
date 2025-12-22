'use client'

import { Suspense, useEffect, useState } from 'react'
import { OverviewChart } from './overview-chart'
import { Card } from '../ui/card'
import {getOverviewData} from "@/app/dashboard/actions";

export function Overview() {
  const [data, setData] = useState<Array<{ name: string; total: number }>>([])

  useEffect(() => {
    getOverviewData().then(setData)
  }, [])

  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="h-[350px] flex items-center justify-center">Loading...</div>}>
        <OverviewChart data={data} />
      </Suspense>
    </div>
  )
}
