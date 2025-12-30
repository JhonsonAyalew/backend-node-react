import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';

const Login = ({ onConnected }) => {
  const [myKey, setMyKey] = useState('');
  const [peerKey, setPeerKey] = useState('');
  const [status, setStatus] = useState('disconnected'); // disconnected, registered, connecting, connected
  const [showGenerated, setShowGenerated] = useState(false);
  const [message, setMessage] = useState('');

  const wsRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    if (myKey.length < 8) return;

    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'register', connectionKey: myKey }));
      setStatus('registered');
      setMessage('Registered with signaling server');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'signal') {
        // Handle incoming signal
        if (!peerRef.current) {
          // I'm the receiver
          const peer = new Peer({ initiator: false, trickle: false });

          peer.on('signal', (responseSignal) => {
            ws.send(JSON.stringify({
              type: 'signal',
              target: data.from,
              data: responseSignal,
            }));
          });

          peer.on('connect', () => {
            setStatus('connected');
            setMessage('Connected with peer!');
            if (onConnected) onConnected(myKey, peer);
          });

          peer.on('error', (err) => {
            setMessage('Peer error: ' + err.message);
            setStatus('error');
          });

          peerRef.current = peer;
        }

        peerRef.current.signal(data.data);
      } else if (data.error) {
        setMessage('Error: ' + data.error);
      }
    };

    ws.onerror = () => {
      setMessage('WebSocket error');
      setStatus('error');
    };

    ws.onclose = () => {
      setStatus('disconnected');
      setMessage('Disconnected from signaling server');
    };

    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
      peerRef.current = null;
    };
  }, [myKey]);

  const generateKey = () => {
    const key = Math.random().toString(36).substring(2, 10);
    setMyKey(key);
    setShowGenerated(true);
    setMessage('');
  };

  const goBack = () => {
    setShowGenerated(false);
    setMyKey('');
    setPeerKey('');
    setStatus('disconnected');
    setMessage('');
    peerRef.current = null;
  };

  const connect = () => {
    if (myKey.length < 8 || peerKey.length < 8) {
      setMessage('Both keys must be at least 8 characters');
      return;
    }

    setStatus('connecting');
    setMessage('Connecting to peer...');

    const peer = new Peer({ initiator: true, trickle: false });

    peer.on('signal', (data) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'signal',
            target: peerKey,
            data,
          })
        );
      }
    });

    peer.on('connect', () => {
      setStatus('connected');
      setMessage('Connected with peer!');
      if (onConnected) onConnected(myKey, peer);
    });

    peer.on('error', (err) => {
      setMessage('Peer error: ' + err.message);
      setStatus('error');
    });

    peerRef.current = peer;
  };

  return (
    <div className="connect-screen">
      <div className="header">
        <h1>Moresh</h1>
        <p>End-to-end encrypted communication</p>
      </div>

      {showGenerated ? (
        <div className="connection-panel" style={{ textAlign: 'center' }}>
          <h2>Your Generated Key</h2>
          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--primary)',
              padding: '1rem',
              borderRadius: '5px',
              wordBreak: 'break-word',
              color: 'var(--primary)',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              marginTop: '1rem',
            }}
          >
            {myKey}
          </div>

          <p className="info" style={{ marginTop: '1rem' }}>
            Keep this key safe. This is your identity.
          </p>

          <div className="button-group" style={{ marginTop: '1.5rem' }}>
            <button className="generate-btn" onClick={generateKey}>
              🔁 Generate Another
            </button>
            <button className="back-btn" onClick={goBack} style={{ marginLeft: '1rem' }}>
              🔙 Back to Connect
            </button>
          </div>
        </div>
      ) : (
        <div className="connection-panel">
          <h2>ESTABLISH CONNECTION</h2>
          <div className={`status ${status}`}>{status.toUpperCase()}</div>

          <div className="input-group">
            <label>Your Key:</label>
            <input
              type="text"
              value={myKey}
              onChange={(e) => setMyKey(e.target.value)}
              placeholder="e.g. x7f9k2p5"
              disabled={status !== 'disconnected' && status !== 'registered'}
            />
          </div>

          <div className="input-group">
            <label>Enter Peer Key:</label>
            <input
              type="text"
              value={peerKey}
              onChange={(e) => setPeerKey(e.target.value)}
              placeholder="e.g. a9d4j1q3"
              disabled={status !== 'disconnected' && status !== 'registered'}
            />
          </div>

          <div className="button-group">
            <button
              onClick={connect}
              disabled={
                myKey.length < 8 ||
                peerKey.length < 8 ||
                status === 'connecting' ||
                status === 'connected'
              }
            >
              CONNECT
            </button>
            <button className="generate-btn" onClick={generateKey} disabled={status !== 'disconnected'}>
              GENERATE KEY
            </button>
          </div>

          {message && <p className="info" style={{ marginTop: '1rem' }}>{message}</p>}

          <div className="info">
            <p>Keys must be at least 8 characters.</p>
            <p className="warning">This uses simple-peer and WebSocket signaling server.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
