'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCardIcon, BuildingOfficeIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline'

interface FormData {
  organizationName: string
  organizationSlug: string
  adminEmail: string
  adminFirstName: string
  adminLastName: string
  adminPassword: string
  cardNumber: string
  cardExpiry: string
  cardCVC: string
  cardName: string
  billingAddress: string
  billingCity: string
  billingState: string
  billingZip: string
  billingCountry: string
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'professional'

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    organizationName: '',
    organizationSlug: '',
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    adminPassword: '',
    cardNumber: '4242 4242 4242 4242',
    cardExpiry: '12/25',
    cardCVC: '123',
    cardName: 'Demo User',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: 'United States',
  })

  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  useEffect(() => {
    // Auto-generate slug from organization name only if slug hasn't been manually edited
    if (formData.organizationName && !slugManuallyEdited) {
      const slug = formData.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, organizationSlug: slug }))
    }
  }, [formData.organizationName, slugManuallyEdited])

  const validateStep1 = (): boolean => {
    const newErrors: Partial<FormData> = {}
    if (!formData.organizationName.trim()) newErrors.organizationName = 'Required'
    if (!formData.organizationSlug.trim()) newErrors.organizationSlug = 'Required'
    if (!formData.adminEmail.trim()) newErrors.adminEmail = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) newErrors.adminEmail = 'Invalid email'
    if (!formData.adminFirstName.trim()) newErrors.adminFirstName = 'Required'
    if (!formData.adminLastName.trim()) newErrors.adminLastName = 'Required'
    if (!formData.adminPassword.trim()) newErrors.adminPassword = 'Required'
    else if (formData.adminPassword.length < 8) newErrors.adminPassword = 'Must be at least 8 characters'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Partial<FormData> = {}
    if (!formData.billingAddress.trim()) newErrors.billingAddress = 'Required'
    if (!formData.billingCity.trim()) newErrors.billingCity = 'Required'
    if (!formData.billingState.trim()) newErrors.billingState = 'Required'
    if (!formData.billingZip.trim()) newErrors.billingZip = 'Required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const planDetailsMap = {
    starter: { name: 'Starter', price: 2999 },
    professional: { name: 'Professional', price: 7999 },
    enterprise: { name: 'Enterprise', price: 19999 },
  } as const

  const planDetails = planDetailsMap[plan as keyof typeof planDetailsMap] || planDetailsMap.professional

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '3rem',
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Complete Your Purchase
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              {planDetails.name} Plan - ${planDetails.price.toLocaleString()} one-time
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '3rem',
        }}>
          {/* Main Form */}
          <div>
            {/* Progress Steps */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '3rem',
              position: 'relative',
            }}>
              {[1, 2, 3].map((s) => (
                <div key={s} style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: s <= step ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                      color: '#ffffff',
                      marginBottom: '0.5rem',
                      transition: 'all 0.3s',
                      boxShadow: s <= step ? '0 4px 14px rgba(59, 130, 246, 0.4)' : 'none',
                    }}>
                      {s}
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      color: s <= step ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                    }}>
                      {s === 1 ? 'Organization' : s === 2 ? 'Billing' : 'Review'}
                    </span>
                  </div>
                  {s < 3 && (
                    <div style={{
                      position: 'absolute',
                      top: '24px',
                      left: 'calc(50% + 24px)',
                      right: 'calc(-50% + 24px)',
                      height: '2px',
                      backgroundColor: s < step ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                      zIndex: 0,
                    }} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Organization Setup */}
            {step === 1 && (
              <div style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '1rem',
                padding: '2.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}>
                  <BuildingOfficeIcon style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                    Organization Setup
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                    }}>
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#0a0a0a',
                        border: errors.organizationName ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        fontSize: '1rem',
                        transition: 'all 0.2s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = errors.organizationName ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'}
                    />
                    {errors.organizationName && (
                      <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                        {errors.organizationName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                    }}>
                      Organization Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.organizationSlug}
                      onChange={(e) => {
                        setSlugManuallyEdited(true)
                        setFormData(prev => ({ ...prev, organizationSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#0a0a0a',
                        border: errors.organizationSlug ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        fontSize: '1rem',
                      }}
                    />
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      Used in your organization URL
                    </span>
                  </div>

                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1.5rem',
                      paddingTop: '1.5rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                      <UserIcon style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                        Admin Account
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '500',
                      }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.adminFirstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminFirstName: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          backgroundColor: '#0a0a0a',
                          border: errors.adminFirstName ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.5rem',
                          color: '#ffffff',
                          fontSize: '1rem',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '500',
                      }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.adminLastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminLastName: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          backgroundColor: '#0a0a0a',
                          border: errors.adminLastName ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.5rem',
                          color: '#ffffff',
                          fontSize: '1rem',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                    }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#0a0a0a',
                        border: errors.adminEmail ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        fontSize: '1rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                    }}>
                      Password *
                    </label>
                    <input
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#0a0a0a',
                        border: errors.adminPassword ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        fontSize: '1rem',
                      }}
                    />
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      Minimum 8 characters
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment Information */}
            {step === 2 && (
              <div style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '1rem',
                padding: '2.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}>
                  <CreditCardIcon style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                    Payment Information
                  </h2>
                </div>

                <div style={{
                  backgroundColor: '#0a0a0a',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  marginBottom: '2rem',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.875rem',
                    margin: 0,
                  }}>
                    💳 Demo card information is pre-filled for testing purposes. This is a mock checkout process.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                    }}>
                      Card Number *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <CreditCardIcon style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '20px',
                        height: '20px',
                        color: 'rgba(255, 255, 255, 0.5)',
                      }} />
                      <input
                        type="text"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                        maxLength={19}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem 0.75rem 3rem',
                          backgroundColor: '#0a0a0a',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.5rem',
                          color: '#ffffff',
                          fontSize: '1rem',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '500',
                      }}>
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        value={formData.cardExpiry}
                        onChange={(e) => setFormData(prev => ({ ...prev, cardExpiry: formatExpiry(e.target.value) }))}
                        placeholder="MM/YY"
                        maxLength={5}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          backgroundColor: '#0a0a0a',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.5rem',
                          color: '#ffffff',
                          fontSize: '1rem',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '500',
                      }}>
                        CVC *
                      </label>
                      <input
                        type="text"
                        value={formData.cardCVC}
                        onChange={(e) => setFormData(prev => ({ ...prev, cardCVC: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        maxLength={4}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          backgroundColor: '#0a0a0a',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.5rem',
                          color: '#ffffff',
                          fontSize: '1rem',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                    }}>
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      value={formData.cardName}
                      onChange={(e) => setFormData(prev => ({ ...prev, cardName: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        fontSize: '1rem',
                      }}
                    />
                  </div>

                  <div style={{
                    marginTop: '1rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                      Billing Address
                    </h3>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                    }}>
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={formData.billingAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, billingAddress: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#0a0a0a',
                        border: errors.billingAddress ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        fontSize: '1rem',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '500',
                      }}>
                        City *
                      </label>
                      <input
                        type="text"
                        value={formData.billingCity}
                        onChange={(e) => setFormData(prev => ({ ...prev, billingCity: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          backgroundColor: '#0a0a0a',
                          border: errors.billingCity ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.5rem',
                          color: '#ffffff',
                          fontSize: '1rem',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '500',
                      }}>
                        State *
                      </label>
                      <input
                        type="text"
                        value={formData.billingState}
                        onChange={(e) => setFormData(prev => ({ ...prev, billingState: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          backgroundColor: '#0a0a0a',
                          border: errors.billingState ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.5rem',
                          color: '#ffffff',
                          fontSize: '1rem',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '500',
                      }}>
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        value={formData.billingZip}
                        onChange={(e) => setFormData(prev => ({ ...prev, billingZip: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          backgroundColor: '#0a0a0a',
                          border: errors.billingZip ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.5rem',
                          color: '#ffffff',
                          fontSize: '1rem',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: '500',
                      }}>
                        Country *
                      </label>
                      <select
                        value={formData.billingCountry}
                        onChange={(e) => setFormData(prev => ({ ...prev, billingCountry: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          backgroundColor: '#0a0a0a',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.5rem',
                          color: '#ffffff',
                          fontSize: '1rem',
                        }}
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '1rem',
                padding: '2.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}>
                  <LockClosedIcon style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                    Review & Complete
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                      Organization Details
                    </h3>
                    <div style={{
                      backgroundColor: '#0a0a0a',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>Name:</span>
                          <div style={{ color: '#ffffff', fontWeight: '500' }}>{formData.organizationName}</div>
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>Slug:</span>
                          <div style={{ color: '#ffffff', fontWeight: '500' }}>{formData.organizationSlug}</div>
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>Admin:</span>
                          <div style={{ color: '#ffffff', fontWeight: '500' }}>
                            {formData.adminFirstName} {formData.adminLastName} ({formData.adminEmail})
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                      Payment Method
                    </h3>
                    <div style={{
                      backgroundColor: '#0a0a0a',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>Card:</span>
                          <div style={{ color: '#ffffff', fontWeight: '500' }}>
                            •••• •••• •••• {formData.cardNumber.slice(-4)}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>Expires:</span>
                          <div style={{ color: '#ffffff', fontWeight: '500' }}>{formData.cardExpiry}</div>
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>Billing:</span>
                          <div style={{ color: '#ffffff', fontWeight: '500' }}>
                            {formData.billingAddress}, {formData.billingCity}, {formData.billingState} {formData.billingZip}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '2rem',
            }}>
              <button
                onClick={handleBack}
                disabled={step === 1}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: '#ffffff',
                  cursor: step === 1 ? 'not-allowed' : 'pointer',
                  opacity: step === 1 ? 0.5 : 1,
                  fontSize: '1rem',
                  fontWeight: '500',
                }}
              >
                Back
              </button>
              {step < 3 && (
                <button
                  onClick={handleNext}
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: '#3b82f6',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  Continue
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '1rem',
              padding: '2rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'sticky',
              top: '2rem',
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                marginBottom: '1.5rem',
              }}>
                Order Summary
              </h3>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Plan</span>
                <span style={{ fontWeight: '600' }}>{planDetails.name}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Price</span>
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  ${planDetails.price.toLocaleString()}
                </span>
              </div>

              <div style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}>
                  <LockClosedIcon style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                  <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Secure Checkout</span>
                </div>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.875rem',
                  margin: 0,
                  lineHeight: '1.5',
                }}>
                  Your payment information is encrypted and secure.
                </p>
              </div>

              {step === 3 && (
                <button
                  disabled
                  style={{
                    width: '100%',
                    padding: '1rem 2rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    cursor: 'not-allowed',
                    fontSize: '1rem',
                    fontWeight: '600',
                    position: 'relative',
                  }}
                >
                  <span style={{ opacity: 0.5 }}>Complete Purchase</span>
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                  }}>
                    Coming Soon
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(59, 130, 246, 0.2)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

