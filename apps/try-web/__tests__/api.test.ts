import { MOCK_DATA } from '@/lib/mockData'

describe('Mock Data', () => {
  describe('Trials', () => {
    it('has trials array', () => {
      expect(Array.isArray(MOCK_DATA.trials)).toBe(true)
      expect(MOCK_DATA.trials.length).toBeGreaterThan(0)
    })

    it('has required trial properties', () => {
      const trial = MOCK_DATA.trials[0]
      expect(trial).toHaveProperty('id')
      expect(trial).toHaveProperty('title')
      expect(trial).toHaveProperty('coinPrice')
      expect(trial).toHaveProperty('originalPrice')
      expect(trial).toHaveProperty('merchant')
    })

    it('has valid trial coin prices', () => {
      MOCK_DATA.trials.forEach((trial) => {
        expect(trial.coinPrice).toBeGreaterThan(0)
        expect(trial.originalPrice).toBeGreaterThan(0)
        expect(trial.coinPrice).toBeLessThan(trial.originalPrice)
      })
    })

    it('has valid merchant data for each trial', () => {
      MOCK_DATA.trials.forEach((trial) => {
        expect(trial.merchant).toHaveProperty('id')
        expect(trial.merchant).toHaveProperty('name')
        expect(typeof trial.merchant.name).toBe('string')
        expect(trial.merchant.name.length).toBeGreaterThan(0)
      })
    })

    it('has valid slot data', () => {
      MOCK_DATA.trials.forEach((trial) => {
        expect(trial.slotsRemaining).toBeGreaterThanOrEqual(0)
        expect(trial.slotsTotal).toBeGreaterThan(0)
        expect(trial.slotsRemaining).toBeLessThanOrEqual(trial.slotsTotal)
      })
    })
  })

  describe('Coins', () => {
    it('has coins data with required properties', () => {
      expect(MOCK_DATA.coins).toHaveProperty('totalBalance')
      expect(MOCK_DATA.coins).toHaveProperty('buckets')
      expect(MOCK_DATA.coins).toHaveProperty('recentTransactions')
    })

    it('has valid total balance', () => {
      expect(typeof MOCK_DATA.coins.totalBalance).toBe('number')
      expect(MOCK_DATA.coins.totalBalance).toBeGreaterThanOrEqual(0)
    })

    it('has valid coin buckets with expiry dates', () => {
      MOCK_DATA.coins.buckets.forEach((bucket) => {
        expect(bucket).toHaveProperty('amount')
        expect(bucket).toHaveProperty('expiresAt')
        expect(new Date(bucket.expiresAt).getTime()).toBeGreaterThan(Date.now())
      })
    })

    it('has valid transaction history', () => {
      MOCK_DATA.coins.recentTransactions.forEach((tx) => {
        expect(tx).toHaveProperty('id')
        expect(tx).toHaveProperty('type')
        expect(tx).toHaveProperty('amount')
        expect(tx).toHaveProperty('description')
        expect(tx).toHaveProperty('date')
        expect(['earn', 'spend', 'expire']).toContain(tx.type)
      })
    })
  })

  describe('Score', () => {
    it('has score data with valid tier', () => {
      expect(MOCK_DATA.score).toHaveProperty('score')
      expect(MOCK_DATA.score).toHaveProperty('tier')
      const validTiers = ['curious', 'explorer', 'adventurer', 'pioneer']
      expect(validTiers).toContain(MOCK_DATA.score.tier)
    })

    it('has valid score stats', () => {
      expect(MOCK_DATA.score.stats).toHaveProperty('categoriesTried')
      expect(MOCK_DATA.score.stats).toHaveProperty('merchantsDiscovered')
      expect(MOCK_DATA.score.stats).toHaveProperty('currentStreak')
      expect(MOCK_DATA.score.stats).toHaveProperty('reviewsGiven')
    })

    it('has tier progression data', () => {
      expect(MOCK_DATA.score).toHaveProperty('nextTierPoints')
      expect(MOCK_DATA.score).toHaveProperty('nextTierName')
      expect(MOCK_DATA.score.nextTierPoints).toBeGreaterThan(MOCK_DATA.score.score)
    })
  })

  describe('History', () => {
    it('has history array', () => {
      expect(Array.isArray(MOCK_DATA.history)).toBe(true)
      expect(MOCK_DATA.history.length).toBeGreaterThan(0)
    })

    it('has valid history items', () => {
      MOCK_DATA.history.forEach((item) => {
        expect(item).toHaveProperty('bookingId')
        expect(item).toHaveProperty('trialId')
        expect(item).toHaveProperty('title')
        expect(item).toHaveProperty('merchant')
        expect(item).toHaveProperty('coinsPaid')
        expect(item).toHaveProperty('commitmentFeePaid')
        expect(item).toHaveProperty('status')
        expect(['active', 'completed', 'expired']).toContain(item.status)
      })
    })
  })

  describe('Missions', () => {
    it('has missions array', () => {
      expect(Array.isArray(MOCK_DATA.missions)).toBe(true)
    })

    it('has valid mission structure when missions exist', () => {
      MOCK_DATA.missions.forEach((mission) => {
        expect(mission).toHaveProperty('id')
        expect(mission).toHaveProperty('title')
        expect(mission).toHaveProperty('target')
        expect(mission).toHaveProperty('completed')
        expect(mission).toHaveProperty('isCompleted')
        expect(mission).toHaveProperty('isExpired')
        expect(mission.target).toBeGreaterThan(0)
      })
    })
  })

  describe('Badges', () => {
    it('has badges data', () => {
      expect(MOCK_DATA.badges).toHaveProperty('earned')
      expect(MOCK_DATA.badges).toHaveProperty('undiscovered')
    })

    it('has valid earned badges', () => {
      MOCK_DATA.badges.earned.forEach((badge) => {
        expect(badge).toHaveProperty('category')
        expect(badge).toHaveProperty('level')
        expect(badge).toHaveProperty('trialCount')
        expect(badge).toHaveProperty('nextLevelThreshold')
        const validLevels = ['Newcomer', 'Regular', 'Expert', 'Master']
        expect(validLevels).toContain(badge.level)
      })
    })
  })

  describe('Leaderboard', () => {
    it('has leaderboard data', () => {
      expect(MOCK_DATA.leaderboard).toHaveProperty('entries')
      expect(MOCK_DATA.leaderboard).toHaveProperty('userRank')
      expect(MOCK_DATA.leaderboard).toHaveProperty('userScore')
    })

    it('has valid leaderboard entries', () => {
      MOCK_DATA.leaderboard.entries.forEach((entry) => {
        expect(entry).toHaveProperty('rank')
        expect(entry).toHaveProperty('name')
        expect(entry).toHaveProperty('score')
        expect(entry).toHaveProperty('trialCount')
      })
    })
  })

  describe('Surprise', () => {
    it('has surprise data', () => {
      expect(MOCK_DATA.surprise).toHaveProperty('category')
      expect(MOCK_DATA.surprise).toHaveProperty('expiresAt')
    })
  })

  describe('Bundles', () => {
    it('has bundles array', () => {
      expect(Array.isArray(MOCK_DATA.bundles)).toBe(true)
    })

    it('has valid bundle structure', () => {
      MOCK_DATA.bundles.forEach((bundle) => {
        expect(bundle).toHaveProperty('id')
        expect(bundle).toHaveProperty('name')
        expect(bundle).toHaveProperty('price')
        expect(bundle).toHaveProperty('originalPrice')
        expect(bundle.price).toBeLessThan(bundle.originalPrice)
      })
    })
  })

  describe('Campaigns', () => {
    it('has campaigns array', () => {
      expect(Array.isArray(MOCK_DATA.campaigns)).toBe(true)
    })

    it('has valid campaign structure', () => {
      MOCK_DATA.campaigns.forEach((campaign) => {
        expect(campaign).toHaveProperty('id')
        expect(campaign).toHaveProperty('title')
        expect(campaign).toHaveProperty('type')
        expect(campaign).toHaveProperty('goal')
        expect(campaign).toHaveProperty('reward')
        expect(campaign).toHaveProperty('isJoined')
        expect(campaign).toHaveProperty('isCompleted')
      })
    })
  })
})
