'use client'

interface Category {
  key: string
  label: string
  emoji: string
}

const CATEGORIES: Category[] = [
  { key: 'all', label: 'All', emoji: '✨' },
  { key: 'beauty', label: 'Beauty', emoji: '💅' },
  { key: 'food', label: 'Food', emoji: '☕' },
  { key: 'fitness', label: 'Fitness', emoji: '💪' },
  { key: 'wellness', label: 'Wellness', emoji: '💆' },
  { key: 'home', label: 'Home', emoji: '🏠' },
]

interface CategoryFilterProps {
  selected: string
  onSelect: (key: string) => void
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onSelect(cat.key)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
            selected === cat.key
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span>{cat.emoji}</span>
          <span className="text-sm font-medium">{cat.label}</span>
        </button>
      ))}
    </div>
  )
}
