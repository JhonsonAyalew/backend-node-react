import React, { useState } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';

const App = () => {
  const [mode, setMode] = useState('connect');       // 'connect' or 'chat'
  const [connectionKey, setConnectionKey] = useState('');
  const [peerConnection, setPeerConnection] = useState(null);  // store simple-peer instance

  // Called by Login when connected: receive your key and peer object
  const handleConnected = (key, peer) => {
    setConnectionKey(key);
    setPeerConnection(peer);
    setMode('chat');
  };

  // Disconnect from chat, reset state
  const handleDisconnect = () => {
    if (peerConnection) {
      peerConnection.destroy();
    }
    setPeerConnection(null);
    setConnectionKey('');
    setMode('connect');
  };

  return (
    <>
      {mode === 'connect' ? (
        <Login onConnected={handleConnected} />
      ) : (
        <Chat
          connectionKey={connectionKey}
          peer={peerConnection}
          onDisconnect={handleDisconnect}
        />
      )}
    </>
  );
};

export default App;
