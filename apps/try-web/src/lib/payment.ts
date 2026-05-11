// Razorpay Integration
declare global {
  interface Window {
    Razorpay: any
  }
}

const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_key'

interface PaymentOptions {
  amount: number
  currency?: string
  orderId?: string
  description: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  onSuccess?: (response: any) => void
  onFailure?: (error: any) => void
}

class PaymentService {
  private loaded = false

  async loadScript(): Promise<void> {
    if (this.loaded || typeof window === 'undefined') return

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        this.loaded = true
        resolve()
      }
      script.onerror = reject
      document.body.appendChild(script)
    })
  }

  async createOrder(amount: number, notes?: Record<string, string>) {
    // Call backend to create order
    const res = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, notes }),
    })
    return res.json()
  }

  async openPayment(options: PaymentOptions): Promise<void> {
    await this.loadScript()

    const {
      amount,
      currency = 'INR',
      orderId,
      description,
      prefill = {},
      onSuccess,
      onFailure,
    } = options

    const orderIdToUse = orderId || (await this.createOrder(amount)).razorpayOrderId

    return new Promise<void>((resolve, reject) => {
      const razorpay = new window.Razorpay({
        key: RAZORPAY_KEY,
        amount: amount * 100, // Convert to paise
        currency,
        order_id: orderIdToUse,
        name: 'ReZ Try',
        description,
        prefill: {
          name: prefill.name || '',
          email: prefill.email || '',
          contact: prefill.contact || '',
        },
        handler: (response: any) => {
          onSuccess?.(response)
          resolve()
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled'))
          },
        },
        notify: {
          email: prefill.email,
        },
        notes: {
          platform: 'rez-try-web',
        },
      })

      razorpay.on('payment.failed', (response: any) => {
        onFailure?.(response.error)
        reject(response.error)
      })

      razorpay.open()
    })
  }
}

export const payment = new PaymentService()
export default payment
