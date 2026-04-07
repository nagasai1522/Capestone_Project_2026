import React from "react";
import "./Home.css";
import { IoMdRainy } from "react-icons/io";
import { FiAlertCircle, FiTrendingUp, FiGlobe, FiUsers } from "react-icons/fi";
import { WiDayCloudy } from "react-icons/wi";
import {
  PiCameraBold,
  PiNotification,
  PiNotificationBold,
  PiPlant,
} from "react-icons/pi";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  // Dynamic data for feature cards
  const features = [
    {
      title: "Weather Intelligence",
      description: "Beautiful weather forecasting with intuitive visual design",
      items: [
        "Live weather data",
        "7-day forecasts",
        "Smart alerts",
        "Visual insights",
      ],
      icon: (
        <WiDayCloudy
          size={"35px"}
          color="white"
          style={{ marginTop: "14px" }}
        />
      ),
      buttonText: "Explore Weather Intelligence",
    },
    {
      title: "Crop Management",
      description: "Elegant crop monitoring with delightful user experience",
      items: [
        "Growth tracking",
        "Health monitoring",
        "Harvest planning",
        "Visual reports",
      ],
      icon: (
        <PiPlant size={"30px"} color="white" style={{ marginTop: "15px" }} />
      ),
      buttonText: "Explore Crop Management",
    },
    {
      title: "Disease Detection",
      description: "AI-powered plant analysis with stunning visual feedback",
      items: [
        "Instant diagnosis",
        "95%+ accuracy",
        "Treatment plans",
        "Photo history",
      ],
      icon: (
        <PiCameraBold
          size={"30px"}
          color="white"
          style={{ marginTop: "15px" }}
        />
      ),
      buttonText: "Explore Disease Detection",
    },
    {
      title: "Smart Notifications",
      description: "Gentle reminders and alerts with beautiful design",
      items: [
        "Smart alerts",
        "Custom schedules",
        "Priority management",
        "Visual indicators",
      ],
      icon: (
        <PiNotification
          size={"30px"}
          color="white"
          style={{ marginTop: "15px" }}
        />
      ),
      buttonText: "Explore Smart Notifications",
    },
  ];

  const globalImpcat = [
    {
      name: "Smart farmers",
      description: "Worldwide community",
      count: "75K+",
      icon: <FiUsers size={"30px"} />,
    },
    {
      name: "Yield Increase",
      description: "Average improvement",
      count: "65%",
      icon: <FiTrendingUp size={"30px"} />,
    },
    {
      name: "Countries",
      description: "Global presence",
      count: "120+",
      icon: <FiGlobe size={"30px"} />,
    },
    {
      name: "Satisfaction",
      description: "Customer rating",
      count: "99.8%",
      icon: <WiDayCloudy size={"30px"} />,
    },
  ];

  return (
    <div className="home-container">
      <div className="hero-container position-relative text-center text-white">
        <div className="absolute inset-0">
          <video autoPlay muted loop playsInline className="background-video">
            <source src="/background.mp4" type="video/mp4" />
          </video>
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          ></div>
        </div>

        <div className="hero-content position-absolute top-50 start-50 translate-middle w-100">
          <div id="smart-text" className="mb-1 px-3 py-1 fw-bold">
            🌱 Smart Farming
          </div>

          <h1 className="display-3 fw-bold">
            Advanced Farm <br />
            <span style={{ color: "#FF8833", fontSize: "4rem" }}>
              Management System
            </span>
          </h1>
          <p className="lead mt-2">
            Monitor weather, manage crops, detect diseases, and receive smart{" "}
            <br />
            notifications all in one powerful farming platform.
          </p>
          <div className="d-flex justify-content-center gap-3 mt-4 flex-wrap">
            <button
              className="btn btn-success px-4 py-2 fw-bold"
              onClick={() => {
                navigate("/crop");
              }}
            >
              Get Started →
            </button>
            <button
              className="btn btn-light px-4 py-2 fw-bold d-flex align-items-center gap-2"
              onClick={() => {
                navigate("/chat");
              }}
            >
              <img
                src="https://img.icons8.com/ios-filled/20/000000/artificial-intelligence.png"
                alt="AI icon"
              />
              Meet AI Assistant
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-5 features-section">
        <div className="text-center mb-4">
          <div id="smart-text" className="mb-1 px-3 py-1 fw-bold">
            Beautiful Features
          </div>
          <h2 className="text-success fw-bold">Everything You Need in</h2>
          <h2 style={{ color: "#FF8833", fontSize: "3.3rem" }}>
            One Elegant Platform
          </h2>
          <p className="text-muted">
            Discover the most beautiful and intuitive farming tools <br />
            designed with love for modern agriculture
          </p>
        </div>
        <div className="row g-4 justify-content-center">
          {features.map((feature, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-3">
              <div className="card h-80 shadow-sm border-1 rounded-5  text-center">
                <div className="text-center mb-3 ">
                  <span className="feature-icon">{feature.icon}</span>
                </div>
                <h4 className="text-success fw-bold">{feature.title}</h4>
                <p className="text-muted mb-3">{feature.description}</p>
                <ul className="list-unstyled text-muted mb-4">
                  {feature.items.map((item, i) => (
                    <li key={i} className="d-flex align-items-center mb-2">
                      <span className="badge bg-success-soft me-2 rounded-5">
                        ✔
                      </span>{" "}
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  className="btn btn-success w-100 fw-bold rounded-5"
                  onClick={() => {
                    switch (feature.buttonText) {
                      case "Explore Weather Intelligence":
                        navigate("/weather");
                        break;
                      case "Explore Crop Management":
                        navigate("/crop");
                        break;

                      case "Explore Smart Notifications":
                        navigate("/notifications");
                        break;

                      case "Chat With Us":
                        navigate("/chat");
                        break;

                      case "Explore Disease Detection":
                        navigate("/disease");
                        break;

                      default:
                        navigate("/");
                        break;
                    }
                  }}
                >
                  {feature.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="global-impact-container">
        <h1 className="text-white fw-bold" style={{ fontSize: "3rem" }}>
          Global{" "}
          <span
            style={{ color: "#FF8833", fontSize: "3rem", fontWeight: "bold" }}
          >
            Impact
          </span>
        </h1>
        <p className="subtitle text-white fw-medium fs-5">
          Join thousands of farmers worldwide who are revolutionizing <br />
          agriculture with intelligent technology
        </p>
        <div className="row g-2 justify-content-between">
          {globalImpcat.map((feature, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-3">
              <div className="global-icon">{feature.icon}</div>
              <h1
                className="text-white"
                style={{ fontSize: "3rem", fontWeight: "bold" }}
              >
                {feature.count}
              </h1>
              <p className="mb-0 fw-bold">{feature.name}</p>

              <p className="fs-0">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="justify-content-center text-center p-5">
        <div id="smart-text" className="mb-1 px-3 py-1 fw-bold text-center">
          🌱 Start Your Journey
        </div>

        <h1 className="display-4 fw-bold text-center">
          Ready to
          <br />
          <span style={{ color: "#FF8833", fontSize: "3.7rem" }}>
            Transform Agriculture?
          </span>
        </h1>
        <p className="lead mt-2">
          Join the agricultural revolution today. Experience the power of
          AI-driven <br /> farming and watch your operations transform with
          intelligent technology.
        </p>
        <div className="d-flex justify-content-center gap-3 mt-4 flex-wrap">
          <button
            className="btn btn-success px-4 py-2 fw-bold"
            onClick={() => {
              navigate("/crop");
            }}
          >
            Start Free Today →
          </button>
          <button
            className="btn btn-light px-4 py-2 fw-bold d-flex align-items-center gap-2"
            onClick={() => {
              navigate("/disease");
            }}
          >
            <img
              src="https://img.icons8.com/ios-filled/20/000000/artificial-intelligence.png"
              alt="AI icon"
            />
            Try AI Detection
          </button>
        </div>
      </div>

      <footer className="global-impact-container">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-3">
              <div>
                <h3 className="mb-2 text-center">
                  <span role="img" aria-label="leaf">
                    🌱
                  </span>{" "}
                  FarmAI
                </h3>
                <p className="text-center ">Smart Agriculture</p>
                <p
                  className="text-white"
                  style={{ fontSize: "0.9rem", color: "white" }}
                >
                  Revolutionizing agriculture with cutting-edge AI technology
                  for sustainable and profitable farming worldwide.
                </p>
              </div>
            </div>

            <div className="col-md-3 mb-2 mb-md-0">
              <h4 className="mb-2 fw-bold">Platform</h4>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a
                    href="/disease"
                    className="text-white text-decoration-none"
                  >
                    AI Detection
                  </a>
                </li>
                <li className="mb-2">
                  <a href="/chat" className="text-white text-decoration-none">
                    Assistant
                  </a>
                </li>
                <li className="mb-2">
                  <a
                    href="/notifications"
                    className="text-white text-decoration-none"
                  >
                    Alerts
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-md-3 mb-2 mb-md-0">
              <h4 className="mb-2 fw-bold">Resources</h4>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a href="#" className="text-white text-decoration-none">
                    Documentation
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-white text-decoration-none">
                    API Reference
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-white text-decoration-none">
                    Case Studies
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-white text-decoration-none">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-md-3 mb-2 mb-md-0">
              <h4 className="mb-2 fw-bold">Support</h4>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a href="#" className="text-white text-decoration-none">
                    Help Center
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-white text-decoration-none">
                    Contact Us
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-white text-decoration-none">
                    Community
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-white text-decoration-none">
                    Status
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="text-center mt-5" style={{ fontSize: "0.8rem" }}>
          <p className="mb-0">❤️ Made by Ch Jahnavi & team © 2025 FarmAI</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
