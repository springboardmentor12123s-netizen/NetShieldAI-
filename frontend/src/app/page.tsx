"use client";

import { useState } from 'react';
import { Shield, Wifi } from 'lucide-react';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ username: '', password: '' });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    let currentErrors = { username: '', password: '' };
    let isValid = true;

    if (!username.trim()) {
      currentErrors.username = 'Operator ID is required';
      isValid = false;
    }
    if (!password.trim()) {
      currentErrors.password = 'Access key is required';
      isValid = false;
    } else if (password.length < 6) {
      currentErrors.password = 'Access key must be at least 6 characters';
      isValid = false;
    }

    setErrors(currentErrors);

    if (isValid) {
      alert(`Authenticating Operator: ${username}`);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden font-mono p-8 bg-black">
      
      {/* --- VIDEO BACKGROUND --- */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        {/* MAKE SURE YOUR VIDEO FILE IS IN THE 'public' FOLDER AND THE NAME MATCHES */}
        <source src="/cyber-bg.mp4" type="video/mp4" /> 
      </video>
      {/* ------------------------ */}

      {/* Dark overlay to make text readable over the video */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-10"></div>   {/*<div className="absolute inset-0 bg-gradient-to-r from-black/30 to-black/80 z-10"></div>/}

      {/* Main Container: Left Graphic + Right Form */}
      <div className="relative z-20 flex items-center gap-24 max-w-5xl w-full">
        
        {/* LEFT SIDE: Shield and Orbiting Devices */}
        <div className="hidden md:flex flex-1 items-center justify-center relative h-[400px] w-[400px]">
          <div className="relative z-10 p-8 bg-[#0a0a0a]/50 rounded-full border-2 border-blue-500/30 shadow-[0_0_60px_rgba(59,130,246,0.5)]">
            <Shield size={80} className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" strokeWidth={1.5} />
          </div>
          <div className="absolute w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] top-0 left-1/2 -translate-x-1/2"></div>
          <div className="absolute w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)] top-[15%] right-[10%]"></div>
          <div className="absolute w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] top-1/2 right-0 -translate-y-1/2"></div>
          <div className="absolute w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)] bottom-[15%] right-[10%]"></div>
          <div className="absolute w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] bottom-0 left-1/2 -translate-x-1/2"></div>
          <div className="absolute w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)] bottom-[15%] left-[10%]"></div>
          <div className="absolute w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] top-1/2 left-0 -translate-y-1/2"></div>
          <div className="absolute w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)] top-[15%] left-[10%]"></div>
          <div className="absolute w-full h-full border border-blue-500/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
          <div className="absolute w-[80%] h-[80%] border border-cyan-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
        </div>

        {/* RIGHT SIDE: User Login Form */}
        <div className="flex-1 max-w-md">
          <h1 className="text-4xl font-bold text-white tracking-wider mb-2">
            User Login
          </h1>
          <p className="text-gray-500 text-sm mb-8 flex items-center gap-2">
            <Wifi size={14} className="text-green-500" />
            Secure Network Access
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-xs mb-2 tracking-wider uppercase">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter operator ID" 
                className={`w-full bg-[#0a0a0a]/80 border ${errors.username ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'border-gray-700/50'} rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300`}
              />
              {errors.username && <p className="text-red-500 text-xs mt-1 tracking-wide">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-2 tracking-wider uppercase">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access key" 
                className={`w-full bg-[#0a0a0a]/80 border ${errors.password ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'border-gray-700/50'} rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1 tracking-wide">{errors.password}</p>}
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:scale-105 transition-all duration-300 tracking-widest"
            >
              LOGIN
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}