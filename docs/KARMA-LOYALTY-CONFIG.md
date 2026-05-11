# Karma-Loyalty Configuration Guide

## Overview

All coin values are configurable from the admin dashboard.

## Settings

### Base Coin Rate
- **Coins per Rs.X spent** - Set how many rupees = 1 coin
- Default: 1 coin per Rs.20 spent

### Karma Multipliers
| Level | Multiplier | Description |
|-------|-----------|-------------|
| starter | 1.0x | New users |
| active | 1.1x | Active users |
| contributor | 1.25x | Contributing users |
| leader | 1.5x | Leaders |
| elite | 2.0x | Top users |

### Loyalty Multipliers
| Tier | Multiplier | Description |
|------|-------------|-------------|
| bronze | 1.0x | New customers |
| silver | 1.1x | Returning customers |
| gold | 1.2x | Loyal customers |
| platinum | 1.5x | VIP customers |
| diamond | 2.0x | Top customers |

### Offer Bonuses
| Level | Bonus | Description |
|-------|-------|-------------|
| starter | 0% | No bonus |
| active | 0% | No bonus |
| contributor | 5% | Better offers |
| leader | 10% | Much better offers |
| elite | 20% | Best offers |

## API Endpoints

### GET /api/karma-loyalty/config
Get current configuration

### PUT /api/karma-loyalty/config
Update configuration (admin only)

## Environment Variables

```env
KARMA_LOYALTY_API_URL=https://api.rez.money
```
