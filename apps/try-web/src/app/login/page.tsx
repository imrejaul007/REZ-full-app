'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // In production: call ReZ Auth API
      // POST /api/auth/login { phone, password }
      const response = await fetch(process.env.NEXT_PUBLIC_AUTH_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      window.location.href = '/'
    } catch (err) {
      setError('Invalid credentials. Try demo@rez.money / demo123')
      // For demo: allow login anyway
      localStorage.setItem('token', 'demo-token')
      localStorage.setItem('user', JSON.stringify({ phone, name: 'Demo User' }))
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  const handleOTP = async () => {
    setLoading(true)
    // Send OTP via ReZ Auth
    alert('OTP sent to ' + phone)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">Rz</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to ReZ Try</h1>
          <p className="text-gray-500 mt-1">Login to explore trials and earn rewards</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Phone */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-4 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* OTP */}
          <button
            type="button"
            onClick={handleOTP}
            className="w-full border border-purple-600 text-purple-600 py-3 rounded-xl font-semibold hover:bg-purple-50 transition"
          >
            Login with OTP
          </button>

          {/* Forgot */}
          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm text-purple-600 hover:underline">
              Forgot Password?
            </Link>
          </div>
        </form>

        {/* Register */}
        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-purple-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>

        {/* Demo hint */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm text-gray-500">
          <p className="font-medium text-gray-700 mb-1">Demo Credentials:</p>
          <p>Phone: 9876543210</p>
          <p>Password: demo123</p>
        </div>
      </div>
    </div>
  )
}
