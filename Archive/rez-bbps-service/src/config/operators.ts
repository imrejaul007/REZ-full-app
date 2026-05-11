/**
 * BBPS Operator Configurations
 * Contains all bill payment operators for India
 */

export interface OperatorConfig {
  id: string;
  name: string;
  category: BillCategory;
  subcategory?: string;
  shortCode: string;
  logo?: string;
  fields: OperatorField[];
  fetchBillFields: FetchBillField[];
  minAmount?: number;
  maxAmount?: number;
  isActive: boolean;
  billValidation?: boolean;
}

export interface OperatorField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FetchBillField {
  name: string;
  label: string;
  required: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  fetchOnValid?: boolean;
}

export type BillCategory =
  | 'electricity'
  | 'gas'
  | 'water'
  | 'mobile'
  | 'insurance'
  | 'loan'
  | 'dth'
  | 'broadband'
  | 'landline'
  | 'cable';

export const OPERATORS: Record<string, OperatorConfig> = {
  // ============ ELECTRICITY OPERATORS ============
  'tata-power': {
    id: 'tata-power',
    name: 'Tata Power',
    category: 'electricity',
    shortCode: 'TPL',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 10, maxLength: 15 },
      { name: 'accountId', label: 'Account ID', type: 'text', required: false, maxLength: 20 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 10, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'bses-yamuna': {
    id: 'bses-yamuna',
    name: 'BSES Yamuna Power',
    category: 'electricity',
    shortCode: 'BSESY',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 9, maxLength: 12 },
      { name: 'billUnit', label: 'Bill Unit', type: 'text', required: false, maxLength: 5 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 9, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'bses-rajdhani': {
    id: 'bses-rajdhani',
    name: 'BSES Rajdhani Power',
    category: 'electricity',
    shortCode: 'BSESR',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 9, maxLength: 12 },
      { name: 'billUnit', label: 'Bill Unit', type: 'text', required: false, maxLength: 5 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 9, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'adani-electricity': {
    id: 'adani-electricity',
    name: 'Adani Electricity Mumbai',
    category: 'electricity',
    shortCode: 'ADANI',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 10, maxLength: 14 },
      { name: 'billNumber', label: 'Bill Number', type: 'text', required: false, maxLength: 15 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 10, maxLength: 14, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'best-electricity': {
    id: 'best-electricity',
    name: 'BEST Electricity',
    category: 'electricity',
    shortCode: 'BEST',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 10, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 10, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'cessna-power': {
    id: 'cessna-power',
    name: 'Cessna Power',
    category: 'electricity',
    shortCode: 'CESC',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 9, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 9, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'mescom': {
    id: 'mescom',
    name: 'MESCOM',
    category: 'electricity',
    shortCode: 'MESCOM',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 10, maxLength: 12 },
      { name: 'district', label: 'District', type: 'select', required: true, options: [
        { value: 'DK', label: 'Dakshina Kannada' },
        { value: 'UD', label: 'Udupi' },
        { value: 'UK', label: 'Uttara Kannada' }
      ]}
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 10, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'bescom': {
    id: 'bescom',
    name: 'BESCOM',
    category: 'electricity',
    shortCode: 'BESCOM',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 10, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 10, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'cesc-limited': {
    id: 'cesc-limited',
    name: 'CESC Limited',
    category: 'electricity',
    shortCode: 'CESC',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 9, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 9, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'torrent-power': {
    id: 'torrent-power',
    name: 'Torrent Power',
    category: 'electricity',
    shortCode: 'TORRENT',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 10, maxLength: 14 },
      { name: 'state', label: 'State', type: 'select', required: true, options: [
        { value: 'GJ', label: 'Gujarat' },
        { value: 'MH', label: 'Maharashtra' },
        { value: 'DN', label: 'Dadra & Nagar Haveli' }
      ]}
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 10, maxLength: 14, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'ndpl': {
    id: 'ndpl',
    name: 'NDPL (Tata Power Delhi)',
    category: 'electricity',
    shortCode: 'NDPL',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 9, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 9, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'mp-mk-vyapar': {
    id: 'mp-mk-vyapar',
    name: 'MPMKVVCL (Madhya Pradesh)',
    category: 'electricity',
    shortCode: 'MPMKVVCL',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 10, maxLength: 13 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 10, maxLength: 13, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'uppc-lucknow': {
    id: 'uppc-lucknow',
    name: 'UPPCL Lucknow',
    category: 'electricity',
    shortCode: 'UPPCLL',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 9, maxLength: 13 },
      { name: 'division', label: 'Division', type: 'text', required: false, maxLength: 10 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 9, maxLength: 13, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'wbesc': {
    id: 'wbesc',
    name: 'WBSEDCL',
    category: 'electricity',
    shortCode: 'WBSEDCL',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 10, maxLength: 14 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 10, maxLength: 14, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },

  // ============ GAS OPERATORS ============
  'mahanagar-gas': {
    id: 'mahanagar-gas',
    name: 'Mahanagar Gas',
    category: 'gas',
    shortCode: 'MGL',
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'customerId', label: 'Customer ID', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: true
  },
  'indraprastha-gas': {
    id: 'indraprastha-gas',
    name: 'Indraprastha Gas',
    category: 'gas',
    shortCode: 'IGL',
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true, minLength: 9, maxLength: 12 },
      { name: 'city', label: 'City', type: 'select', required: true, options: [
        { value: 'DELHI', label: 'Delhi' },
        { value: 'NOIDA', label: 'Noida' },
        { value: 'GGN', label: 'Gurgaon' }
      ]}
    ],
    fetchBillFields: [
      { name: 'customerId', label: 'Customer ID', required: true, minLength: 9, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: true
  },
  'gail-gas': {
    id: 'gail-gas',
    name: 'GAIL Gas',
    category: 'gas',
    shortCode: 'GAIL',
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'customerId', label: 'Customer ID', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: true
  },
  'siti-energy': {
    id: 'siti-energy',
    name: 'Siti Energy CNG',
    category: 'gas',
    shortCode: 'SITI',
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'customerId', label: 'Customer ID', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: false
  },
  'maharashtra-natural-gas': {
    id: 'maharashtra-natural-gas',
    name: 'Maharashtra Natural Gas',
    category: 'gas',
    shortCode: 'MNGL',
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'customerId', label: 'Customer ID', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: true
  },
  'saxena-gas': {
    id: 'saxena-gas',
    name: 'Saxena Gas',
    category: 'gas',
    shortCode: 'SAX',
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true, minLength: 6, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'customerId', label: 'Customer ID', required: true, minLength: 6, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: true
  },

  // ============ WATER OPERATORS ============
  'delhi-jal-board': {
    id: 'delhi-jal-board',
    name: 'Delhi Jal Board',
    category: 'water',
    shortCode: 'DJB',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 7, maxLength: 12 },
      { name: 'zone', label: 'Zone', type: 'text', required: false, maxLength: 20 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 7, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 100000,
    isActive: true,
    billValidation: true
  },
  'maharashtra-jal-board': {
    id: 'maharashtra-jal-board',
    name: 'Maharashtra Jal Board',
    category: 'water',
    shortCode: 'MJB',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 100000,
    isActive: true,
    billValidation: true
  },
  'c Madhya-jal-board': {
    id: 'c-madhya-jal-board',
    name: 'Madhya Pradesh Jal Board',
    category: 'water',
    shortCode: 'MPJB',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 100000,
    isActive: true,
    billValidation: true
  },
  'bangalore-water': {
    id: 'bangalore-water',
    name: 'BWSSB Bangalore',
    category: 'water',
    shortCode: 'BWSSB',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 100000,
    isActive: true,
    billValidation: true
  },
  'chennai-water': {
    id: 'chennai-water',
    name: 'CMWSSB Chennai',
    category: 'water',
    shortCode: 'CMWSSB',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 100000,
    isActive: true,
    billValidation: true
  },
  'hyderabad-water': {
    id: 'hyderabad-water',
    name: 'HMWS&SB Hyderabad',
    category: 'water',
    shortCode: 'HMWS',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 100000,
    isActive: true,
    billValidation: true
  },
  'kolkata-water': {
    id: 'kolkata-water',
    name: 'Kolkata Municipal Corporation',
    category: 'water',
    shortCode: 'KMC',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 100000,
    isActive: true,
    billValidation: true
  },
  'pune-water': {
    id: 'pune-water',
    name: 'Pune Municipal Corporation Water',
    category: 'water',
    shortCode: 'PMC_WATER',
    fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'consumerNumber', label: 'Consumer Number', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 100000,
    isActive: true,
    billValidation: true
  },

  // ============ MOBILE OPERATORS ============
  'airtel': {
    id: 'airtel',
    name: 'Airtel',
    category: 'mobile',
    subcategory: 'prepaid',
    shortCode: 'AIRTEL',
    fields: [
      { name: 'mobileNumber', label: 'Mobile Number', type: 'text', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10 }
    ],
    fetchBillFields: [
      { name: 'mobileNumber', label: 'Mobile Number', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10, fetchOnValid: true }
    ],
    minAmount: 10,
    maxAmount: 5000,
    isActive: true,
    billValidation: false
  },
  'airtel-postpaid': {
    id: 'airtel-postpaid',
    name: 'Airtel Postpaid',
    category: 'mobile',
    subcategory: 'postpaid',
    shortCode: 'AIRTEL_P',
    fields: [
      { name: 'mobileNumber', label: 'Mobile Number', type: 'text', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10 },
      { name: 'billUnit', label: 'Bill Unit', type: 'text', required: false, maxLength: 10 }
    ],
    fetchBillFields: [
      { name: 'mobileNumber', label: 'Mobile Number', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: true
  },
  'jio': {
    id: 'jio',
    name: 'Jio',
    category: 'mobile',
    subcategory: 'prepaid',
    shortCode: 'JIO',
    fields: [
      { name: 'mobileNumber', label: 'Mobile Number', type: 'text', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10 }
    ],
    fetchBillFields: [
      { name: 'mobileNumber', label: 'Mobile Number', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10, fetchOnValid: true }
    ],
    minAmount: 10,
    maxAmount: 5000,
    isActive: true,
    billValidation: false
  },
  'jio-postpaid': {
    id: 'jio-postpaid',
    name: 'Jio Postpaid',
    category: 'mobile',
    subcategory: 'postpaid',
    shortCode: 'JIO_P',
    fields: [
      { name: 'mobileNumber', label: 'Mobile Number', type: 'text', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10 }
    ],
    fetchBillFields: [
      { name: 'mobileNumber', label: 'Mobile Number', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: true
  },
  'vi-prepaid': {
    id: 'vi-prepaid',
    name: 'Vi (Vodafone Idea) Prepaid',
    category: 'mobile',
    subcategory: 'prepaid',
    shortCode: 'VI',
    fields: [
      { name: 'mobileNumber', label: 'Mobile Number', type: 'text', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10 }
    ],
    fetchBillFields: [
      { name: 'mobileNumber', label: 'Mobile Number', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10, fetchOnValid: true }
    ],
    minAmount: 10,
    maxAmount: 5000,
    isActive: true,
    billValidation: false
  },
  'vi-postpaid': {
    id: 'vi-postpaid',
    name: 'Vi (Vodafone Idea) Postpaid',
    category: 'mobile',
    subcategory: 'postpaid',
    shortCode: 'VI_P',
    fields: [
      { name: 'mobileNumber', label: 'Mobile Number', type: 'text', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10 },
      { name: 'accountNumber', label: 'Account Number', type: 'text', required: false, maxLength: 15 }
    ],
    fetchBillFields: [
      { name: 'mobileNumber', label: 'Mobile Number', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: true
  },
  'bsnl-prepaid': {
    id: 'bsnl-prepaid',
    name: 'BSNL Prepaid',
    category: 'mobile',
    subcategory: 'prepaid',
    shortCode: 'BSNL',
    fields: [
      { name: 'mobileNumber', label: 'Mobile Number', type: 'text', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10 }
    ],
    fetchBillFields: [
      { name: 'mobileNumber', label: 'Mobile Number', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10, fetchOnValid: true }
    ],
    minAmount: 10,
    maxAmount: 5000,
    isActive: true,
    billValidation: false
  },
  'bsnl-postpaid': {
    id: 'bsnl-postpaid',
    name: 'BSNL Postpaid',
    category: 'mobile',
    subcategory: 'postpaid',
    shortCode: 'BSNL_P',
    fields: [
      { name: 'mobileNumber', label: 'Mobile Number', type: 'text', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10 },
      { name: 'stdCode', label: 'STD Code', type: 'number', required: false, minLength: 2, maxLength: 5 }
    ],
    fetchBillFields: [
      { name: 'mobileNumber', label: 'Mobile Number', required: true, pattern: '^[6-9]\\d{9}$', minLength: 10, maxLength: 10, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: true
  },

  // ============ INSURANCE OPERATORS ============
  'lic': {
    id: 'lic',
    name: 'Life Insurance Corporation',
    category: 'insurance',
    shortCode: 'LIC',
    fields: [
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true, minLength: 6, maxLength: 15 },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'text', required: false, placeholder: 'DD/MM/YYYY' }
    ],
    fetchBillFields: [
      { name: 'policyNumber', label: 'Policy Number', required: true, minLength: 6, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 1000000,
    isActive: true,
    billValidation: true
  },
  'hdfc-life': {
    id: 'hdfc-life',
    name: 'HDFC Life Insurance',
    category: 'insurance',
    shortCode: 'HDFC_LIFE',
    fields: [
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true, minLength: 8, maxLength: 15 }
    ],
    fetchBillFields: [
      { name: 'policyNumber', label: 'Policy Number', required: true, minLength: 8, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 1000000,
    isActive: true,
    billValidation: true
  },
  'sbi-life': {
    id: 'sbi-life',
    name: 'SBI Life Insurance',
    category: 'insurance',
    shortCode: 'SBI_LIFE',
    fields: [
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true, minLength: 8, maxLength: 15 }
    ],
    fetchBillFields: [
      { name: 'policyNumber', label: 'Policy Number', required: true, minLength: 8, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 1000000,
    isActive: true,
    billValidation: true
  },
  'icici-prudential': {
    id: 'icici-prudential',
    name: 'ICICI Prudential Life Insurance',
    category: 'insurance',
    shortCode: 'ICICI_LIFE',
    fields: [
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true, minLength: 8, maxLength: 15 }
    ],
    fetchBillFields: [
      { name: 'policyNumber', label: 'Policy Number', required: true, minLength: 8, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 1000000,
    isActive: true,
    billValidation: true
  },
  'max-life': {
    id: 'max-life',
    name: 'Max Life Insurance',
    category: 'insurance',
    shortCode: 'MAX_LIFE',
    fields: [
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true, minLength: 8, maxLength: 15 }
    ],
    fetchBillFields: [
      { name: 'policyNumber', label: 'Policy Number', required: true, minLength: 8, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 1000000,
    isActive: true,
    billValidation: true
  },
  'bajaj-allianz-life': {
    id: 'bajaj-allianz-life',
    name: 'Bajaj Allianz Life Insurance',
    category: 'insurance',
    shortCode: 'BAJAJ_LIFE',
    fields: [
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true, minLength: 8, maxLength: 15 }
    ],
    fetchBillFields: [
      { name: 'policyNumber', label: 'Policy Number', required: true, minLength: 8, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 1000000,
    isActive: true,
    billValidation: true
  },
  'star-health': {
    id: 'star-health',
    name: 'Star Health Insurance',
    category: 'insurance',
    shortCode: 'STAR_HEALTH',
    fields: [
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true, minLength: 8, maxLength: 15 },
      { name: 'memberId', label: 'Member ID', type: 'text', required: false, maxLength: 15 }
    ],
    fetchBillFields: [
      { name: 'policyNumber', label: 'Policy Number', required: true, minLength: 8, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'hdfc-ergo': {
    id: 'hdfc-ergo',
    name: 'HDFC ERGO Health Insurance',
    category: 'insurance',
    shortCode: 'HDFC_ERGO',
    fields: [
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true, minLength: 8, maxLength: 15 }
    ],
    fetchBillFields: [
      { name: 'policyNumber', label: 'Policy Number', required: true, minLength: 8, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 500000,
    isActive: true,
    billValidation: true
  },
  'icici-lombard': {
    id: 'icici-lombard',
    name: 'ICICI Lombard Car Insurance',
    category: 'insurance',
    shortCode: 'ICICI_LOMBARD',
    subcategory: 'car',
    fields: [
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true, minLength: 8, maxLength: 15 },
      { name: 'vehicleNumber', label: 'Vehicle Number', type: 'text', required: false, placeholder: 'MH12AB1234' }
    ],
    fetchBillFields: [
      { name: 'policyNumber', label: 'Policy Number', required: true, minLength: 8, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 500,
    maxAmount: 100000,
    isActive: true,
    billValidation: true
  },
  'bajaj-allianz-general': {
    id: 'bajaj-allianz-general',
    name: 'Bajaj Allianz General Insurance',
    category: 'insurance',
    shortCode: 'BAJAJ_GEN',
    fields: [
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true, minLength: 8, maxLength: 15 }
    ],
    fetchBillFields: [
      { name: 'policyNumber', label: 'Policy Number', required: true, minLength: 8, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 500,
    maxAmount: 100000,
    isActive: true,
    billValidation: true
  },

  // ============ LOAN OPERATORS ============
  'sbi-home-loan': {
    id: 'sbi-home-loan',
    name: 'SBI Home Loan',
    category: 'loan',
    subcategory: 'home',
    shortCode: 'SBI_HOME',
    fields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', type: 'text', required: true, minLength: 10, maxLength: 20 },
      { name: 'borrowerName', label: 'Borrower Name', type: 'text', required: false, maxLength: 50 }
    ],
    fetchBillFields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', required: true, minLength: 10, maxLength: 20, fetchOnValid: true }
    ],
    minAmount: 1000,
    maxAmount: 10000000,
    isActive: true,
    billValidation: true
  },
  'hdfc-home-loan': {
    id: 'hdfc-home-loan',
    name: 'HDFC Home Loan',
    category: 'loan',
    subcategory: 'home',
    shortCode: 'HDFC_HOME',
    fields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', type: 'text', required: true, minLength: 10, maxLength: 20 }
    ],
    fetchBillFields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', required: true, minLength: 10, maxLength: 20, fetchOnValid: true }
    ],
    minAmount: 1000,
    maxAmount: 10000000,
    isActive: true,
    billValidation: true
  },
  'icici-home-loan': {
    id: 'icici-home-loan',
    name: 'ICICI Home Loan',
    category: 'loan',
    subcategory: 'home',
    shortCode: 'ICICI_HOME',
    fields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', type: 'text', required: true, minLength: 10, maxLength: 20 }
    ],
    fetchBillFields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', required: true, minLength: 10, maxLength: 20, fetchOnValid: true }
    ],
    minAmount: 1000,
    maxAmount: 10000000,
    isActive: true,
    billValidation: true
  },
  'axis-home-loan': {
    id: 'axis-home-loan',
    name: 'Axis Bank Home Loan',
    category: 'loan',
    subcategory: 'home',
    shortCode: 'AXIS_HOME',
    fields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', type: 'text', required: true, minLength: 10, maxLength: 20 }
    ],
    fetchBillFields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', required: true, minLength: 10, maxLength: 20, fetchOnValid: true }
    ],
    minAmount: 1000,
    maxAmount: 10000000,
    isActive: true,
    billValidation: true
  },
  'sbi-personal-loan': {
    id: 'sbi-personal-loan',
    name: 'SBI Personal Loan',
    category: 'loan',
    subcategory: 'personal',
    shortCode: 'SBI_PERSONAL',
    fields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', type: 'text', required: true, minLength: 10, maxLength: 20 }
    ],
    fetchBillFields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', required: true, minLength: 10, maxLength: 20, fetchOnValid: true }
    ],
    minAmount: 1000,
    maxAmount: 2000000,
    isActive: true,
    billValidation: true
  },
  'hdfc-personal-loan': {
    id: 'hdfc-personal-loan',
    name: 'HDFC Personal Loan',
    category: 'loan',
    subcategory: 'personal',
    shortCode: 'HDFC_PERSONAL',
    fields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', type: 'text', required: true, minLength: 10, maxLength: 20 }
    ],
    fetchBillFields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', required: true, minLength: 10, maxLength: 20, fetchOnValid: true }
    ],
    minAmount: 1000,
    maxAmount: 2000000,
    isActive: true,
    billValidation: true
  },
  'icici-personal-loan': {
    id: 'icici-personal-loan',
    name: 'ICICI Personal Loan',
    category: 'loan',
    subcategory: 'personal',
    shortCode: 'ICICI_PERSONAL',
    fields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', type: 'text', required: true, minLength: 10, maxLength: 20 }
    ],
    fetchBillFields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', required: true, minLength: 10, maxLength: 20, fetchOnValid: true }
    ],
    minAmount: 1000,
    maxAmount: 2000000,
    isActive: true,
    billValidation: true
  },
  'bajaj-finserv-personal': {
    id: 'bajaj-finserv-personal',
    name: 'Bajaj Finserv Personal Loan',
    category: 'loan',
    subcategory: 'personal',
    shortCode: 'BAJAJ_PERSONAL',
    fields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', type: 'text', required: true, minLength: 10, maxLength: 20 }
    ],
    fetchBillFields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', required: true, minLength: 10, maxLength: 20, fetchOnValid: true }
    ],
    minAmount: 1000,
    maxAmount: 2000000,
    isActive: true,
    billValidation: true
  },
  'sbi-education-loan': {
    id: 'sbi-education-loan',
    name: 'SBI Education Loan',
    category: 'loan',
    subcategory: 'education',
    shortCode: 'SBI_EDU',
    fields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', type: 'text', required: true, minLength: 10, maxLength: 20 }
    ],
    fetchBillFields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', required: true, minLength: 10, maxLength: 20, fetchOnValid: true }
    ],
    minAmount: 1000,
    maxAmount: 5000000,
    isActive: true,
    billValidation: true
  },
  'canara-bank-loan': {
    id: 'canara-bank-loan',
    name: 'Canara Bank Loan',
    category: 'loan',
    shortCode: 'CANARA',
    fields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', type: 'text', required: true, minLength: 10, maxLength: 20 },
      { name: 'loanType', label: 'Loan Type', type: 'select', required: false, options: [
        { value: 'HOME', label: 'Home Loan' },
        { value: 'PERSONAL', label: 'Personal Loan' },
        { value: 'EDU', label: 'Education Loan' },
        { value: 'VEHICLE', label: 'Vehicle Loan' }
      ]}
    ],
    fetchBillFields: [
      { name: 'loanAccountNumber', label: 'Loan Account Number', required: true, minLength: 10, maxLength: 20, fetchOnValid: true }
    ],
    minAmount: 1000,
    maxAmount: 10000000,
    isActive: true,
    billValidation: true
  },

  // ============ DTH OPERATORS ============
  'tata-sky': {
    id: 'tata-sky',
    name: 'Tata Sky',
    category: 'dth',
    shortCode: 'TATASKY',
    fields: [
      { name: 'subscriberId', label: 'Subscriber ID', type: 'text', required: true, minLength: 10, maxLength: 15 }
    ],
    fetchBillFields: [
      { name: 'subscriberId', label: 'Subscriber ID', required: true, minLength: 10, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: false
  },
  'airtel-digital': {
    id: 'airtel-digital',
    name: 'Airtel Digital TV',
    category: 'dth',
    shortCode: 'AIRTEL_DTV',
    fields: [
      { name: 'subscriberId', label: 'Subscriber ID', type: 'text', required: true, minLength: 10, maxLength: 15 }
    ],
    fetchBillFields: [
      { name: 'subscriberId', label: 'Subscriber ID', required: true, minLength: 10, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: false
  },
  'dish-tv': {
    id: 'dish-tv',
    name: 'Dish TV',
    category: 'dth',
    shortCode: 'DISHTV',
    fields: [
      { name: 'subscriberId', label: 'Subscriber ID', type: 'text', required: true, minLength: 10, maxLength: 15 }
    ],
    fetchBillFields: [
      { name: 'subscriberId', label: 'Subscriber ID', required: true, minLength: 10, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: false
  },
  'sun-direct': {
    id: 'sun-direct',
    name: 'Sun Direct',
    category: 'dth',
    shortCode: 'SUN',
    fields: [
      { name: 'smartCardNumber', label: 'Smart Card Number', type: 'text', required: true, minLength: 11, maxLength: 14 }
    ],
    fetchBillFields: [
      { name: 'smartCardNumber', label: 'Smart Card Number', required: true, minLength: 11, maxLength: 14, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: false
  },
  'videocon-d2h': {
    id: 'videocon-d2h',
    name: 'Videocon D2H',
    category: 'dth',
    shortCode: 'VCD2H',
    fields: [
      { name: 'subscriberId', label: 'Subscriber ID', type: 'text', required: true, minLength: 10, maxLength: 15 }
    ],
    fetchBillFields: [
      { name: 'subscriberId', label: 'Subscriber ID', required: true, minLength: 10, maxLength: 15, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 50000,
    isActive: true,
    billValidation: false
  },

  // ============ BROADBAND OPERATORS ============
  'act-broadband': {
    id: 'act-broadband',
    name: 'ACT Broadband',
    category: 'broadband',
    shortCode: 'ACT',
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'customerId', label: 'Customer ID', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 300,
    maxAmount: 10000,
    isActive: true,
    billValidation: true
  },
  'airtel-broadband': {
    id: 'airtel-broadband',
    name: 'Airtel Broadband',
    category: 'broadband',
    shortCode: 'AIRTEL_BB',
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'customerId', label: 'Customer ID', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 300,
    maxAmount: 10000,
    isActive: true,
    billValidation: true
  },
  'bsnl-broadband': {
    id: 'bsnl-broadband',
    name: 'BSNL Broadband',
    category: 'broadband',
    shortCode: 'BSNL_BB',
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true, minLength: 8, maxLength: 12 },
      { name: 'stdCode', label: 'STD Code', type: 'number', required: false, minLength: 2, maxLength: 5 }
    ],
    fetchBillFields: [
      { name: 'customerId', label: 'Customer ID', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 300,
    maxAmount: 10000,
    isActive: true,
    billValidation: true
  },
  'hathway': {
    id: 'hathway',
    name: 'Hathway Broadband',
    category: 'broadband',
    shortCode: 'HATHWAY',
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'customerId', label: 'Customer ID', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 300,
    maxAmount: 10000,
    isActive: true,
    billValidation: true
  },
  'gtpl-broadband': {
    id: 'gtpl-broadband',
    name: 'GTPL Broadband',
    category: 'broadband',
    shortCode: 'GTPL',
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'customerId', label: 'Customer ID', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 300,
    maxAmount: 10000,
    isActive: true,
    billValidation: true
  },

  // ============ LANDLINE OPERATORS ============
  'airtel-landline': {
    id: 'airtel-landline',
    name: 'Airtel Landline',
    category: 'landline',
    shortCode: 'AIRTEL_LF',
    fields: [
      { name: 'phoneNumber', label: 'Phone Number', type: 'text', required: true, minLength: 10, maxLength: 12 },
      { name: 'stdCode', label: 'STD Code', type: 'number', required: true, minLength: 2, maxLength: 5 }
    ],
    fetchBillFields: [
      { name: 'phoneNumber', label: 'Phone Number', required: true, minLength: 10, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 200,
    maxAmount: 10000,
    isActive: true,
    billValidation: true
  },
  'bsnl-landline': {
    id: 'bsnl-landline',
    name: 'BSNL Landline',
    category: 'landline',
    shortCode: 'BSNL_LF',
    fields: [
      { name: 'phoneNumber', label: 'Phone Number', type: 'text', required: true, minLength: 10, maxLength: 12 },
      { name: 'stdCode', label: 'STD Code', type: 'number', required: true, minLength: 2, maxLength: 5 }
    ],
    fetchBillFields: [
      { name: 'phoneNumber', label: 'Phone Number', required: true, minLength: 10, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 200,
    maxAmount: 10000,
    isActive: true,
    billValidation: true
  },
  'reliance-landline': {
    id: 'reliance-landline',
    name: 'Reliance Landline',
    category: 'landline',
    shortCode: 'RIL_LF',
    fields: [
      { name: 'phoneNumber', label: 'Phone Number', type: 'text', required: true, minLength: 10, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'phoneNumber', label: 'Phone Number', required: true, minLength: 10, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 200,
    maxAmount: 10000,
    isActive: true,
    billValidation: true
  },

  // ============ CABLE OPERATORS ============
  'den-networks': {
    id: 'den-networks',
    name: 'DEN Networks',
    category: 'cable',
    shortCode: 'DEN',
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'customerId', label: 'Customer ID', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 5000,
    isActive: true,
    billValidation: true
  },
  'hathway-cable': {
    id: 'hathway-cable',
    name: 'Hathway Cable',
    category: 'cable',
    shortCode: 'HATHWAY_C',
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true, minLength: 8, maxLength: 12 }
    ],
    fetchBillFields: [
      { name: 'customerId', label: 'Customer ID', required: true, minLength: 8, maxLength: 12, fetchOnValid: true }
    ],
    minAmount: 100,
    maxAmount: 5000,
    isActive: true,
    billValidation: true
  }
};

/**
 * Get operators by category
 */
export function getOperatorsByCategory(category: BillCategory): OperatorConfig[] {
  return Object.values(OPERATORS).filter(
    (op) => op.category === category && op.isActive
  );
}

/**
 * Get operator by ID
 */
export function getOperatorById(id: string): OperatorConfig | undefined {
  return OPERATORS[id];
}

/**
 * Get all active operators
 */
export function getAllOperators(): OperatorConfig[] {
  return Object.values(OPERATORS).filter((op) => op.isActive);
}

/**
 * Get operator categories with counts
 */
export function getCategoriesWithCounts(): Record<BillCategory, number> {
  const counts: Record<BillCategory, number> = {
    electricity: 0,
    gas: 0,
    water: 0,
    mobile: 0,
    insurance: 0,
    loan: 0,
    dth: 0,
    broadband: 0,
    landline: 0,
    cable: 0
  };

  Object.values(OPERATORS).forEach((op) => {
    if (op.isActive) {
      counts[op.category]++;
    }
  });

  return counts;
}

/**
 * Validate operator fields
 */
export function validateOperatorFields(
  operatorId: string,
  fields: Record<string, string>
): { valid: boolean; errors: string[] } {
  const operator = OPERATORS[operatorId];
  if (!operator) {
    return { valid: false, errors: ['Operator not found'] };
  }

  const errors: string[] = [];

  for (const field of operator.fields) {
    const value = fields[field.name];

    if (field.required && !value) {
      errors.push(`${field.label} is required`);
      continue;
    }

    if (value) {
      if (field.minLength && value.length < field.minLength) {
        errors.push(`${field.label} must be at least ${field.minLength} characters`);
      }

      if (field.maxLength && value.length > field.maxLength) {
        errors.push(`${field.label} must be at most ${field.maxLength} characters`);
      }

      if (field.pattern && !new RegExp(field.pattern).test(value)) {
        errors.push(`${field.label} format is invalid`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: BillCategory): string {
  const displayNames: Record<BillCategory, string> = {
    electricity: 'Electricity',
    gas: 'Gas',
    water: 'Water',
    mobile: 'Mobile',
    insurance: 'Insurance',
    loan: 'Loan',
    dth: 'DTH',
    broadband: 'Broadband',
    landline: 'Landline',
    cable: 'Cable TV'
  };
  return displayNames[category];
}

export const CATEGORIES: BillCategory[] = [
  'electricity',
  'gas',
  'water',
  'mobile',
  'insurance',
  'loan',
  'dth',
  'broadband',
  'landline',
  'cable'
];
