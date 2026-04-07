// src/views/chatbot/ChatManager.js

import { BiLeaf } from "react-icons/bi";
import { BsBarChart, BsCamera, BsCloudDrizzle } from "react-icons/bs";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5050";

const chatManager = (() => {
  let messages = [
    {
      id: "1",
      type: "bot",
      content:
        "Hello! I'm your AI farming assistant. I can help you with crop management, weather planning, disease identification, and farming best practices. What would you like to know about today?",
      timestamp: new Date(),
    },
  ];
  let input = "";
  let isTyping = false;

  const quickQuestions = [
    {
      icon: <BsCloudDrizzle color="green" />,
      text: "What's the best time to water my crops?",
      category: "weather",
    },
    {
      icon: <BsCamera color="green" />,
      text: "How can I identify plant diseases?",
      category: "disease",
    },
    {
      icon: <BiLeaf color="green" />,
      text: "When should I fertilize my tomatoes?",
      category: "nutrition",
    },
    {
      icon: <BsBarChart color="green" />,
      text: "How to improve crop yield?",
      category: "optimization",
    },
  ];

  const generateBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("water") || lowerMessage.includes("irrigation")) {
      return "Based on current weather data and soil moisture levels, I recommend watering your crops early morning (6-8 AM) or late evening (6-8 PM) to minimize evaporation. For tomatoes, maintain consistent moisture levels but avoid overwatering which can lead to root rot. Check soil moisture 2-3 inches deep before watering.";
    } else if (
      lowerMessage.includes("disease") ||
      lowerMessage.includes("pest")
    ) {
      return "For disease identification, I recommend using our AI-powered image detection feature. Upload clear photos of affected plants showing symptoms. Common signs include yellowing leaves, spots, wilting, or unusual growth patterns. Early detection is key for effective treatment. Would you like me to guide you through the disease detection process?";
    } else if (
      lowerMessage.includes("fertilize") ||
      lowerMessage.includes("nutrition")
    ) {
      return "Fertilization timing depends on your crop type and growth stage. For tomatoes, apply a balanced fertilizer (10-10-10) at planting, then switch to low-nitrogen, high-phosphorus fertilizer during flowering. Side-dress with compost every 3-4 weeks. Monitor leaf color and growth patterns to adjust feeding schedule.";
    } else if (
      lowerMessage.includes("yield") ||
      lowerMessage.includes("productivity")
    ) {
      return "To improve crop yield, focus on: 1) Soil health - regular testing and amendments, 2) Proper spacing and companion planting, 3) Integrated pest management, 4) Optimal irrigation scheduling, 5) Timely harvesting. Our analytics dashboard can help track your progress and identify improvement opportunities.";
    } else if (
      lowerMessage.includes("weather") ||
      lowerMessage.includes("rain")
    ) {
      return "Current weather conditions show optimal growing temperatures. Expected rainfall in the next 3 days means you can reduce irrigation. I recommend monitoring humidity levels and ensuring good air circulation to prevent fungal diseases during wet periods.";
    } else {
      return "I understand you're asking about farming practices. Could you be more specific? I can help with crop management, irrigation, disease prevention, fertilization, pest control, harvest timing, and weather-related decisions. Feel free to ask about any specific crops or challenges you're facing.";
    }
  };

  const sendMessage = (setMessages, setInput, setIsTyping) => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    messages = [...messages, userMessage];
    setInput("");
    setIsTyping(true);
    setMessages(messages);

    const currentInput = input;
    axios
      .post(`${API_URL}/api/chat`, { query: currentInput })
      .then((res) => {
        const content = res.data?.answer || generateBotResponse(currentInput);
        const botResponse = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content,
          timestamp: new Date(),
        };
        messages = [...messages, botResponse];
        setIsTyping(false);
        setMessages(messages);
      })
      .catch(() => {
        const botResponse = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: generateBotResponse(currentInput),
          timestamp: new Date(),
        };
        messages = [...messages, botResponse];
        setIsTyping(false);
        setMessages(messages);
      });
  };

  const handleQuickQuestion = (question, setInput) => {
    setInput(question);
    input = question; // keep internal input in sync so Send uses this value
  };

  const handleKeyPress = (e, setMessages, setInput, setIsTyping) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(setMessages, setInput, setIsTyping);
    }
  };

  return {
    getMessages: () => [...messages],
    getInput: () => input,
    getIsTyping: () => isTyping,
    getQuickQuestions: () => [...quickQuestions],
    setInput: (value) => {
      input = value;
    },
    sendMessage,
    handleQuickQuestion,
    handleKeyPress,
  };
})();

export default chatManager;

