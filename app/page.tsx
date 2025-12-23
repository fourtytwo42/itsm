'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LandingPage() {
  const router = useRouter()

  const handleDemoClick = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault()
    e?.stopPropagation()
    try {
      router.push('/login')
    } catch (error) {
      console.error('Navigation error:', error)
      window.location.href = '/login'
    }
  }

  const handleContactClick = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault()
    e?.stopPropagation()
    try {
      window.open('https://studio42.dev/contact?source=itsm', '_blank')
    } catch (error) {
      console.error('Contact link error:', error)
    }
  }

  const handleGetStarted = (plan: string) => {
    try {
      router.push(`/checkout?plan=${plan}`)
    } catch (error) {
      console.error('Navigation error:', error)
      window.location.href = `/checkout?plan=${plan}`
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#ffffff' }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(10, 10, 10, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1rem 2rem',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
            ITSM Helpdesk
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={(e) => handleDemoClick(e)}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.5rem',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
                e.currentTarget.style.color = '#3b82f6'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                e.currentTarget.style.color = '#ffffff'
              }}
            >
              View Demo
            </button>
            <button
              type="button"
              onClick={(e) => handleContactClick(e)}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6'
              }}
            >
              Contact Us
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        paddingTop: '8rem',
        paddingBottom: '4rem',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Modern IT Service Management
            <br />
            Made Simple
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '700px',
            margin: '0 auto 2.5rem',
            lineHeight: '1.6',
          }}>
            Streamline your IT operations with AI-powered ticketing, knowledge base, 
            asset management, and real-time analytics. Built for modern teams.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={(e) => handleDemoClick(e)}
              style={{
                padding: '1rem 2.5rem',
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
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)'
              }}
            >
              Try Demo
            </button>
            <button
              type="button"
              onClick={(e) => handleContactClick(e)}
              style={{
                padding: '1rem 2.5rem',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.5rem',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
                e.currentTarget.style.color = '#3b82f6'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                e.currentTarget.style.color = '#ffffff'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '6rem 2rem',
        backgroundColor: '#0f0f0f',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '3rem',
            color: '#ffffff',
          }}>
            Everything You Need
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}>
            {[
              {
                title: 'AI-Powered Ticketing',
                description: 'Intelligent ticket routing and AI chat widget for instant support',
                image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
              },
              {
                title: 'Knowledge Base',
                description: 'Semantic search with vector embeddings for instant answers',
                image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop',
              },
              {
                title: 'Asset Management',
                description: 'Complete CMDB with relationships and auto-discovery',
                image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
              },
              {
                title: 'Change Management',
                description: 'Multi-stage approval workflows with risk assessment',
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
              },
              {
                title: 'SLA Tracking',
                description: 'Automated SLA monitoring and escalation rules',
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
              },
              {
                title: 'Analytics & Reports',
                description: 'Real-time dashboards with custom reports and exports',
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
              },
            ].map((feature, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = '#3b82f6'
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.2)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: '100%',
                  height: '200px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <img
                    src={feature.image}
                    alt={feature.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: '#ffffff',
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineHeight: '1.6',
                  }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{
        padding: '6rem 2rem',
        backgroundColor: '#0f0f0f',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 'bold',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: 'rgba(255, 255, 255, 0.7)',
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              One-time purchase. Self-hosted. Full control. No monthly fees.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginTop: '3rem',
          }}>
            {[
              {
                name: 'Starter',
                price: '$2,999',
                description: 'Perfect for small teams',
                features: [
                  'Up to 25 users',
                  'Unlimited tickets',
                  'AI-powered ticketing',
                  'Knowledge base',
                  'Asset management',
                  'Basic analytics',
                  'Email support',
                  'Self-hosted deployment',
                ],
                popular: false,
              },
              {
                name: 'Professional',
                price: '$7,999',
                description: 'For growing organizations',
                features: [
                  'Up to 100 users',
                  'Everything in Starter',
                  'Advanced analytics',
                  'Custom roles & escalation',
                  'Multi-tenant support',
                  'Priority email support',
                  'Advanced reporting',
                  'API access',
                ],
                popular: true,
              },
              {
                name: 'Enterprise',
                price: '$19,999',
                description: 'For large organizations',
                features: [
                  'Unlimited users',
                  'Everything in Professional',
                  'Dedicated support',
                  'Custom integrations',
                  'On-premise deployment',
                  'SLA guarantees',
                  'Training & onboarding',
                  'Custom development',
                ],
                popular: false,
              },
            ].map((plan, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: plan.popular ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)' : '#1a1a1a',
                  background: plan.popular 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)'
                    : '#1a1a1a',
                  border: plan.popular 
                    ? '2px solid rgba(59, 130, 246, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '1.5rem',
                  padding: '2.5rem',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = plan.popular ? 'scale(1.08)' : 'scale(1.03)'
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(59, 130, 246, 0.3)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = plan.popular ? 'scale(1.05)' : 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '2rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                  }}>
                    Most Popular
                  </div>
                )}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: '#ffffff',
                  }}>
                    {plan.name}
                  </h3>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                  }}>
                    {plan.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                  }}>
                    <span style={{
                      fontSize: '3rem',
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      {plan.price}
                    </span>
                    <span style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '1rem',
                    }}>
                      one-time
                    </span>
                  </div>
                </div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 2rem 0',
                }}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} style={{
                      padding: '0.75rem 0',
                      borderBottom: idx < plan.features.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        style={{ flexShrink: 0 }}
                      >
                        <circle cx="10" cy="10" r="10" fill="#10b981" opacity="0.2" />
                        <path
                          d="M6 10l2 2 6-6"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={(e) => {
                    e?.preventDefault()
                    e?.stopPropagation()
                    handleGetStarted(plan.name.toLowerCase())
                  }}
                  style={{
                    width: '100%',
                    padding: '1rem 2rem',
                    backgroundColor: plan.popular ? '#3b82f6' : 'transparent',
                    border: plan.popular ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '0.75rem',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    boxShadow: plan.popular ? '0 4px 14px rgba(59, 130, 246, 0.4)' : 'none',
                  }}
                  onMouseOver={(e) => {
                    if (plan.popular) {
                      e.currentTarget.style.backgroundColor = '#2563eb'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)'
                    } else {
                      e.currentTarget.style.borderColor = '#3b82f6'
                      e.currentTarget.style.color = '#3b82f6'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (plan.popular) {
                      e.currentTarget.style.backgroundColor = '#3b82f6'
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)'
                    } else {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                      e.currentTarget.style.color = '#ffffff'
                    }
                  }}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        padding: '6rem 2rem',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '3rem',
          }}>
            {[
              { number: '99.9%', label: 'Uptime SLA' },
              { number: '< 2s', label: 'Response Time' },
              { number: '24/7', label: 'Support' },
              { number: '100+', label: 'Integrations' },
            ].map((stat, index) => (
              <div key={index}>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '0.5rem',
                }}>
                  {stat.number}
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '1.125rem',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '6rem 2rem',
        textAlign: 'center',
        backgroundColor: '#0a0a0a',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            color: '#ffffff',
          }}>
            Ready to Transform Your IT Operations?
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '2.5rem',
            lineHeight: '1.6',
          }}>
            Join thousands of teams using ITSM Helpdesk to streamline their IT service management.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={(e) => handleDemoClick(e)}
              style={{
                padding: '1rem 2.5rem',
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
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Try Free Demo
            </button>
            <button
              type="button"
              onClick={(e) => handleContactClick(e)}
              style={{
                padding: '1rem 2.5rem',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.5rem',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
                e.currentTarget.style.color = '#3b82f6'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                e.currentTarget.style.color = '#ffffff'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 2rem',
        backgroundColor: '#0a0a0a',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: '#3b82f6',
          }}>
            ITSM Helpdesk
          </div>
          <p style={{
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '2rem',
          }}>
            Modern IT Service Management Platform
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
          }}>
            <button
              type="button"
              onClick={(e) => handleDemoClick(e)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Demo
            </button>
            <button
              type="button"
              onClick={(e) => handleContactClick(e)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Contact
            </button>
          </div>
          <p style={{
            color: 'rgba(255, 255, 255, 0.3)',
            marginTop: '2rem',
            fontSize: '0.875rem',
          }}>
            © 2025 ITSM Helpdesk. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
