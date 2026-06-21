'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MessageSquare, Mic, Send, Edit2, Trash2, Check,
  Plus, Loader2, Sparkles, AlertCircle, RotateCcw, Bot
} from 'lucide-react';
import { calculateCo2e } from '@/lib/emissionFactors';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text?: string;
  parsedData?: any;
  isTyping?: boolean;
  usedFallback?: boolean;
}

export default function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const { logActivity, loading: appLoading } = useApp();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Multi-turn conversation state
  const [chatHistory, setChatHistory] = useState<any[]>([]); // Gemini history [{role, parts}]
  const [messages, setMessages] = useState<ChatMessage[]>([]); // UI messages
  const [pendingParsedData, setPendingParsedData] = useState<any | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editUnit, setEditUnit] = useState('');

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap and keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!drawerRef.current) return;
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const elements = Array.from(focusableElements).filter(el => !el.hasAttribute('disabled'));
        if (elements.length === 0) return;

        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === drawerRef.current) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      // Automatically focus the input field when the drawer opens
      setTimeout(() => {
        const input = drawerRef.current?.querySelector('input[type="text"]') as HTMLElement;
        input?.focus();
      }, 100);
    } else {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Reset conversation when drawer opens fresh
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setChatHistory([]);
      setPendingParsedData(null);
    }
  }, [isOpen]);

  // Speech recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onstart = () => setIsRecording(true);
        rec.onend = () => setIsRecording(false);
        rec.onresult = (e: any) => {
          let transcript = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            transcript += e.results[i][0].transcript;
          }
          setInputText(transcript);
        };
        rec.onerror = (e: any) => {
          console.error('Speech recognition error', e);
          setIsRecording(false);
        };
        recognitionRef.current = rec;
      }
    }
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please try Chrome or Safari.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleResetConversation = () => {
    setChatHistory([]);
    setMessages([]);
    setPendingParsedData(null);
    setInputText('');
  };

  const handleSubmitText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userText = inputText.trim();
    setInputText('');
    setLoading(true);

    // Add user message to UI
    const userMsgId = Date.now().toString();
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', text: userText }
    ]);

    try {
      // Send with full conversation history for multi-turn context
      const res = await fetch('/api/parse-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: userText, history: chatHistory })
      });
      const data = await res.json();

      // Update Gemini history for next turn
      if (data.updatedHistory) {
        setChatHistory(data.updatedHistory);
      }

      const botMsgId = (Date.now() + 1).toString();

      if (data.clarificationNeeded) {
        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            role: 'bot',
            text: data.clarificationQuestion,
            usedFallback: data.usedFallback
          }
        ]);
        setPendingParsedData(null);
      } else if (data.activities && data.activities.length > 0) {
        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            role: 'bot',
            parsedData: {
              activities: data.activities,
              totalCo2eKg: data.totalCo2eKg
            },
            usedFallback: data.usedFallback
          }
        ]);
        setPendingParsedData({
          activities: data.activities,
          totalCo2eKg: data.totalCo2eKg
        });
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            role: 'bot',
            text: "I couldn't find any carbon activities in that message. Try describing what transport you used, what you ate, or your energy usage today!"
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: 'Something went wrong. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLog = async () => {
    if (!pendingParsedData || !pendingParsedData.activities) return;

    setLoading(true);
    try {
      const res = await logActivity(
        messages.filter(m => m.role === 'user').map(m => m.text).join(' | '),
        pendingParsedData.activities
      );
      if (res && res.success) {
        const pointsMsg = `Logged! You earned **+${res.pointsEarned} Eco-Points**${
          res.achievementsUnlocked?.length > 0
            ? `. Achievement unlocked: ${res.achievementsUnlocked.join(', ')}!`
            : '.'
        }`;

        setMessages(prev => [
          ...prev,
          { id: Date.now().toString(), role: 'bot', text: pointsMsg }
        ]);
        setPendingParsedData(null);

        // Close after brief delay to show success message
        setTimeout(() => {
          onClose();
          setMessages([]);
          setChatHistory([]);
        }, 2000);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'bot',
            text: 'Failed to save your log. Please try again.'
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditActivity = (index: number) => {
    const act = pendingParsedData.activities[index];
    setEditingIndex(index);
    setEditQty(String(act.quantity));
    setEditUnit(act.unit);
  };

  const handleSaveEdit = (index: number) => {
    const qty = parseFloat(editQty);
    if (isNaN(qty) || qty <= 0) return;
    const act = pendingParsedData.activities[index];
    const newCo2 = calculateCo2e(act.category, act.subcategory, qty, editUnit);
    const updatedActs = [...pendingParsedData.activities];
    updatedActs[index] = { ...act, quantity: qty, unit: editUnit, co2eKg: parseFloat(newCo2.toFixed(3)) };
    setPendingParsedData({ ...pendingParsedData, activities: updatedActs });
    // Update the last bot message that has parsedData
    setMessages(prev => prev.map(m =>
      m.parsedData
        ? { ...m, parsedData: { ...pendingParsedData, activities: updatedActs } }
        : m
    ));
    setEditingIndex(null);
  };

  const handleDeleteActivity = (index: number) => {
    const updatedActs = pendingParsedData.activities.filter((_: any, i: number) => i !== index);
    const updatedData = { ...pendingParsedData, activities: updatedActs };
    setPendingParsedData(updatedData);
    setMessages(prev => prev.map(m =>
      m.parsedData ? { ...m, parsedData: updatedData } : m
    ));
  };

  const handleAddManualActivity = () => {
    const defaultAct = {
      category: 'food',
      subcategory: 'vegetarian',
      description: 'Vegetarian meal (added)',
      quantity: 1,
      unit: 'meal',
      confidence: 1.0,
      co2eKg: 0.84
    };
    const currentActs = pendingParsedData?.activities || [];
    const updatedData = { ...pendingParsedData, activities: [...currentActs, defaultAct] };
    setPendingParsedData(updatedData);
    setMessages(prev => prev.map(m =>
      m.parsedData ? { ...m, parsedData: updatedData } : m
    ));
    setEditingIndex(currentActs.length);
    setEditQty('1');
    setEditUnit('meal');
  };

  // Category styles handled by .badge-{category} CSS classes

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 backdrop-blur-sm z-50 pointer-events-auto"
            style={{ background: 'rgba(5,13,26,0.75)' }}
          />

          {/* Drawer Sheet */}
          <motion.aside
            ref={drawerRef}
            tabIndex={-1}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto rounded-t-2xl shadow-2xl z-50 flex flex-col pointer-events-auto outline-none"
            style={{ maxHeight: '88vh', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderBottom: 'none' }}
          >
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent-blue)' }}>
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>EcoBot Logger</h2>
                  <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Gemini 2.0 · Multi-turn context</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button onClick={handleResetConversation} aria-label="Reset conversation" className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }} title="New conversation">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={onClose} aria-label="Close chat" className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Chat Body */}
            <main ref={chatBodyRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
              {/* Bot greeting */}
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0"
                  style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(56,189,248,0.25)' }}>AI</div>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none text-xs leading-relaxed max-w-[88%]"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  Hey! Tell me what you did today — I'apos;ll figure out the carbon footprint. Try:
                  <span className="italic" style={{ color: 'var(--accent-blue)' }}> &quot;Drove 15 km and had beef for dinner.&quot;</span>
                </div>
              </div>

              {/* Conversation messages */}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {msg.role === 'bot' && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0"
                      style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(56,189,248,0.25)' }}>AI</div>
                  )}

                  <div className={`max-w-[88%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                    {/* User message bubble */}
                    {msg.role === 'user' && msg.text && (
                      <div className="px-3.5 py-2.5 rounded-2xl rounded-tr-none text-xs leading-relaxed"
                        style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: 'var(--text-primary)' }}>
                        {msg.text}
                      </div>
                    )}

                    {/* Bot text message */}
                    {msg.role === 'bot' && msg.text && (
                      <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none text-xs leading-relaxed"
                        style={{
                          background: msg.text.includes('Logged!') ? 'rgba(34,197,94,0.08)' : 'var(--bg-elevated)',
                          border: `1px solid ${msg.text.includes('Logged!') ? 'rgba(34,197,94,0.2)' : 'var(--border-subtle)'}`,
                          color: msg.text.includes('Logged!') ? 'var(--accent-green)' : 'var(--text-secondary)'
                        }}>
                        {msg.text.startsWith('I couldn') || msg.text.includes('Could you') ? (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--accent-amber)' }} />
                            <span style={{ color: 'var(--accent-amber)' }}>{msg.text}</span>
                          </div>
                        ) : msg.text}
                        {msg.usedFallback && (
                          <span className="block mt-1 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>via rule-based fallback</span>
                        )}
                      </div>
                    )}

                    {/* Bot parsed activities */}
                    {msg.role === 'bot' && msg.parsedData && (
                      <div className="space-y-2 w-full">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          <Sparkles className="w-3 h-3" style={{ color: 'var(--accent-blue)' }} />
                          {msg.parsedData.activities.length} activit{msg.parsedData.activities.length === 1 ? 'y' : 'ies'} · {msg.parsedData.totalCo2eKg?.toFixed(2)} kg CO2e
                        </div>
                        {msg.parsedData.activities.map((act: any, index: number) => {
                          const isEditing = editingIndex === index;
                          return (
                            <div key={index} className="rounded-xl p-3 flex flex-col gap-2"
                              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                              <div className="flex items-center justify-between">
                                <span className={`badge badge-${act.category}`}>{act.category}</span>
                                <span className="text-xs font-bold font-mono" style={{ color: 'var(--accent-blue)' }}>{act.co2eKg} kg</span>
                              </div>
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <input type="number" aria-label="Quantity" value={editQty} onChange={e => setEditQty(e.target.value)} className="input w-16 py-1 px-2 text-xs" />
                                  <select aria-label="Unit" value={editUnit} onChange={e => setEditUnit(e.target.value)} className="input py-1 px-2 text-xs">
                                    {['km','meal','kWh','liters','kg','usd','hours'].map(u => <option key={u} value={u}>{u}</option>)}
                                  </select>
                                  <button onClick={() => handleSaveEdit(index)} aria-label="Save edit" className="p-1.5 rounded-lg cursor-pointer" style={{ background: 'var(--accent-blue)', color: '#fff' }}>
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                                    {act.description} <strong style={{ color: 'var(--text-secondary)' }}>({act.quantity} {act.unit})</strong>
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <button onClick={() => handleEditActivity(index)} aria-label="Edit activity" className="p-1 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}><Edit2 className="w-3 h-3" /></button>
                                    <button onClick={() => handleDeleteActivity(index)} aria-label="Delete activity" className="p-1 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--accent-rose)' }}><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {pendingParsedData && (
                          <div className="flex gap-2 pt-1">
                            <button type="button" onClick={handleAddManualActivity} className="btn-ghost flex-1 text-xs py-2 px-3">
                              <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                            <button type="button" onClick={handleConfirmLog} disabled={!pendingParsedData || pendingParsedData.activities.length === 0 || loading} className="btn-primary flex-[2] text-xs py-2" style={{ background: 'var(--accent-blue)' }}>
                              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Log It
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0"
                    style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(56,189,248,0.25)' }}>AI</div>
                  <div className="px-3.5 py-3 rounded-2xl rounded-tl-none flex items-center gap-2.5"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                    <span className="flex gap-1">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <motion.span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-blue)' }}
                          animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.55, delay }} />
                      ))}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Analyzing with Gemini...</span>
                  </div>
                </motion.div>
              )}
            </main>

            {/* Input Form */}
            <form onSubmit={handleSubmitText} className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={isRecording ? 'Listening...' : 'Tell me about your day...'}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="input flex-1 py-3 text-xs"
                  style={{ borderRadius: '0.75rem' }}
                />
                <button type="button" onClick={handleMicClick} aria-label="Toggle speech recognition" className="p-3 rounded-xl shrink-0 transition-all cursor-pointer"
                  style={isRecording
                    ? { background: 'rgba(244,63,94,0.1)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)' }
                    : { background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }
                  }>
                  <Mic className="w-4 h-4" />
                </button>
                <button type="submit" disabled={!inputText.trim() || loading} aria-label="Send message" className="p-3 rounded-xl shrink-0 transition-all cursor-pointer disabled:opacity-40"
                  style={{ background: 'var(--accent-blue)', color: '#fff' }}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {chatHistory.length > 1 && (
                <p className="text-[10px] font-mono text-center mt-2" style={{ color: 'var(--text-muted)' }}>
                  {chatHistory.length / 2} turn{chatHistory.length / 2 !== 1 ? 's' : ''} · EcoBot remembers context
                </p>
              )}
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
