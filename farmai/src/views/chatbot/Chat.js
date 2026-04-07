import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { Card, Form, ListGroup } from 'react-bootstrap';
import { BsChatLeft, BsChatLeftDots,BsCloudDrizzle ,BsFillSendFill,BsPerson,BsRobot} from "react-icons/bs";


import chatManager from './ChatManager';

const Chat = () => {
  const [messages, setMessages] = useState(chatManager.getMessages());
  const [input, setInput] = useState(chatManager.getInput());
  const [isTyping, setIsTyping] = useState(chatManager.getIsTyping());
  const messagesEndRef = useRef(null);

  const quickQuestions = chatManager.getQuickQuestions();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    chatManager.sendMessage(setMessages, setInput, setIsTyping);
  };

  const handleQuickQuestion = (question) => {
    chatManager.handleQuickQuestion(question, setInput);
  };

  const handleKeyPress = (e) => {
    chatManager.handleKeyPress(e, setMessages, setInput, setIsTyping);
  };

  const totalQuestions = messages.filter((msg) => msg.type === 'user').length;

  return (
    <div className="min-vh-100 " style={{}}>
      <div className="py-4 p-5">
        <div className="mb-4">
          <h1 className="fs-4 text-success fw-bold mb-2">AI Assistant</h1>
          <p className="text-muted">Get expert farming advice and real-time guidance from our intelligent assistant</p>
        </div>

        <div className="row g-4">
          {/* Chat Interface */}
          <div className="col-lg-9">
            <Card className="border-opacity-50 border-6 h-51 d-flex flex-column rounded-3 p-0" >
              <Card.Header className="border-bottom p-2 px-4 mt-2" style={{ backgroundColor: 'transparent',}}>
                <h5 className="text-success d-flex align-items-center fw-bold ">
                 <BsChatLeft style={{marginRight:"10px",marginTop:"5px"}} /> Chat with AI
                </h5>
              </Card.Header>

              <Card.Body className="flex-grow-1 p-0 overflow-auto" style={{ height: '500px',}}>
                <div className="p-3 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`d-flex ${message.type === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                      
                    >
                      <div className={`d-flex align-items-start ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} py-2`}>
                        <div
                          className={`rounded-circle text-white d-flex align-items-center justify-content-center`}
                          style={{ width: '2rem', height: '2rem',padding:"10px" ,backgroundColor: message.type === 'user'? "#FF8833":"green"}}
                        >
                          {message.type === 'user' ? <BsPerson /> : <BsRobot/>}
                        </div>
                        <div
                        style={{backgroundColor: message.type === 'user'? "#FF8833":"#f5f8f5",marginRight:'5px'}}
                          className={`ms-2 p-2 rounded  w-100`}
                        >
                          <p className="mb-1" style={{color: message.type === 'user'? "white":"#798689"}} >{message.content}</p>
                          <small className={message.type === 'user' ? 'text-white' : 'text-black-50'}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="d-flex justify-content-start">
                      <div className="d-flex align-items-start">
                        <div
                          className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center"
                          style={{ width: '2rem', height: '2rem' }}
                        >
                          <BsRobot/>
                        </div>
                        <div className="ms-2 p-2 bg-success bg-opacity-10 border border-success rounded">
                          <div className="d-flex gap-1">
                            <div className="typing-dot bg-success rounded-circle" style={{ width: '0.5rem', height: '0.5rem', animation: 'bounce 1.4s infinite ease-in-out' }}></div>
                            <div className="typing-dot bg-success rounded-circle" style={{ width: '0.5rem', height: '0.5rem', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.1s' }}></div>
                            <div className="typing-dot bg-success rounded-circle" style={{ width: '0.5rem', height: '0.5rem', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </Card.Body>
              <Card.Footer className="border-top p-3" style={{backgroundColor:'transparent',flexDirection:'row',justifyContent:'center',display:'flex'}} >
                <div className="input-group">
                  <Form.Control
                    value={input}
                    onChange={(e) => {
                      chatManager.setInput(e.target.value);
                      setInput(e.target.value);
                    }}
                    style={{backgroundColor:'transparent'}}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about farming..."
                  />
                 
                </div>
                <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isTyping}
                    className="bg-success text-white ms-2"
                  >
                   <BsFillSendFill/>
                  </Button>
              </Card.Footer>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="col-lg-3">
            {/* Quick Questions */}
             <Card className="mb-4 p-0 border-0">
            <Card.Header style={{ backgroundColor: 'transparent', padding: '1rem' }}>
              <h5 className="text-success mt-0 mb-0 fw-bold text-left">Quick Questions</h5>
            </Card.Header>
            <Card.Body className="p-6 m-2">
              <ListGroup variant="flush">
                {quickQuestions.map((question, index) => (
                  <ListGroup.Item
                    key={index}
                    action
                    onClick={() => handleQuickQuestion(question.text)}
                    className="d-flex align-items-center justify-content-center border my-2"
                    style={{  margin: '2px 0', borderRadius: '12px', cursor: 'pointer' }}
                  >
                    <span className="me-3" style={{ fontSize: '1.2rem' }}>
                      {question.icon}
                    </span>
                    <span className="text-muted">{question.text}</span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>

            {/* AI Capabilities */}
            <Card className="mb-4 p-0">
              <Card.Header style={{ backgroundColor: 'transparent',padding: '1rem' }}>
                <h5 className="text-success mt-0 mb-0 fw-bold text-left">I Can Help With</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge bg-success text-white">Crop Management</span>
                  <span className="badge  text-white" style={{backgroundColor:"#FF8833"}} >Disease Identification</span>
                  <span className="badge bg-success text-white">Weather Planning</span>
                  <span className="badge  text-white" style={{backgroundColor:"#FF8833"}}>Irrigation Scheduling</span>
                  <span className="badge bg-success text-white">Pest Control</span>
                  <span className="badge text-white" style={{backgroundColor:"#FF8833"}}>Fertilization</span>
                  <span className="badge bg-success text-white">Harvest Timing</span>
                  <span className="badge text-white" style={{backgroundColor:"#FF8833"}}>Soil Health</span>
                </div>
              </Card.Body>
            </Card>

            {/* Usage Stats */}
            <Card className="p-0">
              <Card.Header style={{ backgroundColor: 'transparent',padding: '1rem' }}>
                <h5 className="text-success mt-0 mb-0 fw-bold text-left">Chat Stats</h5>
              </Card.Header>
              <Card.Body className="text-center">
                <div className="p-3 bg-success bg-opacity-10 rounded">
                  <div className="text-success fw-bold">24/7</div>
                  <div className="text-muted small">Available</div>
                </div>
                <div className=" mt-3" style={{display:'flex',justifyContent:'space-between',flexDirection:'row'}}>
                  <div className="col-6 p-2 bg-warning bg-opacity-10 rounded">
                    <div className="text-warning fw-bold">{totalQuestions}</div>
                    <div className="text-muted small">Questions</div>
                  </div>
                  <div className="col-6 p-2 bg-success bg-opacity-10 rounded ms-2">
                    <div className="text-success fw-bold">98%</div>
                    <div className="text-muted small">Helpful</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;