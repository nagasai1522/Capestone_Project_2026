import React from "react";
import { Link } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import "./navbar.css";

const AppNavbar = () => {
  return (
    <Navbar
      expand="lg"
      className="bg-transparent position-absolute w-100 z-3 mt-2"
    >
      <Container className="d-flex justify-content-between align-items-center">
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          {/* <Image
          src={logo}
          alt="FarmAI Logo"
          width="35"
          height="35"
          className="me-2"
        /> */}
          <span className="text-white fw-bold fs-5">FarmAI</span>
        </Navbar.Brand>
        <div className="justify-content-end d-flex flex-row" id="navbar-nav">
          <div className="me-3 ml-5 p-2  d-flex flex-row">
          <Nav.Link as={Link} to="/weather" className="nav-link">
              Weather
            </Nav.Link>
            <Nav.Link as={Link} to="/crop" className="nav-link">
              Crops
            </Nav.Link>
           
           
            <Nav.Link as={Link} to="/disease" className="nav-link">
              Disease Detection
            </Nav.Link>
            <Nav.Link as={Link} to="/chat" className="nav-link">
              AI Assistant
            </Nav.Link>
            <Nav.Link as={Link} to="/notifications" className="nav-link">
              Notifications
            </Nav.Link>
          </div>
        </div>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
