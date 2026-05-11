# Restaurant Ecosystem Test Plan
**Version:** 1.0
**Date:** May 10, 2026
**Priority:** CRITICAL - Production Release Gate

---

## Test Execution Order

We test in layers, starting with the most critical flows:

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: CRITICAL PATH (Must Pass) │
├─────────────────────────────────────────────────────────────┤
│ QR Scan → Order → POS → KDS → Payment → Cashback │
│ │
│ If ANY of these fail, restaurant cannot operate. │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: CORE OPERATIONS │
├─────────────────────────────────────────────────────────────┤
│ Table Management │ Billing │ Refunds │ Inventory │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: ADVANCED FEATURES │
├─────────────────────────────────────────────────────────────┤
│ Loyalty │ Subscriptions │ Marketing │ Analytics │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: RESILIENCE │
├─────────────────────────────────────────────────────────────┤
│ Offline │ Failure Recovery │ Security │ Edge Cases │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: CRITICAL PATH

### Test 1: QR Scan Flow
**Priority:** P0 - BLOCKER
**Services:** ReZ Web Menu, rez-order-service, rez-kds-display

```
┌──────────────────────────────────────────────────────────────┐
│ QR SCAN TEST │
├──────────────────────────────────────────────────────────────┤
│ │
│ TEST DATA │
│ • Valid restaurant QR (RESTAURANT_001) │
│ • Valid table QR (TABLE_5) │
│ • Invalid QR (QR_999) │
│ • Expired QR (expiry: yesterday) │
│ • Already-used QR │
│ │
│ STEPS │
│ │
│ 1. SCAN VALID QR │
│ ├─ QR resolves to correct restaurant │
│ ├─ Table 5 mapped correctly │
│ ├─ Floor mapped correctly │
│ ├─ Waiter assigned │
│ └─ Session created │
│ │
│ 2. SCAN INVALID QR │
│ ├─ Shows error "Invalid QR" │
│ └─ No session created │
│ │
│ 3. SCAN EXPIRED QR │
│ ├─ Shows error "QR Expired" │
│ └─ Option to request new QR │
│ │
│ 4. SCAN QR FOR CLOSED TABLE │
│ ├─ Shows error "Table not available" │
│ └─ Option to select different table │
│ │
│ EXPECTED RESULTS │
│ ✅ Correct restaurant loaded │
│ ✅ Menu synced │
│ ✅ Offers displayed │
│ ✅ Waiter notification sent │
│ ✅ Session persisted │
│ │
│ FAILURE = Restaurant cannot serve customers │
│ │
└──────────────────────────────────────────────────────────────┘
```

**Test Commands:**
```bash
# Generate test QR
curl -X POST http://localhost:4004/api/qr/generate \
  -d '{"tableId": "TABLE_5", "restaurantId": "RESTAURANT_001"}'

# Scan test
curl http://localhost:4004/api/qr/scan?code=TEST_QR_123
```

---

### Test 2: Order Placement Flow
**Priority:** P0 - BLOCKER
**Services:** ReZ Web Menu, rez-order-service

```
┌──────────────────────────────────────────────────────────────┐
│ ORDER PLACEMENT TEST │
├──────────────────────────────────────────────────────────────┤
│ │
│ TEST DATA │
│ • Item with modifiers (Butter Chicken + Extra Spicy) │
│ • Item out of stock │
│ • Combo item │
│ • Empty cart │
│ │
│ STEPS │
│ │
│ 1. ADD ITEM TO CART │
│ ├─ Select Butter Chicken │
│ ├─ Add modifier "Extra Spicy" (+₹20) │
│ ├─ Add modifier "Extra Butter" (+₹30) │
│ ├─ Quantity = 2 │
│ ├─ Add special note "Less oil" │
│ └─ Cart total: ₹(250+20+30)*2 = ₹600 │
│ │
│ 2. ADD OUT-OF-STOCK ITEM │
│ ├─ Item shows "Out of Stock" badge │
│ ├─ Cannot add to cart │
│ └─ Alternative suggested │
│ │
│ 3. SUBMIT ORDER │
│ ├─ Order submitted │
│ ├─ Order ID generated │
│ ├─ KDS notified │
│ └─ Customer sees confirmation │
│ │
│ 4. DUPLICATE SUBMISSION │
│ ├─ Click submit twice rapidly │
│ ├─ Only ONE order created │
│ └─ Idempotency key working │
│ │
│ EXPECTED RESULTS │
│ ✅ Modifiers applied correctly │
│ ✅ Price calculated: ₹600 │
│ ✅ Notes saved │
│ ✅ Stock checked │
│ ✅ Order ID returned │
│ ✅ KDS received order │
│ ✅ No duplicate order │
│ │
│ FAILURE = Customer charged twice │
│ │
└──────────────────────────────────────────────────────────────┘
```

**Edge Cases:**
- [ ] Item removed while in cart
- [ ] Price changed after adding to cart
- [ ] Session timeout during order
- [ ] Network failure mid-submit

---

### Test 3: POS Billing Flow
**Priority:** P0 - BLOCKER
**Services:** rez-merchant-service, POS

```
┌──────────────────────────────────────────────────────────────┐
│ POS BILLING TEST │
├──────────────────────────────────────────────────────────────┤
│ │
│ TEST SCENARIO: Restaurant bill │
│ │
│ ORDER ITEMS │
│ • Butter Chicken x2 @ ₹250 = ₹500 │
│ • Dal Makhani x1 @ ₹180 = ₹180 │
│ • Garlic Naan x3 @ ₹60 = ₹180 │
│ • Cold Coffee x2 @ ₹80 = ₹160 │
│ • Paneer Tikka x1 @ ₹200 (CANCELLED) │
│ │
│ CALCULATIONS │
│ Subtotal: ₹1,020 │
│ Discount: 10% OFF = ₹102 (coupon: SAVE10) │
│ Subtotal after discount: ₹918 │
│ CGST @ 2.5%: ₹22.95 │
│ SGST @ 2.5%: ₹22.95 │
│ Service Charge @ 5%: ₹45.90 │
│ Round Off: -₹0.80 │
│ │
│ GROSS TOTAL: ₹1,009 │
│ Cashback Earned: ₹100.90 │
│ │
│ PAYABLE: ₹908.10 │
│ │
│ STEPS │
│ │
│ 1. GENERATE BILL │
│ ├─ All items listed │
│ ├─ Tax breakdown correct │
│ ├─ Cashback visible │
│ └─ Round-off applied │
│ │
│ 2. VOID ITEM │
│ ├─ Void Paneer Tikka │
│ ├─ Manager approval required │
│ ├─ Audit log created │
│ └─ Bill recalculated │
│ │
│ 3. APPLY DISCOUNT │
│ ├─ Enter coupon SAVE10 │
│ ├─ 10% applied │
│ └─ Updated total shown │
│ │
│ 4. COIN REDEMPTION │
│ ├─ Redeem 500 coins = ₹50 │
│ ├─ Coins deducted │
│ ├─ Final amount updated │
│ └─ Remaining coins shown │
│ │
│ EXPECTED RESULTS │
│ ✅ Subtotal: ₹1,020 │
│ ✅ Discount: ₹102 │
│ ✅ CGST: ₹22.95 │
│ ✅ SGST: ₹22.95 │
│ ✅ Service Charge: ₹45.90 │
│ ✅ Total: ₹1,009 │
│ ✅ Cashback: ₹100.90 │
│ ✅ Round-off: -₹0.80 │
│ ✅ Payable: ₹908.10 │
│ │
│ TAX CALCULATION RULES │
│ • CGST + SGST = 5% on discounted subtotal │
│ • Service Charge = 5% on discounted subtotal │
│ • Cashback shown separately │
│ • Coins applied after cashback │
│ │
│ FAILURE = Revenue leak, customer dispute │
│ │
└──────────────────────────────────────────────────────────────┘
```

**Tax Calculation Test Cases:**
| Scenario | Subtotal | Discount | CGST | SGST | Total |
|----------|----------|----------|------|------|-------|
| No discount | ₹1000 | ₹0 | ₹25 | ₹25 | ₹1050 |
| 10% off | ₹1000 | ₹100 | ₹22.50 | ₹22.50 | ₹945 |
| 20% off | ₹1000 | ₹200 | ₹20 | ₹20 | ₹840 |
| Free item | ₹1000 | ₹200 | ₹20 | ₹20 | ₹840 |

---

### Test 4: KDS Sync Flow
**Priority:** P0 - BLOCKER
**Services:** rez-kitchen-display, rez-kitchen-ai, rez-order-service

```
┌──────────────────────────────────────────────────────────────┐
│ KDS SYNC TEST │
├──────────────────────────────────────────────────────────────┤
│ │
│ ORDER FLOW │
│ │
│ [Web Menu] → Order #1234 →
│ [POS] → Confirmed →
│ [KDS] → Received →
│ [Kitchen AI] → Routing →
│ [Stations] → Preparation →
│ [KDS] → Ready →
│ [Waiter] → Served →
│ [Customer] → Enjoying │
│ │
│ STEPS │
│ │
│ 1. ORDER RECEIVED │
│ ├─ KDS shows new order │
│ ├─ Sound alert played │
│ ├─ Order time started │
│ └─ All items displayed │
│ │
│ 2. STATION ROUTING │
│ ├─ Butter Chicken → Grill Station │
│ ├─ Coffee → Beverage Station │
│ ├─ Dessert → Dessert Station │
│ └─ Routing logged │
│ │
│ 3. STATUS UPDATE │
│ ├─ Kitchen starts prep │
│ ├─ Update status: PREPARING │
│ ├─ Timer starts │
│ ├─ Customer sees status │
│ │
│ 4. DELAY ALERT │
│ ├─ Order overdue (>15 min) │
│ ├─ KDS shows delay warning │
│ ├─ Manager alerted │
│ └─ Customer ETA updated │
│ │
│ 5. ORDER READY │
│ ├─ All items ready │
│ ├─ KDS shows READY │
│ ├─ Waiter notified │
│ └─ Customer notified │
│ │
│ 6. ORDER COMPLETED │
│ ├─ Waiter marks served │
│ ├─ KOT closed │
│ ├─ Analytics updated │
│ └─ CRM updated │
│ │
│ EXPECTED RESULTS │
│ ✅ Order appears in <1 second │
│ ✅ Routing correct │
│ ✅ Status updates real-time │
│ ✅ Alerts triggered correctly │
│ ✅ Cross-service sync │
│ │
│ FAILURE = Kitchen chaos, customer frustration │
│ │
└──────────────────────────────────────────────────────────────┘
```

---

### Test 5: Payment Flow
**Priority:** P0 - BLOCKER
**Services:** rez-payment-service, UPI gateway

```
┌──────────────────────────────────────────────────────────────┐
│ PAYMENT TEST │
├──────────────────────────────────────────────────────────────┤
│ │
│ SCENARIO: ₹908.10 payable │
│ │
│ TEST CASES │
│ │
│ 1. UPI PAYMENT (SUCCESS) │
│ ├─ Select UPI │
│ ├─ Scan QR code │
│ ├─ Payment gateway opened │
│ ├─ Payment approved │
│ ├─ Success message │
│ └─ Cashback credited │
│ │
│ 2. UPI PAYMENT (FAILURE) │
│ ├─ Payment declined │
│ ├─ Show error │
│ ├─ Retry option │
│ ├─ Order still active │
│ └─ No duplicate charge │
│ │
│ 3. CARD PAYMENT │
│ ├─ Enter card details │
│ ├─ 3D Secure │
│ ├─ Payment success │
│ └─ Receipt generated │
│ │
│ 4. SPLIT PAYMENT │
│ ├─ UPI: ₹500 │
│ ├─ Card: ₹408.10 │
│ ├─ Both successful │
│ └─ Order completed │
│ │
│ 5. WALLET PAYMENT │
│ ├─ ReZ Wallet: ₹400 │
│ ├─ UPI: ₹508.10 │
│ ├─ Wallet debited │
│ └─ Balance updated │
│ │
│ 6. CASH + PARTIAL UPI │
│ ├─ Cash: ₹500 │
│ ├─ UPI: ₹408.10 │
│ ├─ Order completed │
│ └─ Cash logged │
│ │
│ 7. PAYMENT TIMEOUT │
│ ├─ Don't complete payment │
│ ├─ 5 minute timeout │
│ ├─ Order cancelled │
│ ├─ No partial charge │
│ └─ Inventory restored │
│ │
│ 8. DUPLICATE PAYMENT ATTACK │
│ ├─ User clicks pay 3 times │
│ ├─ Only one charge │
│ ├─ Idempotency working │
│ └─ Other payments cancelled │
│ │
│ EXPECTED RESULTS │
│ ✅ Payment success recorded │
│ ✅ Cashback credited │
│ ✅ Order marked complete │
│ ✅ Receipt generated │
│ ✅ No double charge │
│ ✅ Inventory updated │
│ ✅ CRM updated │
│ │
│ FAILURE = Financial loss, fraud │
│ │
└──────────────────────────────────────────────────────────────┘
```

---

### Test 6: Cashback Flow
**Priority:** P0 - BLOCKER
**Services:** rez-loyalty-service, rez-wallet-service

```
┌──────────────────────────────────────────────────────────────┐
│ CASHBACK TEST │
├──────────────────────────────────────────────────────────────┤
│ │
│ SCENARIO │
│ • Customer: Rahul (user_123) │
│ • Order: ₹1,000 │
│ • Cashback rate: 10% │
│ • Current balance: 500 coins │
│ │
│ STEPS │
│ │
│ 1. CASHBACK CREDIT │
│ ├─ Order completed │
│ ├─ Cashback calculated: ₹100 │
│ ├─ Coins credited: 1000 coins │
│ ├─ Balance: 500 + 1000 = 1500 │
│ └─ Transaction logged │
│ │
│ 2. CASHBACK EXPIRY │
│ ├─ Coins expire in 90 days │
│ ├─ Reminder at 7 days │
│ ├─ Expired coins deducted │
│ └─ Customer notified │
│ │
│ 3. CASHBACK STACKING │
│ ├─ 10% restaurant cashback │
│ ├─ 5% ReZ Coins │
│ ├─ 2% promo cashback │
│ ├─ All credited │
│ └─ Total: 17% cashback │
│ │
│ 4. REDEMPTION │
│ ├─ Redeem 500 coins │
│ ├─ = ₹50 │
│ ├─ Coins deducted │
│ ├─ Balance: 1000 │
│ └─ Order discounted │
│ │
│ 5. STACKING WITH REDEMPTION │
│ ├─ Earn 1000 cashback │
│ ├─ Redeem 500 coins │
│ ├─ Net benefit: 1000 - 500 = 500 coins extra │
│ └─ Calculated correctly │
│ │
│ EXPECTED RESULTS │
│ ✅ 10% cashback = 1000 coins │
│ ✅ Balance updated │
│ ✅ Expiry tracked │
│ ✅ Stacking correct │
│ ✅ Redemption correct │
│ ✅ No double credit │
│ │
│ FAILURE = Revenue leak │
│ │
└──────────────────────────────────────────────────────────────┘
```

---

### Test 7: Inventory Deduction Flow
**Priority:** P0 - BLOCKER
**Services:** rez-inventory-service

```
┌──────────────────────────────────────────────────────────────┐
│ INVENTORY DEDUCTION TEST │
├──────────────────────────────────────────────────────────────┤
│ │
│ SCENARIO: 2x Butter Chicken ordered │
│ │
│ BUTTER CHICKEN RECIPE │
│ • Chicken: 200g │
│ • Butter: 30g │
│ • Cream: 50ml │
│ • Oil: 20ml │
│ • Spices: 15g │
│ • Tomato: 100g │
│ │
│ DEDUCTION FOR 2x │
│ • Chicken: -400g │
│ • Butter: -60g │
│ • Cream: -100ml │
│ • Oil: -40ml │
│ • Spices: -30g │
│ • Tomato: -200g │
│ │
│ STEPS │
│ │
│ 1. ORDER CONFIRMED │
│ ├─ Recipe resolved │
│ ├─ Ingredients calculated │
│ ├─ Inventory checked │
│ └─ Deduction queued │
│ │
│ 2. STOCK DEDUCTION │
│ ├─ All ingredients deducted │
│ ├─ Per-unit cost calculated │
│ └─ Audit log created │
│ │
│ 3. MODIFIER IMPACT │
│ ├─ Extra Butter selected │
│ ├─ +10g butter deducted │
│ └─ Correct total │
│ │
│ 4. COMBO DEDUCTION │
│ ├─ Combo includes drink │
│ ├─ Both items deducted │
│ └─ Correct quantities │
│ │
│ 5. LOW STOCK ALERT │
│ ├─ Butter at 500g │
│ ├─ Threshold: 1000g │
│ ├─ Alert triggered │
│ └─ Manager notified │
│ │
│ 6. OUT OF STOCK │
│ ├─ Chicken reaches 0 │
│ ├─ Item auto-disabled │
│ ├─ Menu updated │
│ └─ Customer notified │
│ │
│ 7. NEGATIVE STOCK │
│ ├─ Oversell prevented │
│ ├─ Order queued │
│ └─ Wait for stock │
│ │
│ EXPECTED RESULTS │
│ ✅ Quantities correct │
│ ✅ Modifiers applied │
│ ✅ Cost calculated │
│ ✅ Alerts triggered │
│ ✅ No negative stock │
│ ✅ Audit trail │
│ │
│ FAILURE = Financial loss, customer upset │
│ │
└──────────────────────────────────────────────────────────────┘
```

---

### Test 8: Table Management Flow
**Priority:** P0 - BLOCKER
**Services:** rez-merchant-service

```
┌──────────────────────────────────────────────────────────────┐
│ TABLE MANAGEMENT TEST │
├──────────────────────────────────────────────────────────────┤
│ │
│ SCENARIO: Restaurant with 10 tables │
│ │
│ STEPS │
│ │
│ 1. OPEN TABLE │
│ ├─ Select Table 5 │
│ ├─ Number of guests: 4 │
│ ├─ Waiter: Rahul assigned │
│ ├─ Status: OCCUPIED │
│ └─ Timer started │
│ │
│ 2. TRANSFER TABLE │
│ ├─ Move Table 5 → Table 8 │
│ ├─ Orders moved │
│ ├─ Bill updated │
│ ├─ Waiter: Rahul │
│ └─ History preserved │
│ │
│ 3. MERGE TABLES │
│ ├─ Table 3 + Table 4 │
│ ├─ Combined into Table 3 │
│ ├─ Orders merged │
│ ├─ Single bill │
│ └─ Both waiters notified │
│ │
│ 4. SPLIT BILL │
│ ├─ Split Table 5 │
│ ├─ Party A: ₹500 │
│ ├─ Party B: ₹408.10 │
│ ├─ Separate payments │
│ └─ Both settled │
│ │
│ 5. CLOSE TABLE │
│ ├─ All orders complete │
│ ├─ Payment received │
│ ├─ Status: VACANT │
│ ├─ Cleanup checklist │
│ └─ Ready for next │
│ │
│ 6. RACE CONDITION │
│ ├─ Waiter A opens Table 5 │
│ ├─ Waiter B opens Table 5 │
│ ├─ Second gets error │
│ └─ First wins │
│ │
│ EXPECTED RESULTS │
│ ✅ Real-time status │
│ ✅ Correct assignments │
│ ✅ Transfer successful │
│ ✅ Split accurate │
│ ✅ No conflicts │
│ │
│ FAILURE = Revenue loss, customer disputes │
│ │
└──────────────────────────────────────────────────────────────┘
```

---

### Test 9: Refund Flow
**Priority:** P0 - BLOCKER
**Services:** rez-payment-service, rez-refund-service

```
┌──────────────────────────────────────────────────────────────┐
│ REFUND TEST │
├──────────────────────────────────────────────────────────────┤
│ │
│ SCENARIO: Order ₹1,009, paid via UPI │
│ │
│ TEST CASES │
│ │
│ 1. ITEM VOID (BEFORE COOKING) │
│ ├─ Void Paneer Tikka: ₹200 │
│ ├─ Cashback reversed: ₹20 │
│ ├─ UPI refund: ₹200 │
│ ├─ Time: Instant │
│ └─ Status: COMPLETED │
│ │
│ 2. ITEM VOID (AFTER COOKING) │
│ ├─ Void Paneer Tikka: ₹200 │
│ ├─ Manager approval required │
│ ├─ Reason: "Wrong order" │
│ ├─ Refund initiated │
│ └─ Partial refund: ₹180 │
│ │
│ 3. FULL ORDER CANCEL │
│ ├─ Cancel entire order │
│ ├─ Customer notified │
│ ├─ Cashback reversed │
│ ├─ Coins reversed │
│ ├─ UPI refund: ₹1,009 │
│ └─ Time: 3-5 days │
│ │
│ 4. PARTIAL REFUND │
│ ├─ Order: ₹1,009 │
│ ├─ Already consumed: ₹300 │
│ ├─ Refund: ₹709 │
│ ├─ Reason required │
│ └─ Manager approved │
│ │
│ 5. REFUND AFTER CASHBACK │
│ ├─ Original: ₹1,009 │
│ ├─ Cashback earned: ₹100 │
│ ├─ Customer wallet: ₹100 │
│ ├─ Refund: ₹1,009 │
│ ├─ Wallet debited: ₹100 │
│ ├─ Net refund: ₹909 │
│ └─ Correct calculation │
│ │
│ 6. MULTIPLE PAYMENTS │
│ ├─ UPI: ₹700 │
│ ├─ Card: ₹309 │
│ ├─ Refund: ₹1,009 │
│ ├─ Both refunded │
│ └─ Both to source │
│ │
│ 7. FRAUDULENT REFUND │
│ ├─ 3rd refund in week │
│ ├─ Flagged │
│ ├─ Manager review │
│ └─ Approved/Denied │
│ │
│ EXPECTED RESULTS │
│ ✅ Correct amount │
│ ✅ Correct source │
│ ✅ Cashback reversed │
│ ✅ Wallet updated │
│ ✅ Audit trail │
│ ✅ Fraud detection │
│ │
│ FAILURE = Revenue loss │
│ │
└──────────────────────────────────────────────────────────────┘
```

---

### Test 10: Offline Recovery Flow
**Priority:** P0 - BLOCKER
**Services:** All services

```
┌──────────────────────────────────────────────────────────────┐
│ OFFLINE RECOVERY TEST │
├──────────────────────────────────────────────────────────────┤
│ │
│ SCENARIO: Internet disconnects during order │
│ │
│ STEPS │
│ │
│ 1. ORDER IN PROGRESS │
│ ├─ Customer adds items │
│ ├─ Cart persisted locally │
│ └─ Submit order │
│ │
│ 2. NETWORK FAILS │
│ ├─ Submit times out │
│ ├─ "No internet" shown │
│ ├─ Order queued locally │
│ └─ Customer notified │
│ │
│ 3. LOCAL QUEUE │
│ ├─ Order stored in IndexedDB │
│ ├─ Retry attempt 1 │
│ ├─ Retry attempt 2 │
│ └─ Retry attempt 3 │
│ │
│ 4. RECONNECTION │
│ ├─ Internet restored │
│ ├─ Queue processed │
│ ├─ Order submitted │
│ ├─ Success confirmed │
│ └─ Local cleared │
│ │
│ 5. DUPLICATE PREVENTION │
│ ├─ Same order queued │
│ ├─ Idempotency key │
│ ├─ Server rejects dup │
│ └─ Customer notified │
│ │
│ 6. POS OFFLINE │
│ ├─ Restaurant internet down │
│ ├─ POS works locally │
│ ├─ Orders queued │
│ ├─ Sync on restore │
│ └─ No data loss │
│ │
│ 7. PAYMENT FAILURE │
│ ├─ Payment initiated │
│ ├─ Network fails │
│ ├─ Payment gateway uncertain │
│ ├─ Query payment status │
│ ├─ If success: complete │
│ ├─ If fail: retry │
│ └─ No double charge │
│ │
│ EXPECTED RESULTS │
│ ✅ Orders queued │
│ ✅ No data loss │
│ ✅ Sync on restore │
│ ✅ No duplicates │
│ ✅ Customer informed │
│ │
│ FAILURE = Lost orders, customer disputes │
│ │
└──────────────────────────────────────────────────────────────┘
```

---

## PHASE 2: CORE OPERATIONS

### Test 11: Waiter App Flow
- [ ] Login/Logout
- [ ] Table assignment
- [ ] Order entry
- [ ] KOT management
- [ ] Bill collection

### Test 12: Menu Management Flow
- [ ] Add/Edit/Delete items
- [ ] Category management
- [ ] Price updates
- [ ] Availability toggle
- [ ] Image upload
- [ ] Modifier groups

### Test 13: Delivery Flow
- [ ] Order assignment
- [ ] Rider allocation
- [ ] ETA calculation
- [ ] Live tracking
- [ ] Delivery completion
- [ ] Aggregator sync (Swiggy, Zomato, ONDC)

### Test 14: Loyalty & Streaks
- [ ] Visit counting
- [ ] Streak updates
- [ ] Milestone unlocks
- [ ] Tier upgrades
- [ ] Referral rewards

### Test 15: Subscription Flow
- [ ] Plan selection
- [ ] Payment deduction
- [ ] Benefit redemption
- [ ] Plan expiry
- [ ] Renewal

---

## PHASE 3: ADVANCED FEATURES

### Test 16: Marketing Campaigns
- [ ] Cashback campaigns
- [ ] Geo-targeting
- [ ] Influencer campaigns
- [ ] Push notifications
- [ ] Email campaigns

### Test 17: AI Recommendations
- [ ] Menu recommendations
- [ ] Personalization
- [ ] Demand forecasting
- [ ] Churn prediction

### Test 18: Analytics
- [ ] Real-time sales
- [ ] Dish analytics
- [ ] Customer analytics
- [ ] Staff performance
- [ ] Heatmaps

---

## PHASE 4: RESILIENCE & SECURITY

### Test 19: Security
- [ ] Role-based access
- [ ] API authentication
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Rate limiting
- [ ] Input validation

### Test 20: Edge Cases
- [ ] Two waiters edit same table
- [ ] Payment success + POS failure
- [ ] KDS disconnect during order
- [ ] Duplicate order submission
- [ ] Customer leaves without payment
- [ ] Inventory goes negative
- [ ] QR scanned after table closed
- [ ] Refund after cashback expires

---

## Test Data Required

### Restaurants
- RESTAURANT_001 (Full menu, active)
- RESTAURANT_002 (Limited menu, testing)
- RESTAURANT_003 (New, onboarding)

### Users
- CUSTOMER_001 (Regular, ₹10,000 wallet)
- CUSTOMER_002 (VIP, 50K coins)
- CUSTOMER_003 (New, no history)

### Waiters
- WAITER_001 (Senior)
- WAITER_002 (Junior)

### Items
- ITEM_001 (Butter Chicken - ₹250, stock: 50)
- ITEM_002 (Dal Makhani - ₹180, stock: 30)
- ITEM_003 (Naan - ₹60, stock: 100)

---

## Success Criteria

| Phase | Critical Pass Rate |
|-------|-------------------|
| Phase 1 (Critical) | 100% |
| Phase 2 (Operations) | 95% |
| Phase 3 (Advanced) | 90% |
| Phase 4 (Resilience) | 100% |

**ALL P0 TESTS MUST PASS BEFORE PRODUCTION**

---

## Test Sign-Off

| Test | Tester | Date | Result |
|------|--------|------|--------|
| QR Scan | | | |
| Order Placement | | | |
| POS Billing | | | |
| KDS Sync | | | |
| Payment | | | |
| Cashback | | | |
| Inventory | | | |
| Table Management | | | |
| Refund | | | |
| Offline Recovery | | | |

**Approved By:** ________________

**Date:** ________________

---

*Document Version: 1.0*
*Last Updated: May 10, 2026*
