import { useState, useEffect, useCallback, useRef } from 'react'

// Types
export interface RevenueData {
  date: string
  revenue: number
  previousPeriod?: number
  orders: number
  averageOrderValue: number
}

export interface CustomerData {
  id: string
  name: string
  email: string
  totalOrders: number
  totalSpent: number
  lastVisit: string
  segment: 'vip' | 'regular' | 'at-risk' | 'churned'
  ltv: number
}

export interface DishData {
  id: string
  name: string
  category: string
  sales: number
  revenue: number
  cost: number
  margin: number
  trending: 'up' | 'down' | 'stable'
}

export interface OperationsData {
  tableTurnTime: number
  ticketTime: number
  staffPerformance: Array<{
    name: string
    role: string
    ordersHandled: number
    avgTimePerOrder: number
  }>
}

// Mock data generators
const generateRevenueData = (days: number): RevenueData[] => {
  const data: RevenueData[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const baseRevenue = 3000 + Math.random() * 4000
    const dayOfWeek = date.getDay()
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1
    const revenue = Math.round(baseRevenue * weekendMultiplier)
    data.push({
      date: date.toISOString().split('T')[0],
      revenue,
      previousPeriod: Math.round(revenue * (0.85 + Math.random() * 0.2)),
      orders: Math.round(revenue / 25),
      averageOrderValue: 22 + Math.random() * 10,
    })
  }
  return data
}

const generateCustomerData = (count: number): CustomerData[] => {
  const segments: CustomerData['segment'][] = ['vip', 'regular', 'at-risk', 'churned']
  const names = ['Emma Thompson', 'James Wilson', 'Sarah Chen', 'Michael Brown', 'Lisa Anderson',
    'David Kim', 'Jennifer Martinez', 'Robert Taylor', 'Amanda White', 'Christopher Lee']
  const emails = names.map(n => n.toLowerCase().replace(' ', '.') + '@email.com')

  return Array.from({ length: count }, (_, i) => {
    const segment = segments[Math.floor(Math.random() * segments.length)]
    const totalOrders = segment === 'vip' ? 20 + Math.floor(Math.random() * 30) :
      segment === 'regular' ? 5 + Math.floor(Math.random() * 15) :
        segment === 'at-risk' ? 2 + Math.floor(Math.random() * 5) :
          1 + Math.floor(Math.random() * 3)
    const avgOrder = segment === 'vip' ? 45 + Math.random() * 20 :
      segment === 'regular' ? 28 + Math.random() * 15 :
        segment === 'at-risk' ? 22 + Math.random() * 10 :
          18 + Math.random() * 8
    const lastVisitDaysAgo = segment === 'churned' ? 30 + Math.floor(Math.random() * 60) :
      segment === 'at-risk' ? 14 + Math.floor(Math.random() * 30) :
        Math.floor(Math.random() * 7)
    const lastVisit = new Date()
    lastVisit.setDate(lastVisit.getDate() - lastVisitDaysAgo)

    return {
      id: `cust-${i + 1}`,
      name: names[i % names.length],
      email: emails[i % emails.length],
      totalOrders,
      totalSpent: Math.round(totalOrders * avgOrder),
      lastVisit: lastVisit.toISOString().split('T')[0],
      segment,
      ltv: Math.round(totalOrders * avgOrder * (0.8 + Math.random() * 0.4)),
    }
  })
}

const generateDishData = (count: number): DishData[] => {
  const dishes = [
    { name: 'Grilled Salmon', category: 'Main', cost: 12, baseMargin: 65 },
    { name: 'Caesar Salad', category: 'Starter', cost: 4, baseMargin: 72 },
    { name: 'Ribeye Steak', category: 'Main', cost: 18, baseMargin: 58 },
    { name: 'Mushroom Risotto', category: 'Main', cost: 6, baseMargin: 70 },
    { name: 'Lobster Tail', category: 'Main', cost: 22, baseMargin: 55 },
    { name: 'Truffle Pasta', category: 'Main', cost: 8, baseMargin: 68 },
    { name: 'Tiramisu', category: 'Dessert', cost: 3, baseMargin: 75 },
    { name: 'Beef Burger', category: 'Main', cost: 5, baseMargin: 62 },
    { name: 'Fish & Chips', category: 'Main', cost: 6, baseMargin: 60 },
    { name: 'Chicken Parmesan', category: 'Main', cost: 7, baseMargin: 65 },
  ]

  return Array.from({ length: count }, (_, i) => {
    const dish = dishes[i % dishes.length]
    const basePrice = dish.cost / (1 - dish.baseMargin / 100)
    const sales = 50 + Math.floor(Math.random() * 200)
    const trendRoll = Math.random()
    return {
      id: `dish-${i + 1}`,
      name: dish.name + (i >= dishes.length ? ` ${Math.floor(i / dishes.length) + 1}` : ''),
      category: dish.category,
      sales,
      revenue: Math.round(sales * basePrice),
      cost: dish.cost,
      margin: dish.baseMargin + (Math.random() * 6 - 3),
      trending: trendRoll > 0.7 ? 'up' : trendRoll < 0.3 ? 'down' : 'stable',
    }
  })
}

const generateOperationsData = (): OperationsData => ({
  tableTurnTime: 45 + Math.random() * 20,
  ticketTime: 12 + Math.random() * 8,
  staffPerformance: [
    { name: 'Alex Rivera', role: 'Head Chef', ordersHandled: 85, avgTimePerOrder: 8.5 },
    { name: 'Maria Santos', role: 'Sous Chef', ordersHandled: 72, avgTimePerOrder: 10.2 },
    { name: 'James O\'Brien', role: 'Line Cook', ordersHandled: 95, avgTimePerOrder: 7.8 },
    { name: 'Chen Wei', role: 'Prep Cook', ordersHandled: 120, avgTimePerOrder: 5.5 },
    { name: 'Sophie Laurent', role: 'Pastry Chef', ordersHandled: 45, avgTimePerOrder: 12.0 },
  ],
})

// Custom hooks
export function useRevenue(days: number = 7, refreshInterval: number = 0) {
  const [data, setData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(() => {
    try {
      // Simulate API call
      setData(generateRevenueData(days))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch revenue data'))
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchData()
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refreshInterval])

  return { data, loading, error, refetch: fetchData }
}

export function useCustomers(count: number = 50) {
  const [data, setData] = useState<CustomerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    try {
      setData(generateCustomerData(count))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch customer data'))
    } finally {
      setLoading(false)
    }
  }, [count])

  return { data, loading, error }
}

export function useDishes(count: number = 10) {
  const [data, setData] = useState<DishData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    try {
      setData(generateDishData(count))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dish data'))
    } finally {
      setLoading(false)
    }
  }, [count])

  return { data, loading, error }
}

export function useOperations() {
  const [data, setData] = useState<OperationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    try {
      setData(generateOperationsData())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch operations data'))
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error }
}

export function useRealTimeUpdates<T>(
  fetchFn: () => Promise<T>,
  interval: number = 30000
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchFn()
      if (mountedRef.current) {
        setData(result)
        setLastUpdate(new Date())
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Update failed'))
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [fetchFn])

  useEffect(() => {
    mountedRef.current = true
    fetchData()
    const intervalId = setInterval(fetchData, interval)
    return () => {
      mountedRef.current = false
      clearInterval(intervalId)
    }
  }, [fetchData, interval])

  return { data, loading, error, lastUpdate, refetch: fetchData }
}
