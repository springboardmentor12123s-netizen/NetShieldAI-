import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Activity,
  BrainCircuit,
  BellRing,
  BarChart3,
  LockKeyhole,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="landing-brand-mark">
            <Shield size={22} />
          </span>
          <span>NETSHIELD AI</span>
        </Link>

        <div className="landing-nav-actions">
          <Link to="/login" className="landing-login">
            Login
          </Link>

          <Link to="/register" className="landing-register">
            Get Started
            <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-badge">
            <span className="landing-pulse" />
            AI-POWERED NETWORK SECURITY
          </div>

          <h1>
            Detect Threats.
            <br />
            <span>Protect Your Network.</span>
          </h1>

          <p className="landing-description">
            NetShield AI is an intelligent network anomaly detection and
            threat monitoring platform that uses machine learning to identify
            suspicious traffic and provide actionable security insights.
          </p>

          <div className="landing-hero-buttons">
            <Link to="/login" className="landing-primary-btn">
              Get Started
              <ArrowRight size={18} />
            </Link>

            <a href="#features" className="landing-secondary-btn">
              Explore Features
            </a>
          </div>

          <div className="landing-trust">
            <div>
              <CheckCircle2 size={16} />
              Real-Time Monitoring
            </div>
            <div>
              <CheckCircle2 size={16} />
              ML-Based Detection
            </div>
            <div>
              <CheckCircle2 size={16} />
              Intelligent Alerts
            </div>
          </div>
        </div>

        {/* Security visualization */}
        <div className="landing-visual">
          <div className="security-card">
            <div className="security-card-header">
              <div>
                <span className="status-dot" />
                NETWORK SECURITY
              </div>
              <span className="live-text">LIVE</span>
            </div>

            <div className="security-score">
              <div className="score-ring">
                <Shield size={42} />
              </div>

              <div>
                <div className="score-number">99.4%</div>
                <div className="score-label">AI MODEL ACCURACY</div>
              </div>
            </div>

            <div className="security-stats">
              <div>
                <span>PACKETS</span>
                <strong>6,554</strong>
              </div>

              <div>
                <span>THREATS</span>
                <strong>5,538</strong>
              </div>

              <div>
                <span>ALERTS</span>
                <strong>5,531</strong>
              </div>
            </div>

            <div className="threat-list">
              <div className="threat-item">
                <span className="threat-indicator critical" />
                <div>
                  <strong>DDoS Attack</strong>
                  <small>Critical threat detected</small>
                </div>
                <span className="threat-risk">98%</span>
              </div>

              <div className="threat-item">
                <span className="threat-indicator high" />
                <div>
                  <strong>Port Scan</strong>
                  <small>Suspicious activity</small>
                </div>
                <span className="threat-risk">76%</span>
              </div>

              <div className="threat-item">
                <span className="threat-indicator normal" />
                <div>
                  <strong>Normal Traffic</strong>
                  <small>No action required</small>
                </div>
                <span className="threat-risk">13%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-features">
        <div className="section-heading">
          <div className="landing-badge">SECURITY CAPABILITIES</div>

          <h2>
            Intelligent protection for
            <span> modern networks.</span>
          </h2>

          <p>
            Monitor network activity, detect attacks, and understand threats
            with an AI-powered security platform.
          </p>
        </div>

        <div className="feature-grid">
          <FeatureCard
            icon={<BrainCircuit size={25} />}
            title="AI Threat Detection"
            description="Machine learning analyzes network traffic and classifies threats such as DDoS, port scanning, brute force and botnet activity."
          />

          <FeatureCard
            icon={<Activity size={25} />}
            title="Real-Time Monitoring"
            description="Monitor network packets and traffic activity through a centralized security dashboard."
          />

          <FeatureCard
            icon={<BellRing size={25} />}
            title="Intelligent Alerts"
            description="Receive security alerts based on risk scores and threat severity so critical events can be investigated quickly."
          />

          <FeatureCard
            icon={<BarChart3 size={25} />}
            title="Security Analytics"
            description="Analyze detection history, attack types, risk levels and network security trends."
          />

          <FeatureCard
            icon={<LockKeyhole size={25} />}
            title="Role-Based Access"
            description="Administrators and security analysts receive access appropriate to their responsibilities."
          />

          <FeatureCard
            icon={<Shield size={25} />}
            title="Actionable Recommendations"
            description="Get recommended actions for detected attacks to help security teams respond effectively."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="landing-process">
        <div className="section-heading">
          <div className="landing-badge">HOW IT WORKS</div>

          <h2>
            From traffic to
            <span> security insight.</span>
          </h2>
        </div>

        <div className="process-grid">
          <ProcessStep
            number="01"
            title="Monitor"
            description="Collect and analyze network traffic and packet information."
          />

          <ProcessStep
            number="02"
            title="Analyze"
            description="The machine learning model evaluates traffic patterns."
          />

          <ProcessStep
            number="03"
            title="Classify"
            description="Identify normal traffic or specific attack categories."
          />

          <ProcessStep
            number="04"
            title="Respond"
            description="Generate risk scores, alerts and recommended actions."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div>
          <Shield size={40} />

          <h2>Ready to secure your network?</h2>

          <p>
            Start monitoring network activity with NetShield AI.
          </p>
        </div>

        <Link to="/login" className="landing-primary-btn">
          Enter NetShield AI
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-brand">
          <span className="landing-brand-mark">
            <Shield size={18} />
          </span>
          NETSHIELD AI
        </div>

        <span>
          Network Anomaly Detection & Threat Monitoring
        </span>

        <span>© 2026 NetShield AI</span>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}

function ProcessStep({ number, title, description }) {
  return (
    <div className="process-step">
      <div className="process-number">{number}</div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}