// ReZ Wallet Integration
const WALLET_API = process.env.NEXT_PUBLIC_WALLET_URL || 'https://wallet.rezapp.com/api'

interface WalletBalance {
  coins: number;
  currency: 'INR';
  lastUpdated: string;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: string;
}

class ReZWallet {
  private getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async getBalance(): Promise<WalletBalance> {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      return {
        coins: 340,
        currency: 'INR',
        lastUpdated: new Date().toISOString(),
      }
    }

    const res = await fetch(`${WALLET_API}/balance`, {
      headers: this.getHeaders(),
    })
    return res.json()
  }

  async getTransactions(): Promise<Transaction[]> {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      return [
        { id: '1', type: 'credit', amount: 50, description: 'Completed: Full Spa Massage', timestamp: '2024-01-15' },
        { id: '2', type: 'debit', amount: -80, description: 'Booked: Full Spa Massage', timestamp: '2024-01-15' },
      ]
    }

    const res = await fetch(`${WALLET_API}/transactions`, {
      headers: this.getHeaders(),
    })
    return res.json()
  }

  async creditCoins(amount: number, description: string): Promise<{ success: boolean }> {
    const res = await fetch(`${WALLET_API}/credit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ amount, description }),
    })
    return res.json()
  }

  async debitCoins(amount: number, description: string): Promise<{ success: boolean }> {
    const res = await fetch(`${WALLET_API}/debit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ amount, description }),
    })
    return res.json()
  }
}

export const wallet = new ReZWallet()
export default wallet
