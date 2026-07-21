import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function LogoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Step 1 — clear token
    setTimeout(() => setStep(1), 600);

    // Step 2 — clear user data
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setStep(2);
    }, 1200);

    // Step 3 — redirect to login
    setTimeout(() => {
      setStep(3);
      router.push('/login?loggedout=true');
    }, 2000);
  }, [router]);

  const steps = [
    { label: 'Signing out...', done: step >= 1 },
    { label: 'Clearing session data', done: step >= 2 },
    { label: 'Redirecting to login', done: step >= 3 },
  ];

  return (
    <div className="auth-page">
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '32px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 32px rgba(6,182,212,0.4)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
                fill="white"
                opacity="0.9"
              />
            </svg>
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: '700',
              color: 'white',
              margin: 0,
            }}
          >
            NetShield AI
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(148,163,184,1)',
              marginTop: '4px',
            }}
          >
            SOC Threat Monitoring Platform
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'rgba(15,23,42,0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px',
            padding: '40px 48px',
            backdropFilter: 'blur(24px)',
            boxShadow:
              '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(6,182,212,0.08)',
            width: '100%',
            maxWidth: '380px',
            textAlign: 'center',
          }}
        >
          {/* Spinner */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '3px solid rgba(6,182,212,0.15)',
              borderTop: '3px solid #06b6d4',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 24px',
            }}
          />

          <h2
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'white',
              margin: '0 0 6px',
            }}
          >
            Signing you out
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(148,163,184,1)',
              margin: '0 0 28px',
            }}
          >
            Securely ending your session...
          </p>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {steps.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: s.done
                    ? 'rgba(6,182,212,0.08)'
                    : 'rgba(255,255,255,0.03)',
                  border: s.done
                    ? '1px solid rgba(6,182,212,0.20)'
                    : '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: s.done
                      ? 'rgba(6,182,212,0.2)'
                      : 'rgba(255,255,255,0.06)',
                    border: s.done
                      ? '1px solid rgba(6,182,212,0.4)'
                      : '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {s.done ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="#22d3ee"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    color: s.done
                      ? 'rgba(6,182,212,0.9)'
                      : 'rgba(148,163,184,0.7)',
                    fontWeight: s.done ? '500' : '400',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '12px', color: 'rgba(100,116,139,1)' }}>
          You will be redirected to the login page
        </p>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
