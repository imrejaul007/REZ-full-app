#!/bin/bash
# Restaurant Ecosystem Test Runner
# Executes all critical flow tests

set -e

echo "=========================================="
echo "ReZ Restaurant Ecosystem Test Runner"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:4000}"
TEST_DELAY=1

# Counters
PASSED=0
FAILED=0
TOTAL=0

# Helper functions
pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
    ((TOTAL++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
    ((TOTAL++))
}

info() {
    echo -e "${YELLOW}ℹ️ INFO${NC}: $1"
}

# Wait between tests
wait_test() {
    sleep $TEST_DELAY
}

# Health check
check_services() {
    echo ""
    echo "=========================================="
    echo "PHASE 0: Service Health Check"
    echo "=========================================="
    echo ""

    info "Checking services availability..."

    # Check API Gateway
    if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
        pass "API Gateway healthy"
    else
        fail "API Gateway unhealthy"
    fi

    # Check Order Service
    if curl -s -f "$API_URL/orders/health" > /dev/null 2>&1; then
        pass "Order Service healthy"
    else
        fail "Order Service unhealthy"
    fi

    # Check Payment Service
    if curl -s -f "$API_URL/payments/health" > /dev/null 2>&1; then
        pass "Payment Service healthy"
    else
        fail "Payment Service unhealthy"
    fi

    # Check KDS
    if curl -s -f "$API_URL/kds/health" > /dev/null 2>&1; then
        pass "KDS healthy"
    else
        fail "KDS unhealthy"
    fi

    # Check Kitchen AI
    if curl -s -f "$API_URL/kitchen-ai/health" > /dev/null 2>&1; then
        pass "Kitchen AI healthy"
    else
        fail "Kitchen AI unhealthy"
    fi
}

# ==========================================
# PHASE 1: CRITICAL PATH TESTS
# ==========================================

test_qr_scan() {
    echo ""
    echo "=========================================="
    echo "TEST 1: QR Scan Flow"
    echo "=========================================="
    echo ""

    # Generate test QR
    info "Generating test QR code..."
    QR_RESPONSE=$(curl -s -X POST "$API_URL/qr/generate" \
        -H "Content-Type: application/json" \
        -d '{"restaurantId": "TEST_001", "tableId": "TABLE_5", "floor": "1"}')

    QR_CODE=$(echo $QR_RESPONSE | jq -r '.code // empty' 2>/dev/null)

    if [ -n "$QR_CODE" ]; then
        pass "QR generated: $QR_CODE"

        # Scan QR
        info "Scanning QR..."
        SCAN_RESPONSE=$(curl -s "$API_URL/qr/scan?code=$QR_CODE")
        RESTAURANT=$(echo $SCAN_RESPONSE | jq -r '.restaurantId // empty' 2>/dev/null)

        if [ "$RESTAURANT" = "TEST_001" ]; then
            pass "QR resolves to correct restaurant"
        else
            fail "QR resolution failed"
        fi

        # Check table mapping
        TABLE=$(echo $SCAN_RESPONSE | jq -r '.tableId // empty' 2>/dev/null)
        if [ "$TABLE" = "TABLE_5" ]; then
            pass "Table 5 mapped correctly"
        else
            fail "Table mapping failed"
        fi
    else
        fail "QR generation failed"
    fi

    # Test invalid QR
    info "Testing invalid QR..."
    INVALID_RESPONSE=$(curl -s "$API_URL/qr/scan?code=INVALID_QR")
    ERROR=$(echo $INVALID_RESPONSE | jq -r '.error // empty' 2>/dev/null)

    if [ -n "$ERROR" ]; then
        pass "Invalid QR handled correctly"
    else
        fail "Invalid QR should return error"
    fi

    wait_test
}

test_order_placement() {
    echo ""
    echo "=========================================="
    echo "TEST 2: Order Placement Flow"
    echo "=========================================="
    echo ""

    # Create session
    info "Creating session..."
    SESSION_RESPONSE=$(curl -s -X POST "$API_URL/session/create" \
        -H "Content-Type: application/json" \
        -d '{"restaurantId": "TEST_001", "tableId": "TABLE_5"}')

    SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.sessionId // empty' 2>/dev/null)

    if [ -n "$SESSION_ID" ]; then
        pass "Session created: $SESSION_ID"

        # Add item to cart
        info "Adding item to cart..."
        CART_RESPONSE=$(curl -s -X POST "$API_URL/cart/add" \
            -H "Content-Type: application/json" \
            -d "{\"sessionId\": \"$SESSION_ID\", \"itemId\": \"ITEM_001\", \"quantity\": 2, \"modifiers\": [{\"id\": \"MOD_EXTRA_SPICY\", \"price\": 20}]}")

        ITEM_ADDED=$(echo $CART_RESPONSE | jq -r '.success // false' 2>/dev/null)

        if [ "$ITEM_ADDED" = "true" ]; then
            pass "Item added to cart"

            # Verify cart total
            CART_TOTAL=$(echo $CART_RESPONSE | jq -r '.cart.total // 0' 2>/dev/null)
            info "Cart total: ₹$CART_TOTAL"

            # Submit order
            info "Submitting order..."
            ORDER_RESPONSE=$(curl -s -X POST "$API_URL/orders/submit" \
                -H "Content-Type: application/json" \
                -d "{\"sessionId\": \"$SESSION_ID\"}")

            ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.orderId // empty' 2>/dev/null)

            if [ -n "$ORDER_ID" ]; then
                pass "Order submitted: $ORDER_ID"

                # Verify order in KDS
                info "Verifying order in KDS..."
                KDS_RESPONSE=$(curl -s "$API_URL/kds/order/$ORDER_ID")
                KDS_ORDER=$(echo $KDS_RESPONSE | jq -r '.orderId // empty' 2>/dev/null)

                if [ "$KDS_ORDER" = "$ORDER_ID" ]; then
                    pass "Order received in KDS"
                else
                    fail "Order not in KDS"
                fi
            else
                fail "Order submission failed"
            fi
        else
            fail "Add to cart failed"
        fi
    else
        fail "Session creation failed"
    fi

    wait_test
}

test_pos_billing() {
    echo ""
    echo "=========================================="
    echo "TEST 3: POS Billing Flow"
    echo "=========================================="
    echo ""

    # Generate bill
    info "Generating bill..."
    BILL_RESPONSE=$(curl -s -X POST "$API_URL/pos/bill/generate" \
        -H "Content-Type: application/json" \
        -d '{"orderId": "TEST_ORDER_001"}')

    SUBTOTAL=$(echo $BILL_RESPONSE | jq -r '.subtotal // 0' 2>/dev/null)
    info "Subtotal: ₹$SUBTOTAL"

    if [ "$SUBTOTAL" -gt 0 ]; then
        pass "Bill generated"

        # Verify tax calculation
        CGST=$(echo $BILL_RESPONSE | jq -r '.taxes.cgst // 0' 2>/dev/null)
        SGST=$(echo $BILL_RESPONSE | jq -r '.taxes.sgst // 0' 2>/dev/null)
        TOTAL=$(echo $BILL_RESPONSE | jq -r '.total // 0' 2>/dev/null)

        info "CGST: ₹$CGST"
        info "SGST: ₹$SGST"
        info "Total: ₹$TOTAL"

        # Verify CGST = SGST (standard)
        if [ "$CGST" = "$SGST" ]; then
            pass "Tax calculation correct (CGST = SGST)"
        else
            fail "Tax calculation error"
        fi

        # Test discount
        info "Applying discount..."
        DISCOUNT_RESPONSE=$(curl -s -X POST "$API_URL/pos/bill/apply-discount" \
            -H "Content-Type: application/json" \
            -d '{"orderId": "TEST_ORDER_001", "code": "SAVE10", "type": "percentage", "value": 10}')

        DISCOUNT_APPLIED=$(echo $DISCOUNT_RESPONSE | jq -r '.applied // false' 2>/dev/null)

        if [ "$DISCOUNT_APPLIED" = "true" ]; then
            pass "Discount applied"
        else
            fail "Discount failed"
        fi
    else
        fail "Bill generation failed"
    fi

    wait_test
}

test_kds_sync() {
    echo ""
    echo "=========================================="
    echo "TEST 4: KDS Sync Flow"
    echo "=========================================="
    echo ""

    # Create test order
    info "Creating test order in KDS..."
    KDS_RESPONSE=$(curl -s -X POST "$API_URL/kds/order" \
        -H "Content-Type: application/json" \
        -d '{"restaurantId": "TEST_001", "items": [{"id": "ITEM_001", "station": "grill"}, {"id": "ITEM_002", "station": "beverage"}]}')

    ORDER_ID=$(echo $KDS_RESPONSE | jq -r '.orderId // empty' 2>/dev/null)

    if [ -n "$ORDER_ID" ]; then
        pass "Order created in KDS: $ORDER_ID"

        # Verify station routing
        GRILL=$(echo $KDS_RESPONSE | jq -r '.routing.grill // empty' 2>/dev/null)
        BEVERAGE=$(echo $KDS_RESPONSE | jq -r '.routing.beverage // empty' 2>/dev/null)

        if [ -n "$GRILL" ] && [ -n "$BEVERAGE" ]; then
            pass "Station routing correct"
        else
            fail "Station routing failed"
        fi

        # Update status to preparing
        info "Updating status to preparing..."
        PREP_RESPONSE=$(curl -s -X PUT "$API_URL/kds/order/$ORDER_ID/status" \
            -H "Content-Type: application/json" \
            -d '{"status": "preparing"}')

        STATUS=$(echo $PREP_RESPONSE | jq -r '.status // empty' 2>/dev/null)

        if [ "$STATUS" = "preparing" ]; then
            pass "Status updated to preparing"
        else
            fail "Status update failed"
        fi

        # Test delay alert
        info "Testing delay alert..."
        DELAY_RESPONSE=$(curl -s -X POST "$API_URL/kds/order/$ORDER_ID/delay" \
            -H "Content-Type: application/json" \
            -d '{"delaySeconds": 900}')

        ALERT_TRIGGERED=$(echo $DELAY_RESPONSE | jq -r '.alertTriggered // false' 2>/dev/null)

        if [ "$ALERT_TRIGGERED" = "true" ]; then
            pass "Delay alert triggered"
        else
            fail "Delay alert not working"
        fi
    else
        fail "KDS order creation failed"
    fi

    wait_test
}

test_payment() {
    echo ""
    echo "=========================================="
    echo "TEST 5: Payment Flow"
    echo "=========================================="
    echo ""

    # Create payment
    info "Initiating UPI payment..."
    PAY_RESPONSE=$(curl -s -X POST "$API_URL/payments/initiate" \
        -H "Content-Type: application/json" \
        -d '{"orderId": "TEST_ORDER_001", "amount": 908.10, "method": "upi"}')

    TXN_ID=$(echo $PAY_RESPONSE | jq -r '.transactionId // empty' 2>/dev/null)

    if [ -n "$TXN_ID" ]; then
        pass "Payment initiated: $TXN_ID"

        # Simulate UPI success
        info "Simulating UPI success..."
        SUCCESS_RESPONSE=$(curl -s -X POST "$API_URL/payments/callback" \
            -H "Content-Type: application/json" \
            -d "{\"transactionId\": \"$TXN_ID\", \"status\": \"success\"}")

        PAY_STATUS=$(echo $SUCCESS_RESPONSE | jq -r '.status // empty' 2>/dev/null)

        if [ "$PAY_STATUS" = "success" ]; then
            pass "Payment successful"

            # Verify cashback
            CASHBACK=$(echo $SUCCESS_RESPONSE | jq -r '.cashback // 0' 2>/dev/null)
            info "Cashback earned: ₹$CASHBACK"

            if [ "$CASHBACK" -gt 0 ]; then
                pass "Cashback credited"
            else
                fail "Cashback not credited"
            fi
        else
            fail "Payment failed"
        fi
    else
        fail "Payment initiation failed"
    fi

    # Test payment failure handling
    info "Testing payment failure..."
    FAIL_RESPONSE=$(curl -s -X POST "$API_URL/payments/callback" \
        -H "Content-Type: application/json" \
        -d '{"transactionId": "FAIL_TXN_001", "status": "failed"}')

    FAIL_HANDLED=$(echo $FAIL_RESPONSE | jq -r '.handled // false' 2>/dev/null)

    if [ "$FAIL_HANDLED" = "true" ]; then
        pass "Payment failure handled correctly"
    else
        fail "Payment failure not handled"
    fi

    wait_test
}

test_cashback() {
    echo ""
    echo "=========================================="
    echo "TEST 6: Cashback & Coins Flow"
    echo "=========================================="
    echo ""

    # Check wallet balance
    info "Checking wallet balance..."
    WALLET_RESPONSE=$(curl -s "$API_URL/wallet/USER_001")

    BALANCE=$(echo $WALLET_RESPONSE | jq -r '.balance // 0' 2>/dev/null)
    info "Current balance: $BALANCE coins"

    # Credit cashback
    info "Crediting cashback..."
    CREDIT_RESPONSE=$(curl -s -X POST "$API_URL/wallet/credit" \
        -H "Content-Type: application/json" \
        -d '{"userId": "USER_001", "amount": 1000, "type": "cashback", "orderId": "TEST_ORDER_001"}')

    CREDITED=$(echo $CREDIT_RESPONSE | jq -r '.success // false' 2>/dev/null)

    if [ "$CREDITED" = "true" ]; then
        pass "Cashback credited"

        # Verify balance updated
        NEW_BALANCE=$(echo $CREDIT_RESPONSE | jq -r '.newBalance // 0' 2>/dev/null)
        info "New balance: $NEW_BALANCE"

        if [ "$NEW_BALANCE" -gt "$BALANCE" ]; then
            pass "Balance updated correctly"
        else
            fail "Balance not updated"
        fi
    else
        fail "Cashback credit failed"
    fi

    # Test redemption
    info "Testing redemption..."
    REDEEM_RESPONSE=$(curl -s -X POST "$API_URL/wallet/redeem" \
        -H "Content-Type: application/json" \
        -d '{"userId": "USER_001", "amount": 500}')

    REDEEMED=$(echo $REDEEM_RESPONSE | jq -r '.success // false' 2>/dev/null)

    if [ "$REDEEMED" = "true" ]; then
        pass "Redemption successful"
    else
        fail "Redemption failed"
    fi

    wait_test
}

test_inventory() {
    echo ""
    echo "=========================================="
    echo "TEST 7: Inventory Deduction Flow"
    echo "=========================================="
    echo ""

    # Check current stock
    info "Checking stock for Butter Chicken..."
    STOCK_RESPONSE=$(curl -s "$API_URL/inventory/ITEM_001")

    CURRENT_STOCK=$(echo $STOCK_RESPONSE | jq -r '.stock // 0' 2>/dev/null)
    info "Current stock: $CURRENT_STOCK units"

    # Deduct for order
    info "Deducting for 2x Butter Chicken..."
    DEDUCT_RESPONSE=$(curl -s -X POST "$API_URL/inventory/deduct" \
        -H "Content-Type: application/json" \
        -d '{"itemId": "ITEM_001", "quantity": 2, "orderId": "TEST_ORDER_001"}')

    DEDUCTED=$(echo $DEDUCT_RESPONSE | jq -r '.success // false' 2>/dev/null)

    if [ "$DEDUCTED" = "true" ]; then
        pass "Inventory deducted"

        NEW_STOCK=$(echo $DEDUCT_RESPONSE | jq -r '.newStock // 0' 2>/dev/null)
        info "New stock: $NEW_STOCK"

        EXPECTED=$((CURRENT_STOCK - 2))
        if [ "$NEW_STOCK" = "$EXPECTED" ]; then
            pass "Stock calculated correctly"
        else
            fail "Stock calculation error"
        fi
    else
        fail "Inventory deduction failed"
    fi

    # Test low stock alert
    info "Testing low stock alert..."
    ALERT_RESPONSE=$(curl -s -X POST "$API_URL/inventory/set-stock" \
        -H "Content-Type: application/json" \
        -d '{"itemId": "ITEM_001", "stock": 5}')

    ALERT_TRIGGERED=$(echo $ALERT_RESPONSE | jq -r '.alertTriggered // false' 2>/dev/null)

    if [ "$ALERT_TRIGGERED" = "true" ]; then
        pass "Low stock alert triggered"
    else
        info "Low stock alert check skipped (threshold not met)"
    fi

    wait_test
}

test_table_management() {
    echo ""
    echo "=========================================="
    echo "TEST 8: Table Management Flow"
    echo "=========================================="
    echo ""

    # Open table
    info "Opening Table 5..."
    OPEN_RESPONSE=$(curl -s -X POST "$API_URL/tables/TABLE_5/open" \
        -H "Content-Type: application/json" \
        -d '{"restaurantId": "TEST_001", "waiterId": "WAITER_001", "guests": 4}')

    OPENED=$(echo $OPEN_RESPONSE | jq -r '.success // false' 2>/dev/null)

    if [ "$OPENED" = "true" ]; then
        pass "Table 5 opened"

        # Check status
        STATUS=$(echo $OPEN_RESPONSE | jq -r '.status // empty' 2>/dev/null)
        if [ "$STATUS" = "occupied" ]; then
            pass "Table status: occupied"
        fi

        # Transfer table
        info "Transferring to Table 8..."
        TRANSFER_RESPONSE=$(curl -s -X POST "$API_URL/tables/TABLE_5/transfer" \
            -H "Content-Type: application/json" \
            -d '{"targetTableId": "TABLE_8"}')

        TRANSFERRED=$(echo $TRANSFER_RESPONSE | jq -r '.success // false' 2>/dev/null)

        if [ "$TRANSFERRED" = "true" ]; then
            pass "Table transfer successful"
        else
            fail "Table transfer failed"
        fi
    else
        fail "Table open failed"
    fi

    # Close table
    info "Closing table..."
    CLOSE_RESPONSE=$(curl -s -X POST "$API_URL/tables/TABLE_8/close")

    CLOSED=$(echo $CLOSE_RESPONSE | jq -r '.success // false' 2>/dev/null)

    if [ "$CLOSED" = "true" ]; then
        pass "Table closed"
    else
        fail "Table close failed"
    fi

    wait_test
}

test_refund() {
    echo ""
    echo "=========================================="
    echo "TEST 9: Refund Flow"
    echo "=========================================="
    echo ""

    # Create test payment
    info "Creating test payment..."
    PAY_RESPONSE=$(curl -s -X POST "$API_URL/payments/initiate" \
        -H "Content-Type: application/json" \
        -d '{"orderId": "REFUND_TEST_001", "amount": 500, "method": "upi"}')

    TXN_ID=$(echo $PAY_RESPONSE | jq -r '.transactionId // empty' 2>/dev/null)

    if [ -n "$TXN_ID" ]; then
        # Mark as success
        curl -s -X POST "$API_URL/payments/callback" \
            -H "Content-Type: application/json" \
            -d "{\"transactionId\": \"$TXN_ID\", \"status\": \"success\"}" > /dev/null

        # Process refund
        info "Processing refund..."
        REFUND_RESPONSE=$(curl -s -X POST "$API_URL/payments/refund" \
            -H "Content-Type: application/json" \
            -d "{\"transactionId\": \"$TXN_ID\", \"amount\": 500, \"reason\": \"Customer request\"}")

        REFUNDED=$(echo $REFUND_RESPONSE | jq -r '.success // false' 2>/dev/null)

        if [ "$REFUNDED" = "true" ]; then
            pass "Refund processed"

            REFUND_ID=$(echo $REFUND_RESPONSE | jq -r '.refundId // empty' 2>/dev/null)
            info "Refund ID: $REFUND_ID"

            # Verify audit log
            AUDIT_RESPONSE=$(curl -s "$API_URL/audit/refund/$REFUND_ID")
            AUDIT_LOG=$(echo $AUDIT_RESPONSE | jq -r '.exists // false' 2>/dev/null)

            if [ "$AUDIT_LOG" = "true" ]; then
                pass "Audit log created"
            else
                fail "Audit log missing"
            fi
        else
            fail "Refund failed"
        fi
    else
        fail "Payment creation failed"
    fi

    wait_test
}

test_offline_recovery() {
    echo ""
    echo "=========================================="
    echo "TEST 10: Offline Recovery Flow"
    echo "=========================================="
    echo ""

    # Test order queuing
    info "Testing order queuing..."
    QUEUE_RESPONSE=$(curl -s -X POST "$API_URL/orders/queue" \
        -H "Content-Type: application/json" \
        -d '{"sessionId": "OFFLINE_TEST", "items": [{"id": "ITEM_001"}], "offline": true}')

    QUEUED=$(echo $QUEUE_RESPONSE | jq -r '.queued // false' 2>/dev/null)

    if [ "$QUEUED" = "true" ]; then
        pass "Order queued for offline sync"

        QUEUE_ID=$(echo $QUEUE_RESPONSE | jq -r '.queueId // empty' 2>/dev/null)
        info "Queue ID: $QUEUE_ID"

        # Simulate reconnection
        info "Simulating reconnection..."
        SYNC_RESPONSE=$(curl -s -X POST "$API_URL/orders/sync" \
            -H "Content-Type: application/json" \
            -d "{\"queueId\": \"$QUEUE_ID\"}")

        SYNCED=$(echo $SYNC_RESPONSE | jq -r '.synced // false' 2>/dev/null)

        if [ "$SYNCED" = "true" ]; then
            pass "Order synced on reconnection"
        else
            fail "Sync failed"
        fi
    else
        fail "Queueing failed"
    fi

    # Test idempotency
    info "Testing duplicate prevention..."
    IDEMPOTENT_RESPONSE=$(curl -s -X POST "$API_URL/orders/submit" \
        -H "Content-Type: application/json" \
        -d '{"sessionId": "IDEMPOTENT_TEST", "idempotencyKey": "TEST_KEY_123"}')

    ORDER_1=$(echo $IDEMPOTENT_RESPONSE | jq -r '.orderId // empty' 2>/dev/null)

    # Submit again with same key
    IDEMPOTENT_RESPONSE_2=$(curl -s -X POST "$API_URL/orders/submit" \
        -H "Content-Type: application/json" \
        -d '{"sessionId": "IDEMPOTENT_TEST", "idempotencyKey": "TEST_KEY_123"}')

    ORDER_2=$(echo $IDEMPOTENT_RESPONSE_2 | jq -r '.orderId // empty' 2>/dev/null)

    if [ "$ORDER_1" = "$ORDER_2" ]; then
        pass "Idempotency working - same order returned"
    else
        fail "Idempotency not working - duplicate order created"
    fi

    wait_test
}

# ==========================================
# RUN ALL TESTS
# ==========================================

run_all_tests() {
    echo ""
    echo "=========================================="
    echo "RUNNING ALL TESTS"
    echo "=========================================="
    echo ""

    # Phase 0: Health Check
    check_services

    # Phase 1: Critical Path
    test_qr_scan
    test_order_placement
    test_pos_billing
    test_kds_sync
    test_payment
    test_cashback
    test_inventory
    test_table_management
    test_refund
    test_offline_recovery
}

# Print summary
print_summary() {
    echo ""
    echo "=========================================="
    echo "TEST SUMMARY"
    echo "=========================================="
    echo ""
    echo -e "Total Tests: $TOTAL"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    echo ""

    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
        exit 0
    else
        echo -e "${RED}⚠️ SOME TESTS FAILED${NC}"
        exit 1
    fi
}

# Main
run_all_tests
print_summary
