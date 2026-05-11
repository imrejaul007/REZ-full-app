import { render, screen, fireEvent } from '@testing-library/react'
import { CategoryFilter } from '@/components/CategoryFilter'

describe('CategoryFilter', () => {
  it('renders all category options', () => {
    render(<CategoryFilter selected="all" onSelect={() => {}} />)
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Beauty')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Fitness')).toBeInTheDocument()
    expect(screen.getByText('Wellness')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('renders category emojis', () => {
    render(<CategoryFilter selected="all" onSelect={() => {}} />)
    expect(screen.getByText('✨')).toBeInTheDocument() // All
    expect(screen.getByText('💅')).toBeInTheDocument() // Beauty
    expect(screen.getByText('☕')).toBeInTheDocument() // Food
    expect(screen.getByText('💪')).toBeInTheDocument() // Fitness
    expect(screen.getByText('💆')).toBeInTheDocument() // Wellness
    expect(screen.getByText('🏠')).toBeInTheDocument() // Home
  })

  it('calls onSelect when category is clicked', () => {
    const onSelect = jest.fn()
    render(<CategoryFilter selected="all" onSelect={onSelect} />)

    fireEvent.click(screen.getByText('Beauty'))
    expect(onSelect).toHaveBeenCalledWith('beauty')
  })

  it('calls onSelect with correct key for each category', () => {
    const onSelect = jest.fn()
    render(<CategoryFilter selected="all" onSelect={onSelect} />)

    fireEvent.click(screen.getByText('Food'))
    expect(onSelect).toHaveBeenCalledWith('food')

    fireEvent.click(screen.getByText('Fitness'))
    expect(onSelect).toHaveBeenCalledWith('fitness')

    fireEvent.click(screen.getByText('Wellness'))
    expect(onSelect).toHaveBeenCalledWith('wellness')

    fireEvent.click(screen.getByText('Home'))
    expect(onSelect).toHaveBeenCalledWith('home')

    fireEvent.click(screen.getByText('All'))
    expect(onSelect).toHaveBeenCalledWith('all')
  })

  it('highlights selected category with purple background', () => {
    render(<CategoryFilter selected="beauty" onSelect={() => {}} />)
    const beautyButton = screen.getByText('Beauty').closest('button')
    expect(beautyButton).toHaveClass('bg-purple-600')
    expect(beautyButton).toHaveClass('text-white')
  })

  it('does not highlight unselected categories', () => {
    render(<CategoryFilter selected="food" onSelect={() => {}} />)
    const beautyButton = screen.getByText('Beauty').closest('button')
    expect(beautyButton).not.toHaveClass('bg-purple-600')
    expect(beautyButton).toHaveClass('bg-gray-100')
  })

  it('has scrollbar-hide class for horizontal scroll', () => {
    render(<CategoryFilter selected="all" onSelect={() => {}} />)
    const container = screen.getByText('All').parentElement?.parentElement
    expect(container).toHaveClass('scrollbar-hide')
  })
})
