import Razorpay from 'razorpay'
import crypto from 'crypto'
import logger from '@/lib/logger'

const keyId = process.env.RAZORPAY_KEY_ID ?? ''
const keySecret = process.env.RAZORPAY_KEY_SECRET ?? ''

let instance: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (!instance) {
    if (!keyId || !keySecret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set')
    }
    instance = new Razorpay({ key_id: keyId, key_secret: keySecret })
  }
  return instance
}

/**
 * Fetch payment details from Razorpay API to verify amount.
 * AB-C5 FIX: This prevents "pay ₹1 for ₹50,000 booking" attacks
 * by fetching the actual payment amount from Razorpay.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<{
  amount: number
  currency: string
  status: string
  order_id: string
} | null> {
  try {
    const rz = getRazorpay()
    const payment = await rz.payments.fetch(paymentId)
    return {
      amount: Number(payment.amount),
      currency: String(payment.currency),
      status: String(payment.status),
      order_id: String(payment.order_id),
    }
  } catch (error) {
    logger.error('[razorpay] Failed to fetch payment:', error)
    return null
  }
}

/**
 * Verify Razorpay payment signature.
 * https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration/#verify-payment-signature
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const body = `${orderId}|${paymentId}`
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex')
  if (signature.length !== expected.length) {
    logger.warn('[razorpay] signature length mismatch — possible tampering')
    return false
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
  } catch (e) {
    logger.error('[razorpay] timingSafeEqual error:', e)
    return false
  }
}

export const RAZORPAY_KEY_ID = keyId
