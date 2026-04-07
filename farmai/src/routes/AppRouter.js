import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,

} from "react-router-dom";
import AppNavbar from "../components/navbar/NavBar";
import Home from "../views/home/Home";
import Chat from "../views/chatbot/Chat";
import DiseaseDetection from "../views/diseasae-detection/DiseaseDetection";
import Notifications from "../views/notifications/Notifications";
import Crops from "../views/crops/Crops";
import Weather from "../views/weather/Weather";

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <AppNavbar />
              <Home />
            </>
          }
        />
        <Route path="/chat" element={<Chat />} />
        <Route path="/crop" element={<Crops />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/disease" element={<DiseaseDetection />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
