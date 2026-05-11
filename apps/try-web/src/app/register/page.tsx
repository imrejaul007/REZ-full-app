'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')

  const handleSendOTP = async () => {
    if (!form.phone || form.phone.length < 10) {
      alert('Please enter valid phone number')
      return
    }
    setLoading(true)
    // Send OTP via ReZ Auth
    await new Promise(r => setTimeout(r, 1000)) // Demo delay
    setOtpSent(true)
    setLoading(false)
  }

  const handleVerify = async () => {
    if (otp.length !== 6) {
      alert('Please enter 6-digit OTP')
      return
    }
    setLoading(true)
    // Verify OTP and create account
    await new Promise(r => setTimeout(r, 1000))
    router.push('/login?registered=true')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">Rz</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-1">Join ReZ Try and start exploring</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {!otpSent ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    placeholder="Rahul Sharma"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">+91</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                      placeholder="9876543210"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    placeholder="rahul@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full mt-6 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-gray-600">OTP sent to +91 {form.phone}</p>
                <button onClick={() => setOtpSent(false)} className="text-purple-600 text-sm hover:underline">
                  Change number
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  maxLength={6}
                />
              </div>
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full mt-6 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              <button onClick={handleSendOTP} className="w-full mt-3 text-gray-500 text-sm hover:text-purple-600">
                Resend OTP
              </button>
            </>
          )}
        </div>

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-600 font-medium hover:underline">
            Login
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          By signing up, you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  )
}
