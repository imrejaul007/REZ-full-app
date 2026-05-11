# REZ MERCHANT - INDUSTRY-WISE FEATURES

**Date:** May 7, 2026
**Version:** 1.1
**Status:** COMPLETE

---

## EXECUTIVE SUMMARY

REZ Merchant supports **10 industry verticals** with **200+ features** across all industries. Each vertical is purpose-built for specific business workflows with industry-specific integrations, metrics, and screens.

**Key Differentiator:** Unlike generic POS systems, REZ Merchant is an **AI-powered commerce operating system** with:
- 6 QR Code systems for customer engagement
- Coin economy (REZ Coins, Brand Coins, Karma Tiers)
- 8 Autonomous AI Agents (ReZ Mind)
- Closed-loop advertising (AdBazaar)
- Hotel OTA integration with 10% commission
- Finance OS (BNPL, GST, Credit)

| Industry | Target | Key Features | Screens |
|----------|--------|--------------|---------|
| **Restaurant** | Restaurants, Cafes, QSR | Table management, Menu, Orders | 46 |
| **Salon** | Salons, Spas, Beauty | Appointments, Services, Stylists | 35 |
| **Hotel** | Hotels, Resorts, Homestays | Rooms, OTA, PMS | 40 |
| **Retail** | Shops, Stores, Malls | Products, Inventory, POS | 30 |
| **Healthcare** | Clinics, Hospitals | Appointments, Patients, Records | 45 |
| **Fitness** | Gyms, Studios, Yoga | Classes, Members, Trainers | 25 |
| **Education** | Institutes, Tutors | Courses, Batches, Attendance | 30 |
| **Events** | Venues, Organizers | Bookings, Tickets, Seating | 20 |
| **Auto** | Workshops, Showrooms | Jobs, Vehicles, Parts | 25 |
| **Services** | Repair, Cleaning, Rental | Bookings, Staff, Routes | 20 |

---

## INDUSTRY 1: RESTAURANT / FOOD & BEVERAGE

### Target Businesses
- Fine Dining Restaurants
- Casual Dining
- Quick Service Restaurants (QSR)
- Cafes & Coffee Shops
- Food Courts
- Cloud Kitchens
- Bakeries
- Bars & Pubs
- Food Trucks

### Core Features

#### Table Management (Dine-In)
```
✓ Floor plan visualization
✓ Table status (available, occupied, reserved)
✓ Capacity tracking
✓ Table QR codes (customer scan to order)
✓ Waitlist management
✓ Reservation system
✓ Turn time tracking
✓ Table analytics
```

#### Menu Management
```
✓ Category management
✓ Product variants (size, add-ons)
✓ Modifiers & customizations
✓ Pricing & cost tracking
✓ Image upload
✓ Availability toggle
✓ Combo/deal management
✓ Kitchen display system (KDS)
```

#### Order Management
```
✓ POS ordering
✓ Order types: Dine-in, Takeaway, Delivery
✓ Split bill functionality
✓ Order tracking
✓ Kitchen display integration
✓ Real-time status updates
✓ Order history
✓ refunds & cancellations
```

#### Kitchen/Back Office
```
✓ Kitchen display system (KDS)
✓ Order tickets
✓ Prep time tracking
✓ Ingredient management
✓ Recipe costing
✓ Waste tracking
```

#### Integration Requirements
```
✓ Aggregators: Swiggy, Zomato sync (rez-merchant-integrations)
✓ Delivery: Dunzo, Shadowfax integration
✓ POS Hardware: Receipt printers, barcode scanners
✓ KDS: Kitchen display integration
✓ Payment: Razorpay, UPI, cards
```

### Unique Workflows
```
1. QR Scan → Menu View → Add to Cart → Pay → Earn Coins
2. Table Scan → Order → Kitchen KDS → Serve → Split Bill → Pay
3. Delivery Order → Kitchen KDS → Packing → Delivery Partner → Track
4. Waitlist → Table Available → Notify → Seat → Order
```

### Screens (46)
```
├── dine-in/
│   ├── index.tsx          # Floor plan
│   ├── table/[id].tsx     # Table details
│   ├── new-order.tsx      # Create order
│   └── waiter-mode.tsx     # Waiter app
├── orders/
│   ├── index.tsx          # Order list
│   ├── [id].tsx           # Order details
│   └── kitchen.tsx         # Kitchen display
├── products/
│   ├── index.tsx          # Menu list
│   ├── [id].tsx           # Product details
│   └── categories.tsx      # Categories
├── kitchen/
│   ├── index.tsx         # KDS
│   └── tickets.tsx         # Active tickets
```

### Restaurant-Specific Metrics
- Table turnover rate
- Average order value (AOV)
- Food cost percentage
- Prep time
- Wait time
- Revenue per table
- Covers per day

---

## INDUSTRY 2: SALON / BEAUTY

### Target Businesses
- Hair Salons
- Beauty Parlors
- Spas
- Nail Salons
- Makeup Studios
- Barber Shops
- Grooming Centers
- Wellness Centers

### Core Features

#### Appointment Management
```
✓ Service booking
✓ Staff scheduling
✓ Time slot management
✓ Recurring appointments
✓ Walk-in queue
✓ Buffer time between appointments
✓ Service duration tracking
```

#### Staff Management
```
✓ Staff profiles
✓ Working hours
✓ Skills & certifications
✓ Commission calculation
✓ Tips tracking
✓ Performance metrics
```

#### Service Catalog
```
✓ Service categories
✓ Service with duration
✓ Pricing by staff (optional)
✓ Package deals
✓ Product sales
✓ Memberships
```

#### Client Management
```
✓ Client profiles
✓ Service history
✓ Preferences & notes
✓ Allergies & sensitivities
✓ Before/after photos
✓ Birthday reminders
```

### Screens (35)
```
├── appointments/
│   ├── index.tsx          # Calendar view
│   ├── [id].tsx           # Appointment details
│   ├── new.tsx            # Book appointment
│   └── calendar.tsx        # Full calendar
├── staff/
│   ├── index.tsx          # Staff list
│   ├── [id].tsx           # Staff details
│   └── schedule.tsx         # Schedule
├── services/
│   ├── index.tsx          # Service list
│   └── [id].tsx           # Service details
├── clients/
│   ├── index.tsx          # Client list
│   └── [id].tsx           # Client profile
```

### Salon-Specific Metrics
- Revenue per staff member
- Booking conversion rate
- No-show rate
- Average service time
- Re-booking rate
- Product upsell rate

---

## INDUSTRY 3: HOTEL / HOSPITALITY

### Target Businesses
- Hotels (1-5 star)
- Resorts
- Homestays
- Guesthouses
- Hostels
- Serviced Apartments
- Vacation Rentals

### Core Features

#### Room Management
```
✓ Room types & categories
✓ Room inventory
✓ Room status (clean, dirty, maintenance)
✓ Housekeeping tracking
✓ Amenities management
✓ Room pricing (dynamic)
✓ Seasonal rates
✓ Extra bed & add-ons
```

#### Booking Engine
```
✓ OTA integration (Booking.com, Airbnb)
✓ Direct booking
✓ Channel manager
✓ Availability calendar
✓ Booking rules (min stay, check-in days)
✓ Discount codes
✓ Package deals
```

#### Front Desk
```
✓ Check-in & check-out
✓ Guest registration
✓ Room assignment
✓ Payment processing
✓ Invoice generation
✓ Early check-in/late check-out
✓ Guest preferences
```

#### Housekeeping
```
✓ Task assignment
✓ Room status tracking
✓ Inspection checklist
✓ Staff scheduling
✓ Lost & found
✓ Maintenance requests
```

#### PMS Integration
```
✓ Cloudbeds
✓ Hotelogix
✓ Qloapps
✓ Custom PMS webhook
✓ Channel manager sync
```

#### Integration Requirements
```
✓ OTA Channels: Booking.com, Airbnb, Expedia, MMT, Goibibo
✓ Channel Manager: Sync inventory across all OTAs
✓ PMS: Hotelogix, Cloudbeds, Qloapps integration
✓ Payment: Razorpay, Payment gateways
✓ Corporate: B2B travel panel (rez-corporate-service)
✓ Travel API: TBO integration for packages
```

### Unique Workflows
```
1. Direct Booking → Room Assignment → Check-in → Housekeeping → Check-out → Invoice
2. OTA Booking → Channel Sync → PMS Update → Housekeeping → Guest Stay → Checkout
3. Room Service → QR Scan (room.rez.money) → Order → Kitchen → Delivery → Invoice
4. Corporate Booking → GST Invoice → Budget Tracking → Employee Stay → Expense Report
```

### Screens (40)
```
├── hotel-ota.tsx           # OTA Dashboard
├── rooms/
│   ├── index.tsx          # Room list
│   ├── [id].tsx           # Room details
│   └── availability.tsx    # Calendar
├── bookings/
│   ├── index.tsx          # Booking list
│   ├── [id].tsx           # Booking details
│   └── new.tsx            # New booking
├── housekeeping/
│   ├── index.tsx          # Task board
│   └── rooms.tsx           # Room status
├── guests/
│   ├── index.tsx          # Guest list
│   └── [id].tsx           # Guest profile
```

### Hotel-Specific Metrics
- Occupancy rate
- Average daily rate (ADR)
- Revenue per available room (RevPAR)
- Average length of stay
- Booking lead time
- Cancellation rate
- No-show rate

---

## INDUSTRY 4: RETAIL

### Target Businesses
- Fashion Stores
- Electronics Shops
- Grocery Stores
- Pharmacies
- Convenience Stores
- Specialty Stores
- Department Stores
- E-commerce (omnichannel)

### Core Features

#### Product Management
```
✓ SKU & barcode
✓ Category & subcategory
✓ Variants (color, size)
✓ Pricing & MRP
✓ Stock levels
✓ Reorder points
✓ Supplier management
✓ Batch & expiry tracking
```

#### Inventory
```
✓ Stock in/out
✓ Stock transfer (stores/warehouses)
✓ Stocktake & audit
✓ Stock valuation
✓ Dead stock report
✓ Fast-moving items
✓ ABC analysis
```

#### POS (Point of Sale)
```
✓ Quick billing
✓ Barcode scanning
✓ Multiple payment modes
✓ Bill splitting
✓ GST calculation
✓ Receipt generation
✓ Cash drawer management
✓ End-of-day reconciliation
```

#### Supplier Management
```
✓ Supplier profiles
✓ Purchase orders
✓ GRN (Goods Received Note)
✓ Invoice matching
✓ Payment tracking
```

#### Integration Requirements
```
✓ E-commerce: Omnichannel sync
✓ Suppliers: Auto-reorder (Nextabizz integration)
✓ GST: E-invoice with IRN (rez-corporate-service)
✓ Inventory: Nextabizz RFQ and auto-reorder webhook
✓ Barcode: QR/barcode scanning
✓ POS Hardware: Receipt printers, barcode scanners, cash drawer
```

### Unique Workflows
```
1. Barcode Scan → Product Lookup → Add to Cart → Pay → GST Invoice → Earn Coins
2. Stock Low → Auto Reorder (Nextabizz) → GRN → Stock Update → Alert
3. Supplier Invoice → GST Matching → Payment → Update Ledger
4. Customer Loyalty → Karma Tier → Earn More Coins → Redeem Future Purchase
```

### Screens (30)
```
├── products/
│   ├── index.tsx          # Product list
│   ├── [id].tsx           # Product details
│   ├── variants.tsx        # Variants
│   └── barcodes.tsx        # Barcode scanner
├── inventory/
│   ├── index.tsx          # Stock levels
│   ├── transfer.tsx         # Transfer
│   └── audit.tsx           # Stocktake
├── pos/
│   ├── index.tsx          # POS screen
│   └── history.tsx         # Bills
├── suppliers/
│   ├── index.tsx          # Supplier list
│   └── [id].tsx           # Supplier details
```

### Retail-Specific Metrics
- Sales per sq ft
- Inventory turnover
- Gross margin
- Stock sell-through
- Average transaction value
- Items per transaction
- Shrinkage rate

---

## INDUSTRY 5: HEALTHCARE / CLINIC

### Target Businesses
- Hospitals
- Clinics (Multi-specialty)
- Dental Clinics
- Eye Care Centers
- Diagnostic Labs
- Physiotherapy Centers
- Veterinary Clinics
- Alternative Medicine

### Core Features

#### Patient Management
```
✓ Patient registration
✓ Medical history
✓ Allergies & conditions
✓ Insurance details
✓ Emergency contact
✓ Document upload
✓ Patient consent forms
```

#### Appointment Scheduling
```
✓ Doctor availability
✓ Multi-resource booking (doctor + room)
✓ Slot duration
✓ Appointment types (new/follow-up)
✓ Online booking widget
✓ SMS/Email reminders
✓ Waitlist management
```

#### Clinical Management
```
✓ Consultation notes (SOAP)
✓ Diagnosis & ICD-10 codes
✓ Prescription builder
✓ Lab orders
✓ Treatment plans
✓ Procedure recording
```

#### Billing & Insurance
```
✓ Consultation fees
✓ Procedure charges
✓ Package billing
✓ Insurance claim processing
✓ E Claims generation
✓ TDS & GST
```

#### Integration Requirements
```
✓ Insurance: TPA integration, claim processing
✓ Lab: Lab order integration
✓ Pharmacy: Prescription fulfillment
✓ Hospital: HMS/HIS integration
✓ GST: Medical billing compliance
✓ Documents: Patient record storage
```

### Unique Workflows
```
1. Patient Registration → Appointment Booking → Consultation → Prescription → Billing → Follow-up
2. Insurance Patient → TPA Verification → Treatment → Claim Submission → Approval → Billing
3. Lab Order → Sample Collection → Results → Integration → Patient Notification
4. Tele-consultation → AI Triage (ReZ Mind) → Appointment → Prescription → Pharmacy Delivery
```

### Screens (45)
```
├── patients/
│   ├── index.tsx          # Patient list
│   ├── [id].tsx           # Patient profile
│   ├── history.tsx         # Medical history
│   └── documents.tsx        # Uploads
├── appointments/
│   ├── index.tsx          # Calendar
│   ├── [id].tsx           # Appointment
│   └── slots.tsx           # Availability
├── clinical/
│   ├── consultation.tsx    # SOAP notes
│   ├── prescription.tsx    # Rx builder
│   └── treatment.tsx       # Plans
├── billing/
│   ├── index.tsx          # Bills
│   └── claims.tsx          # Insurance
```

### Healthcare-Specific Metrics
- Patient satisfaction (NPS)
- No-show rate
- Average wait time
- Consultation duration
- Revenue per doctor
- Occupancy/utilization rate

---

## INDUSTRY 6: FITNESS / GYM

### Target Businesses
- Gyms & Fitness Centers
- Yoga Studios
- Dance Academies
- Sports Academies
- Personal Training
- CrossFit Boxes
- Martial Arts Schools

### Core Features

#### Membership Management
```
✓ Membership plans
✓ Duration (monthly, quarterly, yearly)
✓ Freeze/pause membership
✓ Upgrade/downgrade
✓ Auto-renewal
✓ Guest passes
```

#### Class Management
```
✓ Class schedule
✓ Class types (Yoga, HIIT, Dance)
✓ Trainer assignment
✓ Batch/level
✓ Booking & cancellation
✓ Waitlist
✓ No-show tracking
```

#### Trainer Management
```
✓ Trainer profiles
✓ Certifications
✓ Availability
✓ Commission (per class or per member)
✓ Performance tracking
```

#### Attendance
```
✓ Check-in/Check-out
✓ Member QR scan
✓ Trainer attendance
✓ Class attendance
✓ Monthly reports
```

### Screens (25)
```
├── members/
│   ├── index.tsx          # Member list
│   ├── [id].tsx           # Member profile
│   └── attendance.tsx      # Attendance
├── memberships/
│   ├── index.tsx          # Plans
│   └── [id].tsx           # Plan details
├── classes/
│   ├── index.tsx          # Schedule
│   ├── [id].tsx           # Class
│   └── book.tsx            # Booking
├── trainers/
│   ├── index.tsx          # Trainer list
│   └── [id].tsx           # Trainer profile
```

### Fitness-Specific Metrics
- Membership retention rate
- Utilization rate (attendance %)
- Revenue per member
- Class fill rate
- Trainer productivity
- Churn rate

---

## INDUSTRY 7: EDUCATION / TRAINING

### Target Businesses
- Coaching Institutes
- Tuition Centers
- Language Schools
- Skill Development
- Professional Courses
- Hobby Classes
- Music Schools
- Dance Academies

### Core Features

#### Course Management
```
✓ Course catalog
✓ Course fees
✓ Batch scheduling
✓ Faculty assignment
✓ Course materials
✓ Certification
```

#### Batch & Schedule
```
✓ Batch creation
✓ Timetable
✓ Calendar view
✓ Substitute teacher
✓ Class cancellation
✓ Holiday management
```

#### Student Management
```
✓ Student registration
✓ Enrollment
✓ Attendance
✓ Progress tracking
✓ Fee management
✓ Certificates
```

#### Faculty Management
```
✓ Teacher profiles
✓ Availability
✓ Salary & commission
✓ Performance
```

#### Integration Requirements
```
✓ Payment: Fee collection, faculty salary
✓ Documents: Certificate generation
✓ Attendance: Biometric integration
✓ Student Portal: Enrollment, progress tracking
✓ GST: Coaching institute compliance
```

### Unique Workflows
```
1. Inquiry → Demo Class → Enrollment → Batch Assignment → Attendance → Fee Payment → Certificate
2. Course Completion → Assessment → Certificate Generation → Student Portfolio
3. Fee Due → Reminder → Late Fee → Payment → Receipt
4. Faculty Leave → Substitute Assignment → Student Notification → Timetable Update
```

### Screens (30)
```
├── courses/
│   ├── index.tsx          # Course list
│   ├── [id].tsx           # Course details
│   └── batches.tsx         # Batches
├── batches/
│   ├── index.tsx          # Batch list
│   ├── [id].tsx           # Batch details
│   └── timetable.tsx       # Schedule
├── students/
│   ├── index.tsx          # Student list
│   ├── [id].tsx           # Student profile
│   ├── attendance.tsx      # Attendance
│   └── fees.tsx            # Fee management
├── faculty/
│   ├── index.tsx          # Faculty list
│   └── [id].tsx           # Faculty profile
```

### Education-Specific Metrics
- Student retention rate
- Attendance rate
- Fee collection %
- Batch utilization
- Placement rate (for job-oriented)
- Student satisfaction

---

## INDUSTRY 8: EVENTS / ENTERTAINMENT

### Target Businesses
- Event Venues
- Party Halls
- Concert Halls
- Marriage Bureaus
- Exhibition Centers
- Conference Rooms
- Amusement Parks
- Movie Theaters

### Core Features

#### Venue Management
```
✓ Venue inventory
✓ Capacity management
✓ Equipment inventory
✓ Pricing (hourly, half-day, full-day)
✓ Availability calendar
```

#### Booking System
```
✓ Event inquiry
✓ Booking confirmation
✓ Booking with deposit
✓ Event details
✓ Setup & teardown time
✓ Catering integration
```

#### Event Management
```
✓ Event schedule
✓ Event types (birthday, wedding, corporate)
✓ Décor & themes
✓ Vendor management
✓ Guest list
✓ RSVP tracking
```

#### Ticketing (for venues)
```
✓ Ticket types
✓ Pricing tiers
✓ Online booking
✓ QR code entry
✓ Door entries
```

#### Integration Requirements
```
✓ Payment: Ticket booking, deposit payments
✓ Entry: QR code scanning, door management
✓ Catering: Third-party catering integration
✓ Decor: Vendor management
✓ Marketing: Event promotion via AdBazaar
```

### Unique Workflows
```
1. Inquiry → Site Visit → Booking with Deposit → Event Setup → Event Day → Breakdown → Invoice
2. Online Booking → QR Ticket → Entry Scan → Seating → Event → Feedback
3. Event Inquiry → Custom Quote → Approval → Booking → Setup → Event
4. Corporate Event → GST Invoice → Budget Management → Execution → Post-event Analysis
```

### Screens (20)
```
├── venues/
│   ├── index.tsx          # Venue list
│   └── [id].tsx           # Venue details
├── bookings/
│   ├── index.tsx          # Booking list
│   ├── [id].tsx           # Booking details
│   └── calendar.tsx        # Availability
├── events/
│   ├── index.tsx          # Event list
│   └── [id].tsx           # Event details
├── tickets/
│   ├── index.tsx          # Ticket types
│   └── sales.tsx           # Sales report
```

### Events-Specific Metrics
- Booking conversion rate
- Revenue per venue
- Average booking value
- Repeat booking rate
- Utilization (days booked vs available)

---

## INDUSTRY 9: AUTO / AUTOMOTIVE

### Target Businesses
- Car Service Centers
- Two-Wheeler Workshops
- Car Showrooms
- Auto Spare Parts
- Tire Shops
- Car Wash
- Vehicle Inspection

### Core Features

#### Job Card Management
```
✓ Job card creation
✓ Vehicle details
✓ Service items
✓ Labor hours
✓ Parts used
✓ Status tracking
✓ Delivery scheduling
```

#### Vehicle Management
```
✓ Vehicle registration
✓ Make/model/year
✓ KM reading
✓ Insurance expiry
✓ PUC certificate
✓ Service history
```

#### Inventory (Parts)
```
✓ Parts catalog
✓ Part compatibility
✓ Stock levels
✓ Reorder levels
✓ Supplier management
✓ Parts pricing
```

#### Customer Vehicle History
```
✓ All visits
✓ Services done
✓ Parts replaced
✓ Complaints logged
✓ Estimated vs actual
```

#### Integration Requirements
```
✓ Parts: Spare parts catalog, supplier sync
✓ Insurance: Vehicle insurance verification
✓ PUC: Pollution certificate tracking
✓ Warranty: Manufacturer warranty lookup
✓ Payment: Job card billing, UPI
```

### Unique Workflows
```
1. Vehicle Check-in → Job Card → Diagnosis → Estimate → Approval → Work → QC → Delivery → Invoice
2. Service Due → Customer Alert → Appointment → Check-in → Service → Pickup/Delivery
3. Insurance Job → Claim Verification → Repair → Claim Submission → Settlement
4. Recall Alert → Customer Notification → Appointment → Warranty Repair → Update Records
```

### Screens (25)
```
├── vehicles/
│   ├── index.tsx          # Vehicle list
│   ├── [id].tsx           # Vehicle details
│   └── registration.tsx     # Add vehicle
├── jobs/
│   ├── index.tsx          # Job cards
│   ├── [id].tsx           # Job details
│   └── new.tsx            # Create job
├── inventory/
│   ├── index.tsx          # Parts list
│   └── [id].tsx           # Part details
├── customers/
│   ├── index.tsx          # Customer list
│   └── [id].tsx           # Customer (with vehicles)
```

### Auto-Specific Metrics
- Jobs per day
- Average job value
- Parts margin
- Labor efficiency
- Vehicle throughput time
- Repeat service rate

---

## INDUSTRY 10: SERVICES / ON-DEMAND

### Target Businesses
- Plumbers
- Electricians
- Home Cleaning
- Pest Control
- AC Repair
- Carpentry
- Painting
- Packers & Movers

### Core Features

#### Service Catalog
```
✓ Service types
✓ Pricing (fixed, hourly, estimate)
✓ Service duration
✓ Zones covered
✓ Materials included/excluded
```

#### Booking Management
```
✓ Customer booking
✓ Slot allocation
✓ Staff assignment
✓ Route optimization
✓ Travel time
```

#### Staff Management
```
✓ Staff profiles
✓ Skills & certifications
✓ Availability
✓ GPS tracking
✓ Attendance
```

#### Job Tracking
```
✓ Job status (assigned, en-route, in-progress, completed)
✓ Customer notification
✓ Job completion proof (photo)
✓ Customer signature
✓ Payment collection
```

#### Integration Requirements
```
✓ GPS: Staff location tracking, route optimization
✓ Payment: On-site payment collection, UPI
✓ Parts: Material ordering, inventory sync
✓ Customer: Real-time notifications
✓ Documents: Job completion proof storage
```

### Unique Workflows
```
1. Customer Booking → Staff Assignment → Route Optimization → Travel → Service → Completion Proof → Payment
2. Service Request → Estimate → Approval → Materials → Service → Customer Sign-off → Invoice
3. Emergency Service → Priority Assignment → Fast Track → Service → Follow-up
4. Subscription Service → Auto-schedule → Reminder → Service → Rating → Invoice
```

### Screens (20)
```
├── services/
│   ├── index.tsx          # Service list
│   └── [id].tsx           # Service details
├── bookings/
│   ├── index.tsx          # Booking list
│   ├── [id].tsx           # Booking details
│   └── calendar.tsx        # Schedule
├── staff/
│   ├── index.tsx          # Staff list
│   └── [id].tsx           # Staff profile
├── jobs/
│   ├── index.tsx          # Job list
│   └── [id].tsx           # Job details
```

### Services-Specific Metrics
- Jobs completed per day
- Average job value
- Travel time %
- First-time fix rate
- Customer satisfaction
- Repeat service rate

---

## SHARED FEATURES ACROSS ALL INDUSTRIES

### Universal (All Industries)

| Feature | Restaurant | Salon | Hotel | Retail | Healthcare | Fitness | Education | Events | Auto | Services |
|---------|------------|-------|--------|--------|------------|---------|-----------|--------|-------|----------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Analytics | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| CRM | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Loyalty | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Marketing | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Payments | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reports | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Notifications | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Multi-staff | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Multi-branch | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### ReZ Platform Features (All Industries)

```
✓ ReZ Coins (Brand Coins)
✓ ReZ Mind (AI/ML)
✓ ReZ Copilot (AI Assistant)
✓ QR Codes (Customer Engagement)
✓ ReZ Ads (Advertising)
✓ Cashback System
✓ Referral Program
✓ Upsell Engine
✓ Nudge System
✓ Multi-channel (WhatsApp, SMS, Push)
✓ Analytics Dashboard
✓ Tax Compliance (GST)
```

---

## FEATURE MATRIX

| Feature | Restaurant | Salon | Hotel | Retail | Healthcare | Fitness | Education | Events | Auto | Services |
|---------|------------|-------|--------|--------|------------|---------|-----------|--------|-------|----------|
| **Scheduling** | | | | | | | | | | |
| Appointments | ✓ | ✓ | | | ✓ | ✓ | ✓ | ✓ | | ✓ |
| Table Booking | ✓ | | | | | | | ✓ | | |
| Room Booking | | | ✓ | | | | | | | |
| **Inventory** | | | | | | | | | | |
| Products/Menu | ✓ | ✓ | | ✓ | | | | | ✓ | |
| Rooms | | | ✓ | | | | | | | |
| Vehicles | | | | | | | | | ✓ | |
| **CRM** | | | | | | | | | | |
| Customer Profiles | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Service History | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| Medical History | | | | | ✓ | | | | | |
| Vehicle History | | | | | | | | | ✓ | |
| **Billing** | | | | | | | | | | |
| POS/Billing | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GST Invoice | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Insurance Claims | | | | | ✓ | | | | | |
| **Operations** | | | | | | | | | | |
| Kitchen Display | ✓ | | | | | | | | | |
| Housekeeping | | | ✓ | | | | | | | |
| KDS | ✓ | | | | | | | | | |
| Job Cards | | | | | | | | | ✓ | |
| **Integrations** | | | | | | | | | | |
| OTA | | | ✓ | | | | | | | |
| Delivery | ✓ | | | ✓ | | | | | | |
| POS | | | | ✓ | | | | | | |
| PMS | | | ✓ | | | | | | | |

---

## REZ PLATFORM ADVANTAGES

### For All Industries

1. **Unified Platform**
   - One app for all operations
   - No switching between tools
   - Industry-specific UI/UX

2. **ReZ Mind AI (8 Autonomous Agents)**
   - Acquisition Agent: Automated merchant onboarding
   - Dormant Revival: Re-engage inactive customers
   - Upsell Agent: Personalized recommendations
   - Retention Agent: Churn prevention (90% accuracy)
   - Feedback Agent: Sentiment analysis (95% accuracy)
   - Support Agent: 24/7 ticket resolution (60% automation)
   - Merchant Intelligence: Demand forecasting (85% accuracy)
   - Ad Optimization: Campaign ROI maximization (35% CTR improvement)

3. **ReZ Coins (6 Coin Types)**
   - REZ Coins: Earn anywhere, never expire, Karma-multiplied
   - BRANDED Coins: Merchant-specific, 180-day expiry
   - CASHBACK Coins: Bill uploads, 365-day expiry
   - PROMO Coins: Campaigns, 90-day expiry
   - PRIVE Coins: VIP programs, 365-day expiry
   - REFERRAL Coins: Successful referrals, 180-day expiry

4. **ReZ Copilot**
   - AI assistant for merchants
   - Business insights
   - Action recommendations
   - Real-time analytics

5. **Multi-Channel Engagement**
   - WhatsApp integration
   - SMS & Push notifications
   - 6 QR Code systems (Menu, Store, Room, Ads, Verify, Creator)
   - Web ordering (no app download required)

6. **Payment Ecosystem**
   - Integrated UPI payments (Razorpay)
   - Cashback system
   - Coins redemption (merchant keeps 99%)
   - GST-compliant invoicing

7. **AdBazaar - SMB Advertising Platform**
   - QR-based attribution (scan → try → purchase)
   - Geo-targeting (1-5km radius)
   - Coin incentives for immediate action
   - ₹30-50 CPM vs ₹500+ on Meta
   - Closed-loop ROI tracking

---

## AI INTEGRATION BY INDUSTRY

| Industry | AI Agent | Use Case | Accuracy |
|----------|----------|----------|----------|
| **Restaurant** | Upsell Agent | Menu recommendations, combo suggestions | 85% |
| **Restaurant** | Demand Forecasting | Peak hour prediction, inventory planning | 85% |
| **Salon** | Retention Agent | Re-booking reminders, follow-up | 90% |
| **Hotel** | Revenue Agent | Dynamic pricing, occupancy optimization | 82% |
| **Hotel** | Upsell Agent | Room upgrades, add-ons | 80% |
| **Retail** | Inventory Agent | Auto-reorder, stock optimization | 85% |
| **Retail** | Upsell Agent | Cross-sell, bundle recommendations | 82% |
| **Healthcare** | Triage Agent | Symptom assessment, appointment routing | 88% |
| **Healthcare** | Follow-up Agent | Medication reminders, appointment reminders | 92% |
| **Fitness** | Churn Agent | Attendance drop detection, re-engagement | 90% |
| **Education** | Progress Agent | Student performance tracking, alerts | 85% |
| **Events** | Booking Agent | Lead scoring, conversion optimization | 78% |
| **Auto** | Service Agent | Vehicle health, service reminders | 88% |
| **Services** | Dispatch Agent | Route optimization, staff assignment | 82% |

---

## INTEGRATION ECOSYSTEM

### Connected Services (rez-merchant-integrations)
```
├── AdBazaar ROI Tracking (click/view/conversion)
├── Aggregator Sync (Swiggy, Zomato)
├── Delivery Partner (Dunzo, Shadowfax)
├── Nextabizz Inventory (RFQ, auto-reorder)
└── Corporate Panel (HRIS, GST, Travel)
```

### Finance Services (rez-corporate-service)
```
├── GST E-Invoice with IRN
├── Corporate Card Issuing (Razorpay)
├── Working Capital Loans
├── Expense Management
└── Travel Booking (TBO)
```

### Student Services (rez-student-service)
```
├── Document Verification
├── Student Wallet with Parental Controls
├── Campus Partnerships
├── Student-specific Pricing
└── Gamification (5-tier system)
```

---

## QR CODE SYSTEMS (6 Types)

| QR Type | URL Pattern | Purpose | Revenue Attribution | Industry |
|---------|------------|---------|-------------------|----------|
| **Menu QR** | `menu.rez.money/{slug}` | Restaurant ordering | 0.85-1.00 | Restaurant, Retail |
| **Store QR** | `now.rez.money/{slug}` | Merchant discovery | 0.20-0.60 | All |
| **Room QR** | `room.rez.money/{hotelId}/{roomId}` | Hotel services | 0.40-0.80 | Hotel |
| **Ads QR** | `adsqr.rez.money/c/{campaignId}` | Marketing attribution | 0.25-0.85 | All |
| **Verify QR** | `verify.rez.money/s/{serial}` | Product authentication | 0.15-0.40 | Retail, Auto |
| **Creator QR** | `creator.rez.money/{creatorId}` | Social commerce | 0.20-0.70 | All |

---

## SCREEN COUNT BY INDUSTRY

| Industry | Screens | % of Total |
|----------|---------|------------|
| Restaurant | 46 | 18% |
| Healthcare | 45 | 17% |
| Hotel | 40 | 15% |
| Salon | 35 | 13% |
| Retail | 30 | 12% |
| Education | 30 | 12% |
| Fitness | 25 | 10% |
| Auto | 25 | 10% |
| Services | 20 | 8% |
| Events | 20 | 8% |
| **TOTAL** | **260+** | **100%** |

---

## IMPLEMENTATION STATUS

| Industry | App Screens | Backend | AI | Status |
|----------|-------------|---------|-----|--------|
| Restaurant | ✅ 46 | ✅ | ⚠️ | Built |
| Salon | ✅ 35 | ✅ | ⚠️ | Built |
| Hotel | ✅ 40 | ✅ | ⚠️ | Built |
| Retail | ✅ 30 | ✅ | ⚠️ | Built |
| Healthcare | ✅ 45 | ✅ | ⚠️ | Built |
| Fitness | ✅ 25 | ✅ | ⚠️ | Built |
| Education | ✅ 30 | ✅ | ⚠️ | Built |
| Events | ✅ 20 | ✅ | ⚠️ | Built |
| Auto | ✅ 25 | ✅ | ⚠️ | Built |
| Services | ✅ 20 | ✅ | ⚠️ | Built |

**Legend:**
- ✅ Built & Working
- ⚠️ Built but needs integration
- ❌ Not built

**Note:** All industries have complete app screens and backend services. AI integration varies by vertical with demand forecasting and upsell features in progress.

---

---

## QUICK REFERENCE

### Pricing Tiers (All Industries)
| Tier | Monthly | Transactions | Key Features |
|------|---------|--------------|---------------|
| Starter | Free | 100/mo | Basic POS, QR code |
| Growth | ₹999 | 1,000/mo | Full POS, KDS, analytics |
| Pro | ₹2,999 | Unlimited | Multi-outlet, AI insights |
| Enterprise | ₹9,999 | Unlimited | White-label, API, dedicated support |

### Key Differentiators vs Competitors
| Feature | ReZ | DotPe | Posist | MMT/Goibibo |
|---------|-----|-------|--------|--------------|
| Coin Rewards | ✅ | ❌ | ❌ | ❌ |
| No App Needed | ✅ | ✅ | ❌ | ❌ |
| AI Agents | ✅ | ❌ | ❌ | ❌ |
| Ad Platform | ✅ | ❌ | ❌ | ❌ |
| Hotel OTA | ✅ | ❌ | ❌ | ✅ |
| Commission | 2% | 1.5% | 2%+ | 15-25% |

---

*Document: May 7, 2026*
*Version: 1.1*
*Status: COMPLETE*
*Maintained by: REZ Ecosystem Documentation Team*
