import React from "react";
import { Award, Users, Package, Shield, TrendingUp, BarChart3, ShoppingCart, FileText, CheckCircle } from "lucide-react";

export default function AboutView() {
  const features = [
    {
      icon: Award,
      title: "Driver Points & Redemption",
      description: "Drivers earn points for safe driving and redeem them for rewards",
      color: "#3b82f6"
    },
    {
      icon: ShoppingCart,
      title: "Live Product Catalogs",
      description: "Sponsor-managed catalogs with real-time pricing and availability",
      color: "#10b981"
    },
    {
      icon: Shield,
      title: "Secure Authentication",
      description: "Audit logs and secure authentication flows for all users",
      color: "#f59e0b"
    },
    {
      icon: BarChart3,
      title: "Rich Reporting",
      description: "Downloadable, visually rich reports with comprehensive analytics",
      color: "#ef4444"
    }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-text">Team 18</span>
          </div>
          <h1 className="hero-title">
            Truck Points
            <span className="gradient-text">Reward System</span>
          </h1>
          <p className="hero-subtitle">
            An innovative platform that partners drivers with sponsors to reward safe, 
            high-performance driving. Earn points, redeem rewards, and drive safer.
          </p>
          <div className="hero-actions">
            <button 
              className="btn-hero btn-primary-hero"
              onClick={() => window.location.hash = "#/login"}
            >
              Get Started
            </button>
            <button 
              className="btn-hero btn-secondary-hero"
              onClick={() => window.location.hash = "#/login"}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">What's Inside</h2>
          <p className="section-subtitle">Powerful features designed for drivers, sponsors, and administrators</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon" style={{ background: `linear-gradient(135deg, ${feature.color}15 0%, ${feature.color}25 100%)`, color: feature.color }}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Info Cards */}
      <section className="info-section">
        <div className="info-grid">
          <div className="info-card">
            <div className="info-card-header">
              <Users className="w-5 h-5" style={{ color: "#3b82f6" }} />
              <h3>Team Information</h3>
            </div>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Team #</span>
                <span className="info-value">18</span>
              </div>
              <div className="info-item">
                <span className="info-label">Version #</span>
                <span className="info-value">6</span>
              </div>
              <div className="info-item">
                <span className="info-label">Release Date</span>
                <span className="info-value">11/04/2025</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <Package className="w-5 h-5" style={{ color: "#10b981" }} />
              <h3>Product Details</h3>
            </div>
            <div className="info-content">
              <p className="info-text">
                <strong>Truck Points</strong> is an online portal that partners drivers with sponsors 
                to reward safe, high-performance driving. Drivers earn points with monetary value 
                and redeem them for items in their sponsor's curated catalog.
              </p>
            </div>
          </div>

          <div className="info-card highlight-card">
            <div className="info-card-header">
              <TrendingUp className="w-5 h-5" style={{ color: "#f59e0b" }} />
              <h3>Why It Matters</h3>
            </div>
            <div className="info-content">
              <p className="info-text">
                Improving on-road performance reduces risk, increases safety, and rewards great drivers. 
                Sponsors gain configurable programs, live catalogs via public APIs, and rich reporting—admins 
                get end-to-end visibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-card">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-text">Join thousands of drivers earning rewards for safe driving</p>
            <button 
              className="btn-cta"
              onClick={() => window.location.hash = "#/login"}
            >
              Sign In Now
            </button>
          </div>
        </div>
      </section>

      <style>{aboutStyles}</style>
    </div>
  );
}

const aboutStyles = `
.about-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  padding: 80px 32px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-block;
  margin-bottom: 24px;
}

.badge-text {
  display: inline-block;
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  backdrop-filter: blur(10px);
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  margin: 0 0 20px 0;
  line-height: 1.1;
  letter-spacing: -1px;
}

.gradient-text {
  display: block;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 40px 0;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-hero {
  padding: 14px 32px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary-hero {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.btn-primary-hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

.btn-secondary-hero {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.btn-secondary-hero:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

/* Features Section */
.features-section {
  padding: 80px 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-title {
  font-size: 40px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.section-subtitle {
  font-size: 18px;
  color: #6b7280;
  margin: 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.feature-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.feature-description {
  font-size: 15px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

/* Info Section */
.info-section {
  padding: 0 32px 80px;
  max-width: 1400px;
  margin: 0 auto;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.info-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-card.highlight-card {
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  border-color: #dbeafe;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.info-card-header h3 {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.info-label {
  font-weight: 600;
  color: #6b7280;
  font-size: 14px;
}

.info-value {
  font-weight: 700;
  color: #1f2937;
  font-size: 16px;
}

.info-content {
  margin-top: 8px;
}

.info-text {
  font-size: 15px;
  color: #374151;
  line-height: 1.7;
  margin: 0;
}

.info-text strong {
  color: #1f2937;
  font-weight: 700;
}

/* CTA Section */
.cta-section {
  padding: 80px 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.cta-card {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 24px;
  padding: 64px 32px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
}

.cta-content {
  max-width: 600px;
  margin: 0 auto;
}

.cta-title {
  font-size: 36px;
  font-weight: 700;
  color: white;
  margin: 0 0 16px 0;
}

.cta-text {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.btn-cta {
  padding: 16px 40px;
  background: white;
  color: #3b82f6;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.btn-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
  }
  
  .hero-subtitle {
    font-size: 16px;
  }
  
  .section-title {
    font-size: 32px;
  }
  
  .features-grid,
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .cta-title {
    font-size: 28px;
  }
}
`;
