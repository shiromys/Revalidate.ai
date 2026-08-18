'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type ChartData = {
  date: string
  signups: number
  revenue: number
  validations?: number
  count?: number
  total_validations?: number
  usages?: number
}

export default function DashboardCharts({ data }: { data: ChartData[] }) {
  
  const normalizedData = (data || []).map(d => ({
    date: d.date,
    signups: Number(d.signups) || 0,
    revenue: Number(d.revenue) || 0,
    validations: Number(d.validations ?? d.count ?? d.total_validations ?? d.usages ?? 0)
  }))

  return (
    <div className="w-full">
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm w-full">
        <h3 className="text-lg font-black text-zinc-900 mb-6 uppercase tracking-tight">Revenue / Top-ups ($)</h3>
        <div className="h-72 w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height={300} minWidth={0}>
            <BarChart data={normalizedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
              <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="revenue" name="Revenue ($)" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}