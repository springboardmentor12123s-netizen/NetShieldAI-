"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "./auth-provider";

interface WebSocketContextType {
    isConnected: boolean;
    subscribe: (channel: string, callback: (data: any) => void) => () => void;
    send: (channel: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const listenersRef = useRef<{ [channel: string]: Set<(data: any) => void> }>({});
    const reconnectTimeoutRef = useRef<any>(null);

    const { isAuthenticated } = useAuth();
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/alerts";

    const connect = useCallback(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem("netshield_access_token") : null;
        if (!token) {
            console.log("WebSocket connect skipped: user not authenticated");
            return;
        }

        try {
            const wsUrlWithToken = `${WS_URL}?token=${token}`;
            console.log("Connecting WebSocket to:", WS_URL);
            const ws = new WebSocket(wsUrlWithToken);
            socketRef.current = ws;

            ws.onopen = () => {
                console.log("WebSocket connected");
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);

                    // Fallback to "security_alerts" channel if target channel not explicitly provided
                    let channel = payload.channel;
                    let data = payload.data;

                    if (channel === undefined) {
                        // If it's a raw alert payload from the backend alerts channel, map to security_alerts
                        if (payload.severity || payload.message || payload.event === "threat") {
                            channel = "security_alerts";
                            data = payload;
                        } else if (payload.event === "new_traffic_batch" || payload.data) {
                            channel = "traffic";
                            data = payload.data || payload;
                        } else {
                            channel = "security_alerts";
                            data = payload;
                        }
                    }

                    if (channel && listenersRef.current[channel]) {
                        listenersRef.current[channel].forEach((cb) => cb(data));
                    }
                } catch (e) {
                    console.warn("Failed to parse WebSocket message:", event.data, e);
                }
            };

            ws.onclose = (event) => {
                console.log(`WebSocket closed: code=${event.code}, reason=${event.reason}`);
                setIsConnected(false);
                socketRef.current = null;

                // Reconnect if still authenticated (not logged out)
                if (typeof window !== 'undefined' && localStorage.getItem("netshield_access_token")) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, 3000);
                }
            };

            ws.onerror = (error) => {
                console.warn("WebSocket error:", error);
            };
        } catch (e) {
            console.warn("WebSocket connection initiation failed:", e);
        }
    }, [WS_URL]);

    useEffect(() => {
        if (isAuthenticated) {
            connect();
        } else {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            setIsConnected(false);
        }

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [connect, isAuthenticated]);

    const subscribe = useCallback((channel: string, callback: (data: any) => void) => {
        if (!listenersRef.current[channel]) {
            listenersRef.current[channel] = new Set();
        }
        listenersRef.current[channel].add(callback);

        // Return unsubscribe function
        return () => {
            if (listenersRef.current[channel]) {
                listenersRef.current[channel].delete(callback);
                if (listenersRef.current[channel].size === 0) {
                    delete listenersRef.current[channel];
                }
            }
        };
    }, []);

    const send = useCallback((channel: string, data: any) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ channel, data }));
        } else {
            console.warn("Cannot send message, WebSocket not connected");
        }
    }, []);

    const value = {
        isConnected,
        subscribe,
        send,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket(channel?: string, callback?: (data: any) => void) {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    }

    useEffect(() => {
        if (!channel || !callback) return;
        const unsubscribe = context.subscribe(channel, callback);
        return () => {
            unsubscribe();
        };
    }, [channel, callback, context]);

    return context;
}
