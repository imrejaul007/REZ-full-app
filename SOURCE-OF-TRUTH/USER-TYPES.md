# REZ ECOSYSTEM - USER TYPES
**Date:** May 10, 2026

---

## USER TYPES IN REZ ECOSYSTEM

### 1. STUDENT
| Attribute | Value |
|-----------|-------|
| Discount | 10-20% |
| Use Case | Education, Events, Travel |
| Verification | Student ID |
| Platform | Student-specific offers |

### 2. CORPORATE
| Attribute | Value |
|-----------|-------|
| Role | Admin, HR, Manager, Employee |
| Use Case | B2B procurement, Bulk orders |
| Verification | Company email |
| Platform | Corporate dashboard |

### 3. DOCTOR
| Attribute | Value |
|-----------|-------|
| Use Case | Medical supplies, Equipment |
| Verification | Medical license |
| Platform | Healthcare vertical |

### 4. ARMY/POLICE
| Attribute | Value |
|-----------|-------|
| Discount | 15-25% |
| Use Case | Mess, Supplies |
| Verification | ID proof |
| Platform | Defense vertical |

### 5. TEACHER/EDUCATOR
| Attribute | Value |
|-----------|-------|
| Use Case | School supplies, Events |
| Verification | School/College ID |
| Platform | Education vertical |

### 6. NURSE/HEALTHCARE
| Attribute | Value |
|-----------|-------|
| Use Case | Medical supplies |
| Verification | Hospital/Clinic ID |
| Platform | Healthcare vertical |

### 7. DRIVER
| Attribute | Value |
|-----------|-------|
| App | rez-driver-app |
| Use Case | Delivery, Logistics |
| Verification | License |

### 8. MERCHANT
| Attribute | Value |
|-----------|-------|
| App | rez-app-merchant |
| Use Case | POS, Inventory |
| Verification | Business license |

### 9. VENDOR
| Attribute | Value |
|-----------|-------|
| Use Case | Supply chain |
| Verification | GST/VAT |

### 10. GUEST
| Attribute | Value |
|-----------|-------|
| Access | Limited |
| Use Case | Browse only |
| Upgrade | Register for full access |

### 11. HOST
| Attribute | Value |
|-----------|-------|
| Use Case | Events, Stays |
| Verification | Address proof |

### 12. TRAVELLER
| Attribute | Value |
|-----------|-------|
| Use Case | Hotels, Stays, Travel |
| Verification | Email/Phone |

---

## USER ROLES IN DATABASE

### Auth Roles
| Role | Access |
|------|--------|
| guest | Limited browse |
| user | Full user access |
| admin | Platform admin |
| super_admin | System admin |

### Corporate Roles
| Role | Access |
|------|--------|
| admin | Company admin |
| approver | Budget approval |
| manager | Team management |
| employee | Standard access |

### User States
| State | Description |
|-------|-------------|
| new_user | Just registered |
| active_user | Active user |
| inactive_user | Dormant |
| banned_user | Suspended |
| deleted_user | Removed |

---

## USER SEGMENTS

| Segment | Description |
|---------|-------------|
| student | Education discount |
| corporate | B2B access |
| premium | Paid subscription |
| guest | Limited access |
| power_user | High engagement |
| return_user | Repeat customer |
| new_user | First purchase |

---

## VERIFICATION LEVELS

| Level | Verification | Access |
|-------|--------------|--------|
| Unverified | None | Limited |
| Phone | OTP verified | Basic |
| Email | Email verified | Medium |
| ID Verified | Govt ID | Full |
| Corporate | Company email | B2B |

---

## USER ATTRIBUTES

| Attribute | Type | Used For |
|-----------|------|----------|
| phone | Required | Login |
| email | Optional | Notifications |
| role | Required | Permissions |
| userType | Optional | Segmentation |
| segment | Calculated | Marketing |
| karma | Calculated | Trust score |
| verificationLevel | Required | Access control |

---

## PLATFORM-WISE USERS

| Platform | Primary Users |
|----------|--------------|
| Consumer App | End users, Shoppers |
| Merchant App | Vendors, Store owners |
| Driver App | Delivery partners |
| Admin Dashboard | Platform admins |
| Hotel Partner | Hotel staff |
| Restaurant Hub | Restaurant staff |

---

## STATUS SUMMARY

| User Type | Verified | Discounts | Platform |
|-----------|----------|-----------|----------|
| Student | Yes | 10-20% | Consumer |
| Corporate | Yes | B2B pricing | Corporate |
| Doctor | Yes | Medical | Healthcare |
| Army/Police | Yes | 15-25% | Defense |
| Teacher | Yes | Education | Education |
| Nurse | Yes | Healthcare | Healthcare |
| Driver | Yes | Delivery | Driver App |
| Merchant | Yes | POS access | Merchant App |
| Vendor | Yes | Wholesale | B2B |
| Guest | No | Browse only | Consumer |

---

## NEXT STEPS

1. Add user type selection to registration
2. Add verification flow for each type
3. Add role-based access control
4. Add segment-specific offers
5. Add Karma scoring per user type
