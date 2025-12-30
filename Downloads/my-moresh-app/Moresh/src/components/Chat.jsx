import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ connectionKey, peer, onDisconnect }) => {
  const [status, setStatus] = useState('connected');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const connectedDevice = {
    id: connectionKey,
    name: 'PEER DEVICE',
    status: 'online',
    ip: 'N/A',
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRemoteTyping]);

  useEffect(() => {
    if (!peer) return;

    const handleClose = () => {
      setStatus('disconnected');
      onDisconnect();
    };

    const handleError = (err) => {
      setStatus('error');
      addSystemMessage(`Peer error: ${err.message}`);
    };

    const handleData = (data) => {
      const text = data.toString();

      if (text === '__TYPING__') {
        showTypingIndicator();
      } else {
        setIsRemoteTyping(false); // Hide typing if real message arrives
        addMessage('remote', text);
      }
    };

    peer.on('close', handleClose);
    peer.on('error', handleError);
    peer.on('data', handleData);

    return () => {
      peer.off('close', handleClose);
      peer.off('error', handleError);
      peer.off('data', handleData);
    };
  }, [peer, onDisconnect]);

  const showTypingIndicator = () => {
    setIsRemoteTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsRemoteTyping(false);
    }, 3000);
  };

  const addMessage = (user, text) => {
    const newMessage = {
      id: Date.now(),
      user,
      text,
      time: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const addSystemMessage = (text) => {
    addMessage('system', text);
  };

  const sendMessage = () => {
    if (!input.trim() || !peer || status !== 'connected') return;

    try {
      peer.send(input.trim());
      addMessage('local', input.trim());
      setInput('');
    } catch (err) {
      addSystemMessage(`Failed to send message: ${err.message}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (peer && status === 'connected') {
      peer.send('__TYPING__');
    }
  };

  const toggleNav = () => {
    setNavOpen((prev) => !prev);
  };

  return (
    <div className="chat-screen">
      {navOpen && <div className="nav-overlay" onClick={toggleNav} />}

      <div className={`nav-panel ${navOpen ? 'open' : ''}`}>
        <button className="sidebar-close-btn" onClick={toggleNav}>×</button>
        <div className="nav-header">
          <div className="logo">SYSTEM CONSOLE</div>
          <div className="nav-status">
            <span className={`status-dot ${status}`} />
            {status.toUpperCase()}
          </div>
        </div>
        <div className="nav-content">
          <div className="devices-list">
            <h4>Moresh</h4>
            <div className={`device-item ${connectedDevice.status} active`}>
              <div className="device-info">
                <div className="device-name">{connectedDevice.name}</div>
                <div className="device-details">
                  <span className="device-ip">{connectedDevice.ip}</span>
                  <span className="device-status">{connectedDevice.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="nav-footer">
          <button
            onClick={onDisconnect}
            className="terminate-btn"
            title="Terminate the current connection"
          >
            ⚠️ TERMINATE SESSION
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="chat-header">
          <button className="hamburger-btn" onClick={toggleNav}>☰</button>
          <div className="connection-info">
            <span className="user-prompt">peer@system:~$</span>
            <span className="peer-id">
              ID: {connectionKey?.substring(0, 4)}...{connectionKey?.slice(-4)}
            </span>
          </div>
        </div>

        <div className="chat-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.user}`}>
              <div className="message-header">
                <span className="time">{msg.time}</span>
              </div>
              <div className="text">{msg.text}</div>
            </div>
          ))}

          {isRemoteTyping && (
            <div className="message remote typing-indicator">
              <div className="text typing-bubble">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-prompt">you@terminal:~$</div>
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type message..."
            disabled={status !== 'connected'}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || status !== 'connected'}
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
