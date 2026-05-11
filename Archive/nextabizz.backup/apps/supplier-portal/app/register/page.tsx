'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Company Details
    companyName: '',
    contactName: '',
    businessType: '',
    gstin: '',
    pan: '',
    // Step 2: Contact Details
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    // Step 3: Credentials
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const businessTypes = [
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'wholesaler', label: 'Wholesaler' },
    { value: 'importer', label: 'Importer' },
    { value: 'farmer', label: 'Farmer/Producer' },
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!formData.contactName.trim()) newErrors.contactName = 'Contact person name is required';
      if (!formData.businessType) newErrors.businessType = 'Business type is required';
      if (!formData.gstin) newErrors.gstin = 'GSTIN is required';
      else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
        newErrors.gstin = 'Please enter a valid GSTIN';
      }
      if (!formData.pan) newErrors.pan = 'PAN is required';
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) {
        newErrors.pan = 'Please enter a valid PAN';
      }
    }

    if (currentStep === 2) {
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.pincode) newErrors.pincode = 'Pincode is required';
      else if (!/^[1-9]\d{5}$/.test(formData.pincode)) {
        newErrors.pincode = 'Please enter a valid 6-digit pincode';
      }
    }

    if (currentStep === 3) {
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(3)) return;

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Store mock token
      localStorage.setItem('supplier_token', 'mock_token_' + Date.now());
      localStorage.setItem('supplier_email', formData.email);
      localStorage.setItem('supplier_company', formData.companyName);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">NB</span>
              </div>
              <span className="text-xl font-bold text-gray-900">NextaBizz</span>
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-2xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {['Company Details', 'Contact Info', 'Account'].map((label, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                        step > index + 1
                          ? 'bg-green-500 text-white'
                          : step === index + 1
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {step > index + 1 ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${step === index + 1 ? 'text-purple-600' : 'text-gray-500'}`}>
                      {label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className={`w-16 sm:w-24 h-1 mx-2 rounded ${step > index + 1 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            {/* Step 1: Company Details */}
            {step === 1 && (
              <form className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Company Details</h2>
                  <p className="text-sm text-gray-600">Tell us about your business</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${errors.companyName ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="FreshFarm Foods Pvt Ltd"
                    />
                    {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${errors.contactName ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Rajesh Kumar"
                    />
                    {errors.contactName && <p className="mt-1 text-sm text-red-600">{errors.contactName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${errors.businessType ? 'border-red-300' : 'border-gray-300'}`}
                    >
                      <option value="">Select business type</option>
                      {businessTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {errors.businessType && <p className="mt-1 text-sm text-red-600">{errors.businessType}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN *</label>
                    <input
                      type="text"
                      name="gstin"
                      value={formData.gstin}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none uppercase ${errors.gstin ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="27ABCDE1234F1Z5"
                      maxLength={15}
                    />
                    {errors.gstin && <p className="mt-1 text-sm text-red-600">{errors.gstin}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN *</label>
                  <input
                    type="text"
                    name="pan"
                    value={formData.pan}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none uppercase ${errors.pan ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                  {errors.pan && <p className="mt-1 text-sm text-red-600">{errors.pan}</p>}
                </div>
              </form>
            )}

            {/* Step 2: Contact Details */}
            {step === 2 && (
              <form className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Contact Information</h2>
                  <p className="text-sm text-gray-600">How can we reach you?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="rajesh@freshfarm.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 py-2.5 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">+91</span>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`flex-1 px-4 py-2.5 border rounded-r-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${errors.phone ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="9876543210"
                        maxLength={10}
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${errors.address ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="123 Industrial Area, Phase 2"
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${errors.city ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Mumbai"
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${errors.state ? 'border-red-300' : 'border-gray-300'}`}
                    >
                      <option value="">Select state</option>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${errors.pincode ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="400001"
                      maxLength={6}
                    />
                    {errors.pincode && <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>}
                  </div>
                </div>
              </form>
            )}

            {/* Step 3: Account Setup */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Create Account</h2>
                  <p className="text-sm text-gray-600">Set up your login credentials</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Min. 8 characters"
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  <div className="mt-2 flex items-center space-x-2">
                    <div className={`h-1 flex-1 rounded ${formData.password.length >= 8 ? 'bg-green-500' : formData.password.length >= 4 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-1 flex-1 rounded ${formData.password.length >= 12 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Use 8+ characters with a mix of letters, numbers & symbols</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Re-enter your password"
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label className="text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="#" className="text-purple-600 hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-purple-600 hover:underline">Privacy Policy</a>
                  </label>
                </div>
                {errors.agreeTerms && <p className="text-sm text-red-600 -mt-4">{errors.agreeTerms}</p>}

                {errors.submit && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{errors.submit}</p>
                  </div>
                )}
              </form>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-purple-600 hover:text-purple-700">
              Sign in
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} NextaBizz. All rights reserved.</p>
      </footer>
    </div>
  );
}
