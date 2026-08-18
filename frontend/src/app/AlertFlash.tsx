"use client";

import { useState, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';

export default function AlertFlash() {
  const [isFlashing, setIsFlashing] = useState(false);
  const lastAlertId = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkAlerts = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/alerts/');
        const data = await res.json();
        
        if (data.length > 0) {
          const latestAlert = data[0];
          
          // Check if it's a high-risk alert AND a new one we haven't seen
          if (latestAlert.risk_score > 50 && latestAlert.id !== lastAlertId.current) {
            // If it's the very first load, just record the ID so it doesn't flash on startup
            if (lastAlertId.current !== null) {
              triggerFlash();
            }
            lastAlertId.current = latestAlert.id;
          } else if (latestAlert.id !== lastAlertId.current) {
            // Update the ID if it's a normal alert so we don't trigger later
            lastAlertId.current = latestAlert.id;
          }
        }
      } catch (error) {
        console.error("Flash check error:", error);
      }
    };

    // Check immediately, then every 3 seconds
    checkAlerts();
    const interval = setInterval(checkAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerFlash = () => {
    setIsFlashing(true);
    // Clear any existing timeout so it resets the 1.5s timer if another attack comes in
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsFlashing(false), 1500);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-300 ${
        isFlashing ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        boxShadow: 'inset 0 0 150px 50px rgba(239, 68, 68, 0.7)', // Red glowing border
        backgroundColor: 'rgba(239, 68, 68, 0.1)' // Very faint red tint over everything
      }}
    />
  );
}