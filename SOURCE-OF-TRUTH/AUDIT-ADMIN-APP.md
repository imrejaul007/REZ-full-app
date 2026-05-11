# Admin App Feature Audit Report

**Audit Date:** 2026-05-05
**Auditor:** Claude Code
**Directories Audited:**
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/`
- `/Users/rejaulkarim/Documents/ReZ Full App/REZ-admin-dashboard/`
- `/Users/rejaulkarim/Documents/ReZ Full App/REE-Dashboard/`

---

## Executive Summary

The ReZ Admin App ecosystem consists of **3 components**:
1. **rez-app-admin** - Primary React Native/Expo admin application (160+ screens)
2. **REZ-admin-dashboard** - Simple HTML admin interface
3. **REE-Dashboard** - ReZ Economic Engine HTML dashboard for rule management

---

## 1. User & Merchant Management

### 1.1 User Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | User Management |
| **Description** | Full CRUD operations for platform users including search, filter, suspend/unsuspend |
| **Operations Benefit** | Enables support staff to manage user accounts, verify identity, and handle suspensions |
| **Connections** | Users API, UserWallets API, FraudQueue |
| **Issues** | None found |

**Capabilities:**
- Search users by name, email, phone
- Filter by role (user/merchant/admin) and status (active/suspended)
- View user wallet balance
- Suspend users with required reason (Sprint 14 feature)
- Unsuspend previously blocked users
- View user tier (Starter/Bronze/Silver/Gold/Platinum/Diamond)
- View segment (verified_student, verified_employee)
- Check flagged status

---

### 1.2 Merchant Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Merchant Management |
| **Description** | Full merchant lifecycle management - approval workflow, KYC, suspensions |
| **Operations Benefit** | Controls merchant onboarding and ongoing merchant relationship management |
| **Connections** | Merchants API, MerchantWallets API |
| **Issues** | None found |

**Capabilities:**
- List merchants with status filter (all/pending/approved/suspended)
- Search by name, email, phone
- Approve pending merchants
- Reject merchants with reason
- Suspend merchants with reason
- Reactivate suspended merchants
- Create new merchants (admin only)
- View merchant wallet balance and statistics
- Toggle store REZ Program enrollment
- Configure store prep time (wait minutes)
- View bank details (masked)

---

### 1.3 Orders Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Order Management |
| **Description** | View and manage all platform orders across fulfillment types |
| **Operations Benefit** | Enables operations team to handle order disputes, refunds, and status updates |
| **Connections** | Orders API |
| **Issues** | None found |

**Capabilities:**
- List orders with status filter (placed/confirmed/preparing/ready/dispatched/delivered/cancelled/returned/refunded)
- Filter by fulfillment type (delivery/pickup/drive_thru/dine_in/web_menu)
- Search by order number
- View order details (items, totals, payment status)
- Update order status (with valid transitions)
- Refund orders with amount and reason
- Cancel orders with reason
- View platform fees and merchant payouts
- View lock fees and coin usage
- View cashback earned

---

## 2. Fraud & Security

### 2.1 Fraud Queue
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Fraud Detection Queue |
| **Description** | Monitor and review users flagged for suspicious coin-earning activity |
| **Operations Benefit** | Prevents coin abuse through statistical anomaly detection (z-score analysis) |
| **Connections** | Users API (fraud endpoints) |
| **Issues** | None found |

**Capabilities:**
- Auto-refresh every 30 seconds
- View fraud summary (all/pending/cleared/suspended counts)
- Search by name, email, phone, user ID
- Filter by review status (all/pending/cleared)
- View risk level (Critical/High Risk/Review based on z-score)
- View coins earned in last 24 hours
- View flagged timestamp
- Clear fraud flags (approve user)
- Suspend flagged users directly from queue
- Navigate to user details page

---

### 2.2 Fraud Alerts
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Fraud Alerts |
| **Description** | View fraud alerts across the platform |
| **Operations Benefit** | Real-time visibility into fraud attempts |
| **Connections** | Fraud Reports API |
| **Issues** | None found |

---

### 2.3 Fraud Reports
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Fraud Reports |
| **Description** | Detailed fraud investigation reports |
| **Operations Benefit** | Documentation and analysis of fraud cases |
| **Connections** | Fraud Reports API |
| **Issues** | None found |

---

### 2.4 Fraud Configuration
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Fraud Rule Configuration |
| **Description** | Configure fraud detection rules and thresholds |
| **Operations Benefit** | Tune fraud detection sensitivity per business needs |
| **Connections** | Fraud Config API |
| **Issues** | None found |

---

### 2.5 Device Security
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Device Security Management |
| **Description** | Monitor and block suspicious devices |
| **Operations Benefit** | Prevent device-based fraud and multi-accounting |
| **Connections** | Device Security API |
| **Issues** | None found |

---

## 3. Wallet & Financial Operations

### 3.1 Wallet Adjustment (Super Admin)
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Wallet Adjustment Operations |
| **Description** | Maker-checker wallet operations for dispute resolution |
| **Operations Benefit** | Enables authorized staff to credit/debit wallets with audit trail |
| **Connections** | UserWallets API, AdminActions API |
| **Issues** | Security: Requires biometric auth for amounts >= 50,000 NC |

**Capabilities:**
- Search users for wallet operations
- Credit user wallet
- Debit user wallet
- Reverse cashback transactions
- Freeze/unfreeze wallets
- View audit trail per user
- View action history with status filtering
- Pending approvals queue (maker-checker workflow)
- Self-approval prevention
- Maximum amount validation (1,000,000 NC limit)

---

### 3.2 Wallet Configuration
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Wallet Configuration |
| **Description** | Configure wallet behavior and limits |
| **Operations Benefit** | System-wide wallet policy management |
| **Connections** | Platform Config API |
| **Issues** | None found |

---

### 3.3 Coin Rewards Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Coin Rewards Approval |
| **Description** | Review and approve pending coin reward requests |
| **Operations Benefit** | Controls coin issuance to prevent abuse |
| **Connections** | Coin Rewards API |
| **Issues** | None found |

---

### 3.4 Coin Governor
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Coin Emission Governor |
| **Description** | Control and monitor coin issuance rates |
| **Operations Benefit** | Prevents runaway inflation of platform coins |
| **Connections** | Coin Governor API |
| **Issues** | None found |

---

## 4. Promotional Campaigns

### 4.1 Campaign Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Campaign Management |
| **Description** | Create and manage promotional campaigns with deals |
| **Operations Benefit** | Enables marketing team to run promotions efficiently |
| **Connections** | Campaigns API |
| **Issues** | Cashback capped at 15% in UI (backend allows up to 20%) |

**Capabilities:**
- List campaigns with tab filters (all/running/upcoming/expired/inactive)
- Search campaigns
- Create new campaigns with:
  - Title, subtitle, description
  - Banner and icon images (with upload)
  - Gradient colors
  - Campaign type
  - Start/end dates and times
  - Priority level
  - Region targeting
  - Deals (store-specific cashback/coins/discounts)
- Edit existing campaigns
- Toggle campaign active/inactive status
- Duplicate campaigns
- Delete campaigns
- Manage campaign deals:
  - Store selection
  - Cashback percentage
  - Coins bonus
  - Discount percentage
  - Bonus offers
  - Coin drops
  - End time configuration

---

### 4.2 Bonus Zone
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Bonus Zone Management |
| **Description** | Manage bonus campaigns with budget tracking |
| **Operations Benefit** | Run funded promotional campaigns with budget controls |
| **Connections** | BonusZone API |
| **Issues** | None found |

**Capabilities:**
- List bonus campaigns
- Filter by status (active/paused)
- Search campaigns
- View budget consumption
- Toggle campaign status (freeze/resume)
- View funding source and partner

---

### 4.3 Coin Gifts
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Coin Gifting |
| **Description** | Manage coin gift campaigns |
| **Operations Benefit** | Run gifting promotions |
| **Connections** | CoinGifts API |
| **Issues** | None found |

---

### 4.4 Surprise Coin Drops
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Surprise Coin Drops |
| **Description** | Configure surprise reward distributions |
| **Operations Benefit** | Gamification and user engagement |
| **Connections** | CoinDrops API |
| **Issues** | None found |

---

### 4.5 Extra Rewards
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Extra Rewards Management |
| **Description** | Configure additional reward mechanisms |
| **Operations Benefit** | Layered reward system for user engagement |
| **Connections** | ExtraRewards API |
| **Issues** | None found |

---

## 5. Gamification

### 5.1 Achievements
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Achievement System |
| **Description** | Configure and manage user achievements |
| **Operations Benefit** | Drive engagement through gamification |
| **Connections** | Achievements API |
| **Issues** | None found |

---

### 5.2 Challenges
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Challenge System |
| **Description** | Create and manage user challenges |
| **Operations Benefit** | Time-bound goals for user engagement |
| **Connections** | Challenges API |
| **Issues** | None found |

---

### 5.3 Tournaments
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Tournament Management |
| **Description** | Create competitive tournaments |
| **Operations Benefit** | Competitive engagement features |
| **Connections** | Tournaments API |
| **Issues** | None found |

---

### 5.4 Leaderboard Configuration
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Leaderboard Configuration |
| **Description** | Configure leaderboard rules and displays |
| **Operations Benefit** | Competitive rankings drive engagement |
| **Connections** | LeaderboardConfig API |
| **Issues** | None found |

---

### 5.5 Game Configuration
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Game Configuration |
| **Description** | Configure mini-games and interactive experiences |
| **Operations Benefit** | Entertainment and engagement features |
| **Connections** | GameConfig API |
| **Issues** | None found |

---

### 5.6 Daily Check-in Configuration
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Daily Check-in Rewards |
| **Description** | Configure daily login reward system |
| **Operations Benefit** | Retention through habit formation |
| **Connections** | DailyCheckinConfig API |
| **Issues** | None found |

---

### 5.7 Loyalty Milestones
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Loyalty Milestones |
| **Description** | Configure loyalty tier milestones |
| **Operations Benefit** | Long-term user retention |
| **Connections** | LoyaltyMilestones API |
| **Issues** | None found |

---

### 5.8 Loyalty System
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Loyalty Program |
| **Description** | Core loyalty program management |
| **Operations Benefit** | Retention and rewards program |
| **Connections** | Loyalty API |
| **Issues** | None found |

---

## 6. Notifications & Communication

### 6.1 Notification Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Notification Management |
| **Description** | Create, manage, and send push/email/SMS notifications |
| **Operations Benefit** | Direct user communication capabilities |
| **Connections** | Notification API |
| **Issues** | None found |

**Capabilities:**
- View notification templates
- Filter by channel (push/email/sms)
- Create notification templates with:
  - Title and body text
  - Channel selection
  - Category tags
  - Variable placeholders ({{variable}})
  - Active/inactive toggle
- Edit existing templates
- Delete templates
- Send notifications to:
  - All users
  - User segments
  - Single users
- View notification statistics

---

### 6.2 Broadcast
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Broadcast Messages |
| **Description** | Mass messaging capabilities |
| **Operations Benefit** | Platform-wide announcements |
| **Connections** | Broadcast API |
| **Issues** | None found |

---

## 7. Business Intelligence & Analytics

### 7.1 Analytics Dashboard
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Analytics Dashboard |
| **Description** | Platform-wide metrics and insights |
| **Operations Benefit** | Executive visibility into platform health |
| **Connections** | Dashboard API, Analytics API |
| **Issues** | None found |

**Capabilities:**
- Platform overview metrics:
  - Total users / Active merchants / Orders today / GMV today
- User growth chart (7-day)
- Top merchants by revenue
- Suspicious activity log
- Platform revenue trend (30 days)
- Quick navigation to deep-dive analytics

---

### 7.2 Business Metrics
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Business Metrics |
| **Description** | Detailed business performance metrics |
| **Operations Benefit** | Granular business analysis |
| **Connections** | Business Metrics API |
| **Issues** | None found |

---

### 7.3 Revenue Reports
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Revenue Reporting |
| **Description** | Revenue analytics and reporting |
| **Operations Benefit** | Financial visibility |
| **Connections** | Revenue Report API |
| **Issues** | None found |

---

### 7.4 Revenue by Vertical
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Revenue by Vertical |
| **Description** | Revenue breakdown by business category |
| **Operations Benefit** | Category performance analysis |
| **Connections** | Revenue API |
| **Issues** | None found |

---

### 7.5 Cohort Analysis
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Cohort Analysis |
| **Description** | User cohort behavior analysis |
| **Operations Benefit** | Retention pattern understanding |
| **Connections** | Cohort API |
| **Issues** | None found |

---

### 7.6 Funnel Analytics
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Funnel Analytics |
| **Description** | Conversion funnel visualization |
| **Operations Benefit** | Identify drop-off points |
| **Connections** | Funnel API |
| **Issues** | None found |

---

### 7.7 Marketing Analytics
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Marketing Analytics |
| **Description** | Campaign and marketing performance |
| **Operations Benefit** | Marketing ROI measurement |
| **Connections** | Marketing API |
| **Issues** | None found |

---

### 7.8 Explore Analytics
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Explore Analytics |
| **Description** | Video/content discovery platform metrics |
| **Operations Benefit** | Content engagement insights |
| **Connections** | Explore API |
| **Issues** | None found |

---

### 7.9 Creator Analytics
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Creator Program Analytics |
| **Description** | Content creator performance tracking |
| **Operations Benefit** | Creator partnership management |
| **Connections** | Creators API |
| **Issues** | None found |

---

### 7.10 Rez Now Analytics
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Rez Now Analytics |
| **Description** | Quick commerce metrics |
| **Operations Benefit** | Fast delivery service monitoring |
| **Connections** | RezNow API |
| **Issues** | None found |

---

### 7.11 Corp Analytics
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Corporate Analytics |
| **Description** | B2B corporate benefits metrics |
| **Operations Benefit** | Enterprise client insights |
| **Connections** | Corp API |
| **Issues** | None found |

---

## 8. Corporate Benefits (CorpPerks)

### 8.1 Corp Dashboard
| Attribute | Details |
|-----------|---------|
| **Feature Name** | CorpPerks Dashboard |
| **Description** | Corporate benefits overview |
| **Operations Benefit** | B2B service monitoring |
| **Connections** | Corp API |
| **Issues** | None found |

**Capabilities:**
- Active companies count
- Enrolled employees count
- Total benefits value
- GST savings (ITC)
- Quick actions for:
  - Corporate dining
  - Hotel bookings
  - Gift campaigns
  - GST invoices

---

### 8.2 Corp Campaigns
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Corporate Campaigns |
| **Description** | B2B promotional campaigns |
| **Operations Benefit** | Enterprise client engagement |
| **Connections** | CorpCampaigns API |
| **Issues** | None found |

---

### 8.3 Corp Bookings
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Corporate Bookings |
| **Description** | Manage corporate service bookings |
| **Operations Benefit** | B2B order management |
| **Connections** | CorpBookings API |
| **Issues** | None found |

---

### 8.4 Corp Employees
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Corporate Employees |
| **Description** | Employee management for corporate accounts |
| **Operations Benefit** | B2B user management |
| **Connections** | CorpEmployees API |
| **Issues** | None found |

---

### 8.5 Corp Gifting
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Corporate Gifting |
| **Description** | Enterprise gift campaigns |
| **Operations Benefit** | B2B gifting solutions |
| **Connections** | CorpGifting API |
| **Issues** | None found |

---

### 8.6 Corp Karma
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Corporate Karma |
| **Description** | Corporate social impact tracking |
| **Operations Benefit** | ESG and CSR metrics |
| **Connections** | CorpKarma API |
| **Issues** | None found |

---

### 8.7 Corp Rewards
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Corporate Rewards |
| **Description** | Corporate reward programs |
| **Operations Benefit** | Employee reward management |
| **Connections** | CorpRewards API |
| **Issues** | None found |

---

### 8.8 Corp Health
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Corporate Health |
| **Description** | Corporate account health monitoring |
| **Operations Benefit** | Account health visibility |
| **Connections** | Corp API |
| **Issues** | None found |

---

### 8.9 Corp Integrations
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Corporate Integrations |
| **Description** | Third-party integrations for corporates |
| **Operations Benefit** | Extended functionality |
| **Connections** | CorpIntegrations API |
| **Issues** | None found |

---

### 8.10 Corp HRIS
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Corporate HRIS |
| **Description** | HR information system integration |
| **Operations Benefit** | Employee data management |
| **Connections** | CorpHRIS API |
| **Issues** | None found |

---

### 8.11 Corp Portal
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Corporate Portal |
| **Description** | Corporate self-service portal management |
| **Operations Benefit** | Self-service for enterprise clients |
| **Connections** | CorpPortal API |
| **Issues** | None found |

---

### 8.12 Corp Invoices
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Corporate Invoices |
| **Description** | Invoice management for corporates |
| **Operations Benefit** | Billing and invoicing |
| **Connections** | CorpInvoices API |
| **Issues** | None found |

---

### 8.13 Payroll
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Payroll Management |
| **Description** | Corporate payroll integration |
| **Operations Benefit** | Salary and compensation |
| **Connections** | Payroll API |
| **Issues** | None found |

---

## 9. Support & Operations

### 9.1 Support Tickets
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Support Ticket Management |
| **Description** | Handle customer support requests |
| **Operations Benefit** | Customer service operations |
| **Connections** | Support API |
| **Issues** | None found |

---

### 9.2 Disputes Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Dispute Resolution |
| **Description** | Manage transaction and order disputes |
| **Operations Benefit** | Conflict resolution |
| **Connections** | Disputes API |
| **Issues** | None found |

---

### 9.3 Pending Approvals
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Pending Approvals |
| **Description** | Workflow approvals dashboard |
| **Operations Benefit** | Operational governance |
| **Connections** | AdminActions API |
| **Issues** | None found |

---

### 9.4 Admin Settings
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Admin Settings |
| **Description** | Admin user account management |
| **Operations Benefit** | Self-service for admins |
| **Connections** | Admin Settings API |
| **Issues** | None found |

---

### 9.5 Support Configuration
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Support Configuration |
| **Description** | Configure support workflows |
| **Operations Benefit** | Support system customization |
| **Connections** | SupportConfig API |
| **Issues** | None found |

---

### 9.6 Support Tools
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Support Tools |
| **Description** | Advanced support utilities |
| **Operations Benefit** | Enhanced support capabilities |
| **Connections** | SupportTools API |
| **Issues** | None found |

---

## 10. Content & Moderation

### 10.1 UGC Moderation
| Attribute | Details |
|-----------|---------|
| **Feature Name** | User Generated Content Moderation |
| **Description** | Moderate user-generated content |
| **Operations Benefit** | Content quality control |
| **Connections** | UGCModeration API |
| **Issues** | None found |

---

### 10.2 Photo Moderation
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Photo Moderation |
| **Description** | Moderate uploaded photos |
| **Operations Benefit** | Visual content quality |
| **Connections** | PhotoModeration API |
| **Issues** | None found |

---

### 10.3 Review Moderation
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Review Moderation |
| **Description** | Moderate user reviews |
| **Operations Benefit** | Review quality control |
| **Connections** | Reviews API |
| **Issues** | None found |

---

### 10.4 Comments Moderation
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Comments Moderation |
| **Description** | Moderate user comments |
| **Operations Benefit** | Community management |
| **Connections** | Comments API |
| **Issues** | None found |

---

### 10.5 Stores Moderation
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Store Moderation |
| **Description** | Moderate store content |
| **Operations Benefit** | Merchant content control |
| **Connections** | Stores API |
| **Issues** | None found |

---

### 10.6 Moderation Queue
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Moderation Queue |
| **Description** | Unified moderation workflow |
| **Operations Benefit** | Centralized content review |
| **Connections** | Moderation API |
| **Issues** | None found |

---

## 11. Offers & Deals

### 11.1 Offers Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Offers Management |
| **Description** | Create and manage merchant offers |
| **Operations Benefit** | Deal management for merchants |
| **Connections** | Offers API |
| **Issues** | None found |

---

### 11.2 Offers Sections
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Offers Sections |
| **Description** | Organize offers into sections |
| **Operations Benefit** | Content organization |
| **Connections** | OffersSections API |
| **Issues** | None found |

---

### 11.3 Flash Sales
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Flash Sales |
| **Description** | Time-limited sale events |
| **Operations Benefit** | Urgency-based promotions |
| **Connections** | FlashSales API |
| **Issues** | None found |

---

### 11.4 Homepage Deals
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Homepage Deals Configuration |
| **Description** | Configure homepage featured deals |
| **Operations Benefit** | Promotional placement control |
| **Connections** | HomepageDeals API |
| **Issues** | None found |

---

### 11.5 Bank Offers
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Bank Offers |
| **Description** | Partner bank promotional offers |
| **Operations Benefit** | Banking partnerships |
| **Connections** | BankOffers API |
| **Issues** | None found |

---

### 11.6 Store Collections
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Store Collections |
| **Description** | Curated store groupings |
| **Operations Benefit** | Featured collections |
| **Connections** | StoreCollections API |
| **Issues** | None found |

---

## 12. Categories & Taxonomy

### 12.1 Categories Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Categories Management |
| **Description** | Manage platform categories |
| **Operations Benefit** | Content organization |
| **Connections** | Categories API |
| **Issues** | None found |

---

### 12.2 Event Categories
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Event Categories |
| **Description** | Manage event taxonomies |
| **Operations Benefit** | Event organization |
| **Connections** | EventCategories API |
| **Issues** | None found |

---

## 13. Events & Experiences

### 13.1 Events Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Events Management |
| **Description** | Create and manage platform events |
| **Operations Benefit** | Event-driven engagement |
| **Connections** | Events API |
| **Issues** | None found |

---

### 13.2 Event Rewards
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Event Rewards |
| **Description** | Configure rewards for events |
| **Operations Benefit** | Event incentive management |
| **Connections** | EventRewards API |
| **Issues** | None found |

---

### 13.3 Experiences
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Experiences Management |
| **Description** | Manage curated user experiences |
| **Operations Benefit** | Content curation |
| **Connections** | Experiences API |
| **Issues** | None found |

---

### 13.4 Exclusive Zones
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Exclusive Zones |
| **Description** | Premium content zones |
| **Operations Benefit** | Tiered access control |
| **Connections** | ExclusiveZones API |
| **Issues** | None found |

---

### 13.5 Rendez
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Rendez |
| **Description** | Meeting/appointment feature |
| **Operations Benefit** | Scheduling capabilities |
| **Connections** | Rendez API |
| **Issues** | None found |

---

### 13.6 Special Profiles
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Special Profiles |
| **Description** | Featured user profiles |
| **Operations Benefit** | Influencer management |
| **Connections** | SpecialProfiles API |
| **Issues** | None found |

---

### 13.7 Special Programs
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Special Programs |
| **Description** | Program-specific configurations |
| **Operations Benefit** | Program management |
| **Connections** | SpecialPrograms API |
| **Issues** | None found |

---

## 14. Services & Bookings

### 14.1 Travel
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Travel Services |
| **Description** | Travel booking management |
| **Operations Benefit** | Travel vertical |
| **Connections** | Travel API |
| **Issues** | None found |

---

### 14.2 Hotels
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Hotel Management |
| **Description** | Hotel inventory management |
| **Operations Benefit** | Accommodation services |
| **Connections** | Hotels API |
| **Issues** | None found |

---

### 14.3 Table Bookings
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Table Bookings |
| **Description** | Restaurant table reservations |
| **Operations Benefit** | Reservation management |
| **Connections** | TableBookings API |
| **Issues** | None found |

---

### 14.4 Service Appointments
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Service Appointments |
| **Description** | Appointment scheduling |
| **Operations Benefit** | Service bookings |
| **Connections** | ServiceAppointments API |
| **Issues** | None found |

---

## 15. Social & Community

### 15.1 Social Impact
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Social Impact Program |
| **Description** | CSR and social good initiatives |
| **Operations Benefit** | Impact economy |
| **Connections** | SocialImpact API |
| **Issues** | None found |

---

### 15.2 Sponsors
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Sponsor Management |
| **Description** | Event/program sponsors |
| **Operations Benefit** | Sponsorship management |
| **Connections** | Sponsors API |
| **Issues** | None found |

---

### 15.3 Polls
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Polls |
| **Description** | User polling system |
| **Operations Benefit** | Engagement and feedback |
| **Connections** | Polls API |
| **Issues** | None found |

---

### 15.4 Reactions
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Reactions |
| **Description** | Content reaction system |
| **Operations Benefit** | Engagement tracking |
| **Connections** | Reactions API |
| **Issues** | None found |

---

### 15.5 Reviews
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Reviews |
| **Description** | User review system |
| **Operations Benefit** | Social proof |
| **Connections** | Reviews API |
| **Issues** | None found |

---

### 15.6 Offer Comments
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Offer Comments |
| **Description** | Comments on offers |
| **Operations Benefit** | Discussion on deals |
| **Connections** | OfferComments API |
| **Issues** | None found |

---

## 16. Financial Services

### 16.1 BBPS Configuration
| Attribute | Details |
|-----------|---------|
| **Feature Name** | BBPS (Bharat Bill Payment System) |
| **Description** | Bill payment system configuration |
| **Operations Benefit** | Utility bill payments |
| **Connections** | BBPS API |
| **Issues** | None found |

---

### 16.2 BBPS Providers
| Attribute | Details |
|-----------|---------|
| **Feature Name** | BBPS Providers |
| **Description** | Manage bill payment providers |
| **Operations Benefit** | Provider management |
| **Connections** | BBPS API |
| **Issues** | None found |

---

### 16.3 BBPS Transactions
| Attribute | Details |
|-----------|---------|
| **Feature Name** | BBPS Transactions |
| **Description** | Bill payment transaction monitoring |
| **Operations Benefit** | Transaction oversight |
| **Connections** | BBPS API |
| **Issues** | None found |

---

### 16.4 BBPS Analytics
| Attribute | Details |
|-----------|---------|
| **Feature Name** | BBPS Analytics |
| **Description** | Bill payment analytics |
| **Operations Benefit** | Financial insights |
| **Connections** | BBPS API |
| **Issues** | None found |

---

### 16.5 BBPS Health
| Attribute | Details |
|-----------|---------|
| **Feature Name** | BBPS Health |
| **Description** | Bill payment system health |
| **Operations Benefit** | Service reliability |
| **Connections** | BBPS API |
| **Issues** | None found |

---

## 17. Vouchers & Gift Cards

### 17.1 Voucher Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Voucher Management |
| **Description** | Create and manage vouchers |
| **Operations Benefit** | Promotional vouchers |
| **Connections** | Vouchers API |
| **Issues** | None found |

---

### 17.2 Gift Cards
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Gift Cards |
| **Description** | Gift card management |
| **Operations Benefit** | Digital gifting |
| **Connections** | GiftCards API |
| **Issues** | None found |

---

### 17.3 Value Cards
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Value Cards |
| **Description** | Stored value card management |
| **Operations Benefit** | Loyalty cards |
| **Connections** | ValueCards API |
| **Issues** | None found |

---

## 18. Platform Configuration

### 18.1 Platform Settings
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Platform Settings |
| **Description** | Core platform configuration |
| **Operations Benefit** | System customization |
| **Connections** | Platform Config API |
| **Issues** | None found |

---

### 18.2 Feature Flags
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Feature Flags |
| **Description** | Toggle features on/off |
| **Operations Benefit** | Gradual rollouts |
| **Connections** | FeatureFlags API |
| **Issues** | None found |

---

### 18.3 Membership Configuration
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Membership Plans |
| **Description** | Configure subscription tiers |
| **Operations Benefit** | Subscription management |
| **Connections** | Membership API |
| **Issues** | None found |

---

### 18.4 Delivery Settings
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Delivery Configuration |
| **Description** | Delivery operational settings |
| **Operations Benefit** | Logistics configuration |
| **Connections** | Delivery API |
| **Issues** | None found |

---

### 18.5 Engagement Configuration
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Engagement Config |
| **Description** | User engagement settings |
| **Operations Benefit** | Retention tuning |
| **Connections** | EngagementConfig API |
| **Issues** | None found |

---

### 18.6 Gamification Economy
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Gamification Economy |
| **Description** | Game economy balancing |
| **Operations Benefit** | Economy management |
| **Connections** | Gamification API |
| **Issues** | None found |

---

### 18.7 Cashback Rules
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Cashback Rules |
| **Description** | Configure cashback logic |
| **Operations Benefit** | Reward customization |
| **Connections** | Cashback API |
| **Issues** | None found |

---

### 18.8 Economics
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Platform Economics |
| **Description** | Economic model configuration |
| **Operations Benefit** | Business model control |
| **Connections** | Economics API |
| **Issues** | None found |

---

### 18.9 AB Test Manager
| Attribute | Details |
|-----------|---------|
| **Feature Name** | A/B Testing |
| **Description** | Run experiments |
| **Operations Benefit** | Data-driven decisions |
| **Connections** | ABTest API |
| **Issues** | None found |

---

### 18.10 Bundle Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Bundle Management |
| **Description** | Product bundling |
| **Operations Benefit** | Upselling tools |
| **Connections** | Bundle API |
| **Issues** | None found |

---

### 18.11 Quick Actions
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Quick Actions |
| **Description** | Configurable shortcuts |
| **Operations Benefit** | Efficiency |
| **Connections** | QuickActions API |
| **Issues** | None found |

---

### 18.12 Admin Users
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Admin User Management |
| **Description** | Manage admin accounts |
| **Operations Benefit** | Access control |
| **Connections** | AdminUsers API |
| **Issues** | None found |

---

## 19. Monitoring & Operations

### 19.1 Unified Monitor
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Unified Monitoring |
| **Description** | Real-time system monitoring |
| **Operations Benefit** | System visibility |
| **Connections** | Monitoring API, WebSocket |
| **Issues** | None found |

---

### 19.2 System Health
| Attribute | Details |
|-----------|---------|
| **Feature Name** | System Health |
| **Description** | Infrastructure health checks |
| **Operations Benefit** | Reliability monitoring |
| **Connections** | System API |
| **Issues** | None found |

---

### 19.3 Live Monitor
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Live Monitoring |
| **Description** | Real-time activity stream |
| **Operations Benefit** | Live operational awareness |
| **Connections** | WebSocket |
| **Issues** | None found |

---

### 19.4 Aggregator Monitor
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Aggregator Monitoring |
| **Description** | Third-party aggregator status |
| **Operations Benefit** | Integration health |
| **Connections** | Aggregator API |
| **Issues** | None found |

---

### 19.5 API Latency
| Attribute | Details |
|-----------|---------|
| **Feature Name** | API Latency Monitor |
| **Description** | API performance tracking |
| **Operations Benefit** | Performance visibility |
| **Connections** | Monitoring API |
| **Issues** | None found |

---

### 19.6 Job Monitor
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Job Monitoring |
| **Description** | Background job tracking |
| **Operations Benefit** | Batch job visibility |
| **Connections** | Jobs API |
| **Issues** | None found |

---

### 19.7 SLA Monitor
| Attribute | Details |
|-----------|---------|
| **Feature Name** | SLA Monitoring |
| **Description** | Service level tracking |
| **Operations Benefit** | SLA compliance |
| **Connections** | SLA API |
| **Issues** | None found |

---

### 19.8 Reconciliation
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Reconciliation |
| **Description** | Financial reconciliation |
| **Operations Benefit** | Audit compliance |
| **Connections** | Reconciliation API |
| **Issues** | None found |

---

### 19.9 Alert Rules
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Alert Rules |
| **Description** | Configure alerting thresholds |
| **Operations Benefit** | Proactive notifications |
| **Connections** | Alerts API |
| **Issues** | None found |

---

### 19.10 Integration Health
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Integration Health |
| **Description** | Third-party integration status |
| **Operations Benefit** | Partner reliability |
| **Connections** | Integration API |
| **Issues** | None found |

---

### 19.11 Merchant Live Status
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Merchant Live Status |
| **Description** | Real-time merchant availability |
| **Operations Benefit** | Operations awareness |
| **Connections** | Merchants API |
| **Issues** | None found |

---

## 20. Content Management

### 20.1 Learning Content
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Learning Content |
| **Description** | Educational content management |
| **Operations Benefit** | User education |
| **Connections** | LearningContent API |
| **Issues** | None found |

---

### 20.2 FAQ Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | FAQ Management |
| **Description** | Self-help content |
| **Operations Benefit** | Support deflection |
| **Connections** | FAQ API |
| **Issues** | None found |

---

### 20.3 Hotspot Areas
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Hotspot Areas |
| **Description** | Geographic service zones |
| **Operations Benefit** | Area-based operations |
| **Connections** | HotspotAreas API |
| **Issues** | None found |

---

### 20.4 Whats New
| Attribute | Details |
|-----------|---------|
| **Feature Name** | What's New |
| **Description** | Product update announcements |
| **Operations Benefit** | User communication |
| **Connections** | WhatsNew API |
| **Issues** | None found |

---

### 20.5 Explore
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Explore Management |
| **Description** | Content discovery platform |
| **Operations Benefit** | Content curation |
| **Connections** | Explore API |
| **Issues** | None found |

---

### 20.6 Cash Store
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Cash Store |
| **Description** | Coin marketplace |
| **Operations Benefit** | Coin liquidity |
| **Connections** | CashStore API |
| **Issues** | None found |

---

### 20.7 Mall
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Mall Management |
| **Description** | Shopping mall features |
| **Operations Benefit** | E-commerce |
| **Connections** | Mall API |
| **Issues** | None found |

---

### 20.8 Upload Bill Stores
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Bill Upload Stores |
| **Description** | Stores accepting bill uploads |
| **Operations Benefit** | Offer discovery |
| **Connections** | UploadBillStores API |
| **Issues** | None found |

---

### 20.9 Verifications
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Verification Management |
| **Description** | User/document verification |
| **Operations Benefit** | Identity verification |
| **Connections** | Verifications API |
| **Issues** | None found |

---

### 20.10 Institution Referrals
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Institution Referrals |
| **Description** | Partner institution referrals |
| **Operations Benefit** | B2B growth |
| **Connections** | InstituteReferrals API |
| **Issues** | None found |

---

### 20.11 Institutions
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Institution Management |
| **Description** | Partner institutions |
| **Operations Benefit** | B2B management |
| **Connections** | Institutions API |
| **Issues** | None found |

---

### 20.12 Trial Approvals
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Trial Approvals |
| **Description** | Trial feature approvals |
| **Operations Benefit** | Controlled rollouts |
| **Connections** | Trials API |
| **Issues** | None found |

---

## 21. Prive (Premium Tier)

### 21.1 Prive Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Prive Premium |
| **Description** | Premium tier management |
| **Operations Benefit** | VIP user handling |
| **Connections** | Prive API |
| **Issues** | None found |

---

### 21.2 Prive Campaigns
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Prive Campaigns |
| **Description** | Premium-only campaigns |
| **Operations Benefit** | VIP engagement |
| **Connections** | PriveCampaigns API |
| **Issues** | None found |

---

### 21.3 Prive Concierge
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Prive Concierge |
| **Description** | VIP support service |
| **Operations Benefit** | Premium support |
| **Connections** | PriveConcierge API |
| **Issues** | None found |

---

### 21.4 Prive Configuration
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Prive Configuration |
| **Description** | Premium tier settings |
| **Operations Benefit** | Tier customization |
| **Connections** | PriveConfig API |
| **Issues** | None found |

---

### 21.5 Prive Invite Admin
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Prive Invitations |
| **Description** | Manage premium invites |
| **Operations Benefit** | Access control |
| **Connections** | PriveInviteAdmin API |
| **Issues** | None found |

---

### 21.6 Prive Missions
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Prive Missions |
| **Description** | Premium user missions |
| **Operations Benefit** | VIP engagement |
| **Connections** | PriveMissions API |
| **Issues** | None found |

---

## 22. Merchant Specific

### 22.1 Merchant Plan Analytics
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Merchant Plan Analytics |
| **Description** | Subscription plan metrics |
| **Operations Benefit** | Plan performance |
| **Connections** | MerchantPlans API |
| **Issues** | None found |

---

### 22.2 Merchant Withdrawals
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Merchant Withdrawals |
| **Description** | Payout management |
| **Operations Benefit** | Merchant settlements |
| **Connections** | MerchantWithdrawals API |
| **Issues** | None found |

---

### 22.3 Merchant Flags
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Merchant Flags |
| **Description** | Flag merchant accounts |
| **Operations Benefit** | Risk management |
| **Connections** | MerchantFlags API |
| **Issues** | None found |

---

### 22.4 Partner Earnings
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Partner Earnings |
| **Description** | Affiliate/partner payouts |
| **Operations Benefit** | Partner management |
| **Connections** | PartnerEarnings API |
| **Issues** | None found |

---

## 23. Wallet & Coins

### 23.1 User Wallets
| Attribute | Details |
|-----------|---------|
| **Feature Name** | User Wallet Management |
| **Description** | Individual wallet oversight |
| **Operations Benefit** | User balance visibility |
| **Connections** | UserWallets API |
| **Issues** | None found |

---

### 23.2 Admin Wallet
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Admin Wallet |
| **Description** | Platform wallet management |
| **Operations Benefit** | Platform finances |
| **Connections** | AdminWallet API |
| **Issues** | None found |

---

### 23.3 Karma Admin
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Karma System Admin |
| **Description** | Impact economy management |
| **Operations Benefit** | Social good tracking |
| **Connections** | KarmaAdmin API |
| **Issues** | None found |

---

### 23.4 Karma Loyalty Config
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Karma Loyalty Configuration |
| **Description** | Karma program settings |
| **Operations Benefit** | Impact economy tuning |
| **Connections** | Karma API |
| **Issues** | None found |

---

### 23.5 Karma Score
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Karma Score Management |
| **Description** | Individual karma oversight |
| **Operations Benefit** | Impact verification |
| **Connections** | KarmaScore API |
| **Issues** | None found |

---

### 23.6 Admin Actions
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Admin Actions |
| **Description** | Action logging and approval |
| **Operations Benefit** | Audit and governance |
| **Connections** | AdminActions API |
| **Issues** | None found |

---

## 24. Ad Platform

### 24.1 Ads Management
| Attribute | Details |
|-----------|---------|
| **Feature Name** | Advertising Platform |
| **Description** | Ad campaign management |
| **Operations Benefit** | Ad revenue |
| **Connections** | AdCampaigns API |
| **Issues** | None found |

---

## 25. REE Dashboard (HTML Standalone)

### 25.1 REE Admin Dashboard
| Attribute | Details |
|-----------|---------|
| **Feature Name** | REE Economic Engine Dashboard |
| **Description** | Business logic configuration interface |
| **Operations Benefit** | Commission, cashback, karma scoring control |
| **Connections** | REE API (localhost:4000) |
| **Issues** | Standalone HTML - limited functionality |

**Capabilities:**
- View User Tiers (loads from REE API)
- View Merchant Tiers (loads from REE API)
- Cashback Calculator
- View Active Fraud Rules
- View Coin Types information

---

## Summary Statistics

| Category | Feature Count |
|----------|---------------|
| User & Merchant Management | 3 |
| Fraud & Security | 5 |
| Wallet & Financial Operations | 4 |
| Promotional Campaigns | 5 |
| Gamification | 8 |
| Notifications & Communication | 2 |
| Business Intelligence & Analytics | 11 |
| Corporate Benefits (CorpPerks) | 13 |
| Support & Operations | 6 |
| Content & Moderation | 6 |
| Offers & Deals | 6 |
| Categories & Taxonomy | 2 |
| Events & Experiences | 7 |
| Services & Bookings | 4 |
| Social & Community | 6 |
| Financial Services (BBPS) | 5 |
| Vouchers & Gift Cards | 3 |
| Platform Configuration | 11 |
| Monitoring & Operations | 11 |
| Content Management | 11 |
| Prive (Premium) | 6 |
| Merchant Specific | 4 |
| Wallet & Coins | 6 |
| Ad Platform | 1 |
| REE Dashboard | 1 |
| **TOTAL** | **~160+ features** |

---

## Key Issues Found

| Issue ID | Description | Severity | Category |
|----------|-------------|----------|----------|
| 1 | Cashback capped at 15% in UI, backend allows 20% | Medium | Campaigns |
| 2 | Biometric authentication required for amounts >= 50,000 NC | Low (Security Feature) | Wallet |
| 3 | Self-approval prevention implemented | Low (Security Feature) | Wallet |
| 4 | Maximum adjustment amount: 1,000,000 NC per transaction | Low (Security Feature) | Wallet |

---

## Files Analyzed

### Main Application (rez-app-admin)
- **Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/`
- **Technology:** React Native / Expo
- **Files:** 160+ screen components, 100+ service API files, 50+ query hooks

### Secondary Dashboards
- **REZ-admin-dashboard:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-admin-dashboard/ree-admin.html`
- **REE-Dashboard:** `/Users/rejaulkarim/Documents/ReZ Full App/REE-Dashboard/ree-dashboard.html`

---

*Report generated: 2026-05-05*
