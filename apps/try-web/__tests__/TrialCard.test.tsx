import { render, screen } from '@testing-library/react'
import { TrialCard } from '@/components/TrialCard'
import { TrialCard as TrialCardType } from '@/lib/types'

const mockTrial: TrialCardType = {
  id: '1',
  title: 'Full Spa Massage Experience',
  category: 'Wellness',
  categoryEmoji: '💆',
  merchant: { id: 'm1', name: 'Serenity Spa', image: '' },
  image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
  coinPrice: 80,
  commitmentFee: 49,
  originalPrice: 599,
  distance: 1.2,
  distanceUnit: 'km',
  slotsRemaining: 5,
  slotsTotal: 20,
  rating: 4.8,
  ratingCount: 124,
  rewards: { coinsEarned: 50, brandedCoinsEarned: 20 },
}

describe('TrialCard', () => {
  it('renders trial title', () => {
    render(<TrialCard trial={mockTrial} />)
    expect(screen.getByText('Full Spa Massage Experience')).toBeInTheDocument()
  })

  it('renders merchant name', () => {
    render(<TrialCard trial={mockTrial} />)
    expect(screen.getByText('Serenity Spa')).toBeInTheDocument()
  })

  it('renders coin price with coin emoji', () => {
    render(<TrialCard trial={mockTrial} />)
    expect(screen.getByText(/80.*🪙/)).toBeInTheDocument()
  })

  it('renders original price with rupee symbol', () => {
    render(<TrialCard trial={mockTrial} />)
    expect(screen.getByText(/₹599/)).toBeInTheDocument()
  })

  it('shows limited slots badge when slots <= 5', () => {
    render(<TrialCard trial={mockTrial} />)
    expect(screen.getByText(/Only 5 left/)).toBeInTheDocument()
  })

  it('does not show limited slots badge when slots > 5', () => {
    const trialWithMoreSlots = { ...mockTrial, slotsRemaining: 10 }
    render(<TrialCard trial={trialWithMoreSlots} />)
    expect(screen.queryByText(/Only.*left/)).not.toBeInTheDocument()
  })

  it('renders category badge with emoji', () => {
    render(<TrialCard trial={mockTrial} />)
    expect(screen.getByText('💆')).toBeInTheDocument()
    expect(screen.getByText('Wellness')).toBeInTheDocument()
  })

  it('renders rating when available', () => {
    render(<TrialCard trial={mockTrial} />)
    expect(screen.getByText('4.8')).toBeInTheDocument()
    expect(screen.getByText('(124)')).toBeInTheDocument()
  })

  it('renders distance', () => {
    render(<TrialCard trial={mockTrial} />)
    expect(screen.getByText('1.2 km')).toBeInTheDocument()
  })

  it('renders commitment fee', () => {
    render(<TrialCard trial={mockTrial} />)
    expect(screen.getByText('+ ₹49 refundable')).toBeInTheDocument()
  })

  it('renders discount percentage', () => {
    render(<TrialCard trial={mockTrial} />)
    // (1 - 80/599) * 100 = 86.64... rounded to 87
    expect(screen.getByText('87% off')).toBeInTheDocument()
  })

  it('has a link to trial detail page', () => {
    render(<TrialCard trial={mockTrial} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/trial/1')
  })
})
