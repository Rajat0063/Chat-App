import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare, Zap, Shield, Image as ImageIcon, Users, Palette,
  ArrowRight, Check, Github, Sparkles, Send, Lock, Cpu, Globe,
  CheckCheck, Smile, ChevronDown, ChevronUp, Star, Laptop, Smartphone
} from "lucide-react";
import { THEMES } from "../constants/index.js";
import { useThemeStore } from "../store/useThemeStore.js";

export default function LandingPage() {
  const { theme, setTheme } = useThemeStore();
  
  // Interactive Chat Sandbox State
  const [activeTab, setActiveTab] = useState("direct"); // "direct" | "group" | "media"
  const [demoInput, setDemoInput] = useState("");
  const [demoMessages, setDemoMessages] = useState([
    { id: 1, text: "Hey there! Welcome to Chatty 🚀", sender: "alex", time: "10:42 AM" },
    { id: 2, text: "Is this real-time WebSocket messaging?", sender: "me", time: "10:43 AM" },
    { id: 3, text: "Absolutely! Sub-10ms latency and instant delivery.", sender: "alex", time: "10:43 AM" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  // Feature Tab State
  const [selectedFeatureTab, setSelectedFeatureTab] = useState("messaging");

  const handleSendDemo = (e) => {
    e.preventDefault();
    if (!demoInput.trim()) return;
    
    const userMsg = {
      id: Date.now(),
      text: demoInput,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setDemoMessages(prev => [...prev, userMsg]);
    setDemoInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const botMsg = {
        id: Date.now() + 1,
        text: "That sent instantly! You can test group chats or change themes below ✨",
        sender: "alex",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setDemoMessages(prev => [...prev, botMsg]);
    }, 1200);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const popularThemes = ["light", "dark", "emerald", "synthwave", "cyberpunk", "retro", "dracula", "luxury", "night", "cupcake", "forest", "aqua"];

  return (
    <div className="min-h-screen bg-base-100 text-base-content overflow-x-hidden">
      
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden">
        {/* Decorative Background Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-secondary/15 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold tracking-wide">
                <Sparkles className="size-4 animate-spin text-primary" />
                <span>Next-Gen Realtime Chat Platform</span>
                <span className="badge badge-primary badge-xs">v2.0</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-6xl lg:text-6xl font-black leading-[1.1] tracking-tight">
                Connect instantly. <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                  Chat effortlessly.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base-content/75 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Chatty brings speed, elegance, and security to your daily conversations. 
                Enjoy sub-10ms socket delivery, OTP verification, group channels, and 32 custom themes.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <Link to="/signup" className="btn btn-primary btn-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all gap-2 px-8">
                  Get Started Free <ArrowRight className="size-5" />
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg gap-2">
                  Sign In
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs sm:text-sm text-base-content/70">
                <span className="flex items-center gap-1.5"><Check className="size-4 text-success font-bold" /> Free forever</span>
                <span className="flex items-center gap-1.5"><Check className="size-4 text-success font-bold" /> No credit card needed</span>
                <span className="flex items-center gap-1.5"><Check className="size-4 text-success font-bold" /> End-to-end SSL</span>
              </div>

            </div>

            {/* Right Side: Interactive Live Sandbox */}
            <div className="lg:col-span-6 relative">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-primary via-secondary to-accent rounded-3xl blur-2xl opacity-30 animate-pulse" />
              
              <div className="relative rounded-2xl bg-base-100 border border-base-300 shadow-2xl overflow-hidden">
                
                {/* Sandbox Header */}
                <div className="bg-base-200/90 backdrop-blur px-4 py-3 border-b border-base-300 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="size-3 rounded-full bg-error/80" />
                      <div className="size-3 rounded-full bg-warning/80" />
                      <div className="size-3 rounded-full bg-success/80" />
                    </div>
                    <div className="h-4 w-px bg-base-300 mx-1" />
                    <div className="flex items-center gap-2">
                      <div className="relative size-7 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 right-0 size-2 bg-success rounded-full ring-1 ring-base-100" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-semibold leading-none flex items-center gap-1">
                          Alex Rivera <span className="badge badge-xs badge-ghost">Online</span>
                        </div>
                        <div className="text-[10px] text-base-content/60 leading-tight">Interactive Live Preview</div>
                      </div>
                    </div>
                  </div>

                  {/* Sandbox Navigation Tabs */}
                  <div className="flex items-center gap-1 bg-base-300/50 p-1 rounded-lg text-xs">
                    <button 
                      onClick={() => setActiveTab("direct")} 
                      className={`px-2.5 py-1 rounded-md transition-all ${activeTab === "direct" ? "bg-base-100 font-medium shadow-sm" : "opacity-70 hover:opacity-100"}`}>
                      Direct
                    </button>
                    <button 
                      onClick={() => setActiveTab("group")} 
                      className={`px-2.5 py-1 rounded-md transition-all ${activeTab === "group" ? "bg-base-100 font-medium shadow-sm" : "opacity-70 hover:opacity-100"}`}>
                      Group
                    </button>
                  </div>
                </div>

                {/* Sandbox Body */}
                <div className="p-4 sm:p-5 h-[280px] sm:h-[320px] overflow-y-auto space-y-3 bg-base-100/50">
                  {activeTab === "direct" && (
                    <>
                      {demoMessages.map((m) => (
                        <div key={m.id} className={`chat ${m.sender === "me" ? "chat-end" : "chat-start"}`}>
                          <div className="chat-image avatar">
                            <div className="w-8 rounded-full">
                              <img 
                                src={m.sender === "me" 
                                  ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80" 
                                  : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} 
                                alt="avatar" 
                              />
                            </div>
                          </div>
                          <div className="chat-header text-[10px] opacity-60 mb-1 flex items-center gap-1">
                            {m.time}
                            {m.sender === "me" && <CheckCheck className="size-3 text-primary inline" />}
                          </div>
                          <div className={`chat-bubble text-xs sm:text-sm shadow-sm ${m.sender === "me" ? "chat-bubble-primary" : "bg-base-200 text-base-content"}`}>
                            {m.text}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="chat chat-start">
                          <div className="chat-image avatar">
                            <div className="w-8 rounded-full">
                              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="avatar" />
                            </div>
                          </div>
                          <div className="chat-bubble bg-base-200 text-base-content text-xs flex items-center gap-1 py-2">
                            <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                            <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                            <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === "group" && (
                    <div className="space-y-3">
                      <div className="text-center my-2">
                        <span className="badge badge-sm badge-ghost text-[10px]"># Developers Group Created</span>
                      </div>
                      <div className="chat chat-start">
                        <div className="chat-image avatar"><div className="w-8 rounded-full"><img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80" alt="avatar" /></div></div>
                        <div className="chat-header text-[10px] opacity-60">Marcus • 10:30 AM</div>
                        <div className="chat-bubble bg-base-200 text-xs sm:text-sm">Did you test the new 32 themes update?</div>
                      </div>
                      <div className="chat chat-start">
                        <div className="chat-image avatar"><div className="w-8 rounded-full"><img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="avatar" /></div></div>
                        <div className="chat-header text-[10px] opacity-60">Sophia • 10:31 AM</div>
                        <div className="chat-bubble bg-base-200 text-xs sm:text-sm">Synthwave and Cyberpunk are super crisp! 🔥</div>
                      </div>
                      <div className="chat chat-end">
                        <div className="chat-image avatar"><div className="w-8 rounded-full"><img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80" alt="avatar" /></div></div>
                        <div className="chat-header text-[10px] opacity-60">You • 10:32 AM</div>
                        <div className="chat-bubble chat-bubble-primary text-xs sm:text-sm">Group channels work seamlessly with all members!</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sandbox Footer Form */}
                <form onSubmit={handleSendDemo} className="p-3 border-t border-base-300 bg-base-200/50 flex gap-2 items-center">
                  <input
                    type="text"
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    placeholder="Type a message to test..."
                    className="input input-sm sm:input-md input-bordered flex-1 text-xs sm:text-sm bg-base-100 focus:outline-none"
                  />
                  <button type="submit" className="btn btn-sm sm:btn-md btn-primary gap-1">
                    <Send className="size-4" />
                    <span className="hidden sm:inline text-xs">Send</span>
                  </button>
                </form>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* METRICS & HIGHLIGHTS BANNER */}
      <section className="border-y border-base-300 bg-base-200/50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-primary">&lt; 10ms</div>
              <div className="text-xs sm:text-sm text-base-content/70 font-medium">Socket Delivery Latency</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-secondary">32 Themes</div>
              <div className="text-xs sm:text-sm text-base-content/70 font-medium">Instant UI Customization</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-accent">100% Free</div>
              <div className="text-xs sm:text-sm text-base-content/70 font-medium">Open Source Engine</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-success">OTP Guard</div>
              <div className="text-xs sm:text-sm text-base-content/70 font-medium">Email Verification Security</div>
            </div>
          </div>
        </div>
      </section>

      {/* BENTO GRID FEATURE SHOWCASE */}
      <section className="py-20 bg-base-100">
        <div className="container mx-auto px-4 max-w-7xl">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="badge badge-primary badge-outline text-xs font-semibold">FEATURES</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Built for modern communication</h2>
            <p className="text-base-content/70 text-sm sm:text-base">
              Everything you need for private 1-on-1 chats and vibrant group channels packed into one responsive app.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Realtime Socket Engine */}
            <div className="md:col-span-2 bg-base-200/60 border border-base-300 rounded-3xl p-8 hover:border-primary/50 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Zap className="size-6" />
                </div>
                <h3 className="text-2xl font-bold">Realtime Socket.io Core</h3>
                <p className="text-base-content/70 text-sm leading-relaxed max-w-xl">
                  Messages broadcast instantaneously without page refreshes. Track live online/offline presence, typing statuses, and read state seamlessly.
                </p>
              </div>

              {/* Graphic element */}
              <div className="mt-8 bg-base-100 rounded-2xl p-4 border border-base-300 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="size-3 rounded-full bg-success animate-ping" />
                    <div className="size-3 rounded-full bg-success absolute inset-0" />
                  </div>
                  <span className="text-xs font-semibold">Websocket Stream Connected</span>
                </div>
                <span className="badge badge-sm badge-success text-[10px] font-bold">Active Node</span>
              </div>
            </div>

            {/* Bento Card 2: Group Channels */}
            <div className="bg-base-200/60 border border-base-300 rounded-3xl p-8 hover:border-secondary/50 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="size-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                  <Users className="size-6" />
                </div>
                <h3 className="text-2xl font-bold">Group Channels</h3>
                <p className="text-base-content/70 text-sm leading-relaxed">
                  Create custom groups, invite contacts, set channel avatars, and chat with team members in unified channels.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-2">
                <div className="avatar-group -space-x-4 rtl:space-x-reverse">
                  <div className="avatar size-9"><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="" /></div>
                  <div className="avatar size-9"><img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80" alt="" /></div>
                  <div className="avatar size-9"><img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80" alt="" /></div>
                  <div className="avatar placeholder size-9 bg-neutral text-neutral-content"><span className="text-xs">+5</span></div>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Security & Auth */}
            <div className="bg-base-200/60 border border-base-300 rounded-3xl p-8 hover:border-accent/50 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="size-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                  <Shield className="size-6" />
                </div>
                <h3 className="text-2xl font-bold">OTP Email Guard</h3>
                <p className="text-base-content/70 text-sm leading-relaxed">
                  Protected with JWT httpOnly cookies, bcrypt hashing, and 6-digit email OTP verification codes.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-2 text-xs font-mono bg-base-100 p-3 rounded-xl border border-base-300">
                <Lock className="size-4 text-accent" />
                <span>AUTH_TOKEN: HTTP_ONLY_COOKIE</span>
              </div>
            </div>

            {/* Bento Card 4: Media Sharing & Responsive UI */}
            <div className="md:col-span-2 bg-base-200/60 border border-base-300 rounded-3xl p-8 hover:border-primary/50 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <ImageIcon className="size-6" />
                </div>
                <h3 className="text-2xl font-bold">Rich Image Attachments & Responsive Layout</h3>
                <p className="text-base-content/70 text-sm leading-relaxed max-w-xl">
                  Share screenshots, photos, and memes directly within conversations. Optimized for smooth navigation on mobile, tablet, and desktop monitors.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="h-20 bg-base-100 rounded-xl overflow-hidden border border-base-300 relative group">
                  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80" alt="Sample" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                </div>
                <div className="h-20 bg-base-100 rounded-xl overflow-hidden border border-base-300 relative group">
                  <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80" alt="Sample" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                </div>
                <div className="hidden sm:block h-20 bg-base-100 rounded-xl overflow-hidden border border-base-300 relative group">
                  <img src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&auto=format&fit=crop&q=80" alt="Sample" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* LIVE THEME PLAYGROUND */}
      <section className="py-20 bg-base-200/40 border-y border-base-300">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="badge badge-secondary badge-outline text-xs font-semibold">PERSONALIZATION</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Try 32 Themes in Real Time</h2>
            <p className="text-base-content/70 text-sm sm:text-base">
              Click any theme below to instantly transform the entire Chatty landing page interface right now!
            </p>
          </div>

          {/* Theme Buttons Grid */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto mb-10">
            {popularThemes.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`btn btn-sm gap-2 capitalize transition-all ${theme === t ? "btn-primary ring-2 ring-primary ring-offset-2 ring-offset-base-100" : "btn-ghost bg-base-100"}`}
                data-theme={t}
              >
                <span className="size-2 rounded-full bg-primary" />
                {t}
                {theme === t && <Check className="size-3 text-primary-content" />}
              </button>
            ))}
          </div>

          {/* Live Preview Card */}
          <div className="max-w-xl mx-auto bg-base-100 border border-base-300 rounded-2xl shadow-xl p-6" data-theme={theme}>
            <div className="flex items-center justify-between pb-4 border-b border-base-300 mb-4">
              <div className="flex items-center gap-2">
                <Palette className="size-5 text-primary" />
                <span className="font-bold text-sm">Active Theme: <span className="capitalize text-primary">{theme}</span></span>
              </div>
              <span className="badge badge-accent badge-sm">Live Preview</span>
            </div>

            <div className="space-y-3">
              <div className="chat chat-start">
                <div className="chat-bubble text-xs">How does this theme look on Chatty?</div>
              </div>
              <div className="chat chat-end">
                <div className="chat-bubble chat-bubble-primary text-xs">It looks vibrant and fits my mood! ✨</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-base-300 flex items-center justify-between text-xs">
              <button className="btn btn-xs btn-primary">Primary Action</button>
              <button className="btn btn-xs btn-secondary">Secondary</button>
              <button className="btn btn-xs btn-accent">Accent</button>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 bg-base-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="badge badge-accent badge-outline text-xs font-semibold">GET STARTED</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Up and chatting in 3 minutes</h2>
            <p className="text-base-content/70 text-sm">Simple setup designed for effortless onboarding.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="relative bg-base-200/50 border border-base-300 rounded-3xl p-8 space-y-4 hover:-translate-y-1 transition-all">
              <div className="size-14 rounded-2xl bg-primary text-primary-content font-black text-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                01
              </div>
              <h3 className="text-xl font-bold">Sign Up & Verify OTP</h3>
              <p className="text-base-content/70 text-sm leading-relaxed">
                Enter your name and email address. Receive a 6-digit verification code directly in your email inbox to secure your profile.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-base-200/50 border border-base-300 rounded-3xl p-8 space-y-4 hover:-translate-y-1 transition-all">
              <div className="size-14 rounded-2xl bg-secondary text-secondary-content font-black text-2xl flex items-center justify-center shadow-lg shadow-secondary/20">
                02
              </div>
              <h3 className="text-xl font-bold">Customize Profile & Theme</h3>
              <p className="text-base-content/70 text-sm leading-relaxed">
                Upload your avatar, pick your favorite among 32 DaisyUI color schemes, and view live contact lists in real time.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-base-200/50 border border-base-300 rounded-3xl p-8 space-y-4 hover:-translate-y-1 transition-all">
              <div className="size-14 rounded-2xl bg-accent text-accent-content font-black text-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                03
              </div>
              <h3 className="text-xl font-bold">Start Chatting & Grouping</h3>
              <p className="text-base-content/70 text-sm leading-relaxed">
                Select online contacts for direct messages or create custom group channels to collaborate with friends and team members.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* USER REVIEWS / TESTIMONIALS */}
      <section className="py-20 bg-base-200/30 border-t border-base-300">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="badge badge-primary badge-outline text-xs font-semibold">COMMUNITY FEEDBACK</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Loved by developers & friends</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            <div className="bg-base-100 p-6 rounded-2xl border border-base-300 space-y-4 shadow-sm">
              <div className="flex gap-1 text-warning">
                {[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-warning" />)}
              </div>
              <p className="text-sm text-base-content/80 leading-relaxed">
                "The socket connection is ridiculously fast! I love switching themes on the fly, and group messages work flawlessly."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="" className="size-10 rounded-full object-cover" />
                <div>
                  <div className="text-xs font-bold">Elena Rostova</div>
                  <div className="text-[10px] text-base-content/60">Frontend Lead</div>
                </div>
              </div>
            </div>

            <div className="bg-base-100 p-6 rounded-2xl border border-base-300 space-y-4 shadow-sm">
              <div className="flex gap-1 text-warning">
                {[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-warning" />)}
              </div>
              <p className="text-sm text-base-content/80 leading-relaxed">
                "The email OTP code feature adds real security peace of mind. Setting up a group channel took under 10 seconds."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="" className="size-10 rounded-full object-cover" />
                <div>
                  <div className="text-xs font-bold">David Chen</div>
                  <div className="text-[10px] text-base-content/60">Full-Stack Engineer</div>
                </div>
              </div>
            </div>

            <div className="bg-base-100 p-6 rounded-2xl border border-base-300 space-y-4 shadow-sm">
              <div className="flex gap-1 text-warning">
                {[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-warning" />)}
              </div>
              <p className="text-sm text-base-content/80 leading-relaxed">
                "Super clean UI! Works smoothly on mobile browsers and desktop without weird glitches or delays."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="" className="size-10 rounded-full object-cover" />
                <div>
                  <div className="text-xs font-bold">Sarah Jenkins</div>
                  <div className="text-[10px] text-base-content/60">Product Designer</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 bg-base-100">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-base-content/70 text-sm">Have questions before joining? We've got answers.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is Chatty completely free to use?",
                a: "Yes! Chatty is free to use. You can create an account, initiate unlimited direct messages, and build group channels without fees."
              },
              {
                q: "How does OTP email verification work?",
                a: "When you sign up or request a password reset, a 6-digit verification code is instantly emailed to your inbox. Entering this code verifies ownership of your email address."
              },
              {
                q: "Can I customize the visual theme?",
                a: "Yes! Chatty includes 32 DaisyUI themes (from Dark, Light, Cyberpunk, Synthwave to Retro, Emerald, and Dracula). You can select your favorite from Settings or directly on this page!"
              },
              {
                q: "Can I share images and photos in chat?",
                a: "Absolutely. You can attach images up to 4MB directly into direct or group chats. They render in real time with high visual quality."
              }
            ].map((faq, i) => (
              <div key={i} className="border border-base-300 rounded-2xl bg-base-200/40 overflow-hidden">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full p-5 text-left font-semibold text-sm sm:text-base flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="size-5 text-primary shrink-0" /> : <ChevronDown className="size-5 text-base-content/50 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="p-5 pt-0 text-xs sm:text-sm text-base-content/70 border-t border-base-300/50 bg-base-100/50 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-16 container mx-auto px-4 max-w-7xl">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary via-secondary to-accent text-primary-content p-10 sm:p-16 text-center shadow-2xl">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black leading-tight">
              Ready to experience instant chat?
            </h2>
            <p className="text-sm sm:text-lg opacity-90 leading-relaxed">
              Join thousands of users connecting seamlessly. Create your account in seconds and start conversing.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="btn btn-neutral btn-lg gap-2 shadow-xl hover:scale-105 transition-all">
                Create Free Account <ArrowRight className="size-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-base-300 bg-base-200/40 py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <MessageSquare className="size-5 text-primary" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight">Chatty</span>
                <p className="text-xs text-base-content/60">Realtime messaging app built with React, Socket.io & Tailwind CSS.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-success bg-success/10 px-3 py-1.5 rounded-full border border-success/20">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              <span>All Systems Operational</span>
            </div>

            <div className="text-xs text-base-content/60">
              © {new Date().getFullYear()} Chatty. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
