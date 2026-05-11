# REE Features Documentation

REE (Rule Execution Engine) provides business rule management through two administrative interfaces.

## File Structure

| File | Description | Theme |
|------|-------------|-------|
| `REE-Admin/ree-admin.html` | Lightweight rule management dashboard | Light (iOS style) |
| `REE-Dashboard/ree-dashboard.html` | Unified admin and real-time monitoring | Dark (terminal style) |

---

## Shared Features

### Rule Types
All rule types are consistent across both dashboards:
- **Commission** - Platform commission calculations
- **Cashback** - User cashback calculations
- **Reward** - Social/engagement rewards
- **Karma** - Impact/behavior scoring
- **Fraud Check** - Security/abuse prevention

### Coin Types
- REZ Coins
- Branded Coins
- Cashback
- Promo Coins

### API Endpoint
- Base URL: `http://localhost:4000/api`
- Fallback: Mock data when API unavailable

---

## REE Admin (`ree-admin.html`)

### Navigation Tabs

#### 1. Rules Tab
- **Rule List Display** - Grid of rule cards showing:
  - Rule name (clickable for editing)
  - Description
  - Rule type badge
  - Priority level
  - Active/Inactive status
- **Filtering** - Dropdown filter by rule type (All, Commission, Cashback, Reward, Karma, Fraud)

#### 2. Create Rule Tab
Form fields for creating new rules:
- **Rule Name** - Text input (e.g., "Gold Tier Cashback")
- **Rule Type** - Dropdown (commission, cashback, reward, karma, fraud_check)
- **Category** - Text input (e.g., "user", "merchant", "transaction")
- **Priority** - Number input (default: 10)
- **Coin Type** - Dropdown (REZ, Branded, Cashback, Promo)
- **Formula** - Text input (e.g., "amount * 0.05")

#### 3. Simulate Tab
**What-If Simulator** for testing rule changes:
- **Transaction Amount** - Number input (default: 500)
- **User Tier** - Dropdown:
  - Starter (0)
  - Active (5000)
  - Gold (25000)
  - Platinum (100000)
- **Output** - Displays:
  - Cashback amount and percentage
  - Social bonus
  - Total earnings

#### 4. Analytics Tab
**Stats Grid** (4 cards):
- Active Rules count
- Avg Cost per Transaction
- Rule Accuracy percentage
- Fraud Blocked Today count

**Recent Rule Executions** - Log of recent rule evaluations showing:
- Rule identifier
- Processing result
- Status (Applied/Passed)

---

## REE Dashboard (`ree-dashboard.html`)

### Navigation Tabs

#### 1. Rules Tab
Identical to REE Admin Rules + Create Rule + Simulate tabs combined.

**Sub-sections:**
- Business Rules grid with filtering
- Create New Rule form
- What-If Simulator

#### 2. Monitoring Tab
**Live Stats Grid** (6 metrics):
| Metric | ID | Description |
|--------|-----|-------------|
| Requests/sec | `rps` | Current request throughput |
| Avg Latency (p99) | `latency` | 99th percentile response time |
| Active Rules | `rules-count` | Total active rule count |
| Fraud Blocked | `fraud-count` | Fraud attempts blocked |
| Coins Issued Today | `coins-today` | Total coins issued |
| Active Users (5m) | `active-users` | Users active in last 5 minutes |

**Live Event Stream**
- Real-time scrolling event log
- Color-coded event types:
  - Green border: Success events
  - Red border: Error events
  - Yellow border: Warning events
  - Blue border: Info events
- Displays: timestamp, service name, message
- Auto-generates simulated events every 1 second
- Polls REE API every 3 seconds

**Coin Distribution**
- Visual progress bars for:
  - REZ Coins
  - Branded Coins
  - Cashback
  - Karma
  - Fraud Checks

**Business Rules Status**
- Grid showing status of each coin type
- Displays active status and average response time

#### 3. Analytics Tab
**Stats Grid** (4 metrics):
- Active Rules count
- Avg Cost per Transaction
- Rule Accuracy percentage
- Fraud Blocked Today

**Rule Execution History**
- List of recent rule executions with:
  - Rule identifier (e.g., "commission.rule_1")
  - Result/value processed
  - Status indicator

**Performance Metrics**
- Total Executions Today
- Avg Execution Time
- Cache Hit Rate
- Error Rate

**Coin Issuance Summary**
- Visual bars with amounts for:
  - REZ Coins (Rs 45,230)
  - Branded Coins (Rs 18,450)
  - Cashback (Rs 32,100)
  - Karma Points (8,920 pts)

---

## Mock Data

Both dashboards fall back to these mock rules when API is unavailable:

| ID | Type | Category | Name | Priority | Description |
|----|------|----------|------|----------|-------------|
| 1 | commission | merchant | Restaurant Commission | 10 | Platform takes 12% commission |
| 2 | cashback | user | Gold Cashback | 20 | Gold tier gets 6% cashback |
| 3 | reward | social | Social Share Bonus | 15 | 5% bonus for verified shares |
| 4 | fraud_check | system | Rapid Click Detection | 100 | Block >10 clicks in 30s |
| 5 | karma | impact | Volunteer Hours | 5 | 15 karma per volunteer hour |
| 6 | cashback | user | First Purchase Bonus | 25 | 10% cashback on first transaction |
| 7 | commission | merchant | Premium Merchant Rate | 8 | 8% commission for verified merchants |

---

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/rules` | GET | Fetch all rules |
| `/admin/rules` | POST | Create new rule |
| `/query/cashback` | POST | Simulate cashback calculation |
| `/features/tiers/user` | GET | Fetch user tier information |

---

## Design Differences

| Aspect | REE Admin | REE Dashboard |
|--------|-----------|---------------|
| Theme | Light (#f5f5f7) | Dark (#0a0a0f) |
| Primary Color | Blue (#007aff) | Blue (#4488ff) |
| Accent Color | Purple gradient | Neon green/red |
| Stats Grid | 4 columns | 6 columns (Monitoring) |
| Event Stream | None | Real-time scrolling |
| Coin Distribution | None | Progress bars |
| Auto-polling | None | 3-second intervals |
| Event Simulation | None | 1-second intervals |
