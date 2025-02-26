'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  thinking?: string;
  confidenceScore?: number;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your tactical soccer assistant. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [streamedThinking, setStreamedThinking] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userScrollingRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Modified auto-scroll to respect user scrolling
  useEffect(() => {
    if (!userScrollingRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Add separate effect for streaming content updates with throttling
  useEffect(() => {
    if (!userScrollingRef.current && messagesEndRef.current && isLoading) {
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [streamedContent, streamedThinking, isLoading]);

  // Add scroll event listeners
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    
    const handleScroll = () => {
      if (!scrollContainer) return;
      
      // Calculate if we're near the bottom (within 100px)
      const isAtBottom = 
        scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
      
      // Update userScrolling state based on position
      userScrollingRef.current = !isAtBottom;
    };

    const handleTouchStart = () => {
      userScrollingRef.current = true;
    };

    const handleScrollEnd = () => {
      // Reset after short delay to allow checking if we're at bottom
      setTimeout(() => {
        if (!scrollContainer) return;
        
        const isAtBottom = 
          scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
        
        if (isAtBottom) {
          userScrollingRef.current = false;
        }
      }, 100);
    };

    // Add event listeners
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      scrollContainer.addEventListener('touchstart', handleTouchStart);
      scrollContainer.addEventListener('scrollend', handleScrollEnd);
      scrollContainer.addEventListener('touchend', handleScrollEnd);
    }

    return () => {
      // Clean up
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
        scrollContainer.removeEventListener('touchstart', handleTouchStart);
        scrollContainer.removeEventListener('scrollend', handleScrollEnd);
        scrollContainer.removeEventListener('touchend', handleScrollEnd);
      }
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamedContent('');
    setStreamedThinking('');
    userScrollingRef.current = false;

    // Create temporary message for streaming
    const tempMessage: Message = {
      role: 'assistant',
      content: '',
      thinking: ''
    };
    setMessages(prev => [...prev, tempMessage]);

    let abortController = new AbortController();
    try {
      const response = await fetch('http://127.0.0.1:5000/api/tactics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
        signal: abortController.signal
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const parts = buffer.split('\n');
        buffer = parts.pop() || '';
        
        for (const part of parts) {
          if (!part.trim()) continue;
          
          try {
            const data = JSON.parse(part);
            
            if (data.status === 'success') {
              // Always update thinking when it's available
              if (data.data.thinking) {
                setStreamedThinking(data.data.thinking);
              }
              
              // Update answer content
              if ((data.data.update_type === 'answer' || data.data.update_type === 'final') && data.data.answer) {
                setStreamedContent(data.data.answer);
                
                if (data.data.prioritize_render || data.data.thinking_complete) {
                  setTimeout(() => {
                    setStreamedContent(prev => prev);
                  }, 0);
                }
              }

              setMessages(prev => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                
                const update: Message = {
                  role: 'assistant',
                  content: (data.data.update_type === 'answer' || data.data.update_type === 'final') 
                    ? data.data.answer 
                    : newMessages[lastIdx].content,
                  thinking: data.data.thinking || newMessages[lastIdx].thinking || '',
                  confidenceScore: data.data.update_type === 'final'
                    ? data.data.accuracy_score 
                    : newMessages[lastIdx].confidenceScore
                };
                
                newMessages[lastIdx] = update;
                return newMessages;
              });
            }
          } catch (e) {
            console.error("Error parsing JSON:", e, part);
          }
        }
      }
      
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer);
          if (data.status === 'success') {
            setStreamedThinking(data.data.thinking || '');
            setStreamedContent(data.data.answer || '');
            
            setMessages(prev => {
              const newMessages = [...prev];
              const lastIdx = newMessages.length - 1;
              newMessages[lastIdx] = {
                role: 'assistant',
                content: data.data.answer || '',
                thinking: data.data.thinking || '',
                confidenceScore: data.data.accuracy_score
              };
              return newMessages;
            });
          }
        } catch (e) {
          console.error("Error parsing final JSON:", e);
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.log(error);
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        };
        setMessages(prev => [...prev.slice(0, -1), errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <nav className="bg-green-700 p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-2">
                <span className="text-green-700 text-2xl">⚽</span>
              </div>
              <h1 className="text-white text-xl md:text-2xl font-bold hidden md:block">
                Tactical Soccer Coach
              </h1>
              <h1 className="text-white text-xl md:text-2xl font-bold md:hidden">
                Coach
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/" className="bg-white text-green-700 px-4 py-2 rounded-md font-medium hover:bg-green-100 transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Home
            </Link>
            <button 
              onClick={() => setMessages([{
                role: 'assistant',
                content: "Hello! I'm your tactical soccer assistant. How can I help you today?"
              }])}
              className="bg-green-600 hover:bg-green-800 text-white px-3 py-2 rounded-md transition-colors"
              title="Start New Conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 container mx-auto p-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg h-[calc(100vh-7rem)] border border-gray-200">
          <div 
            ref={scrollContainerRef}
            className="h-[calc(100%-5rem)] overflow-y-auto p-4 md:p-6"
          >
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-2.5 mb-6 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">AI</span>
                  </div>
                )}
                
                <div className={`rounded-2xl p-4 ${
                  message.role === 'assistant' 
                    ? 'bg-green-50 border border-green-100 shadow-sm max-w-[85%]' 
                    : 'bg-blue-50 border border-blue-100 shadow-sm max-w-[85%]'
                }`}>
                  {message.role === 'user' ? (
                    <div className="text-gray-800">{message.content}</div>
                  ) : (
                    <>
                      {/* Display thinking process in collapsible section */}
                      {(message.thinking || (index === messages.length - 1 && streamedThinking)) && (
                        <div className="mb-3 bg-white rounded-lg border border-gray-100">
                          <details className="group" id={`thinking-details-${index}`} open={index === messages.length - 1}>
                            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 p-3 flex items-center justify-between">
                              <span className="font-medium flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                View thinking process
                              </span>
                              <svg className="w-5 h-5 group-open:rotate-180 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </summary>
                            <div className="p-3 pt-0 border-t border-gray-100">
                              <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 font-mono whitespace-pre-wrap">
                                {index === messages.length - 1 && streamedThinking
                                  ? streamedThinking
                                  : message.thinking || ''}
                              </div>
                              <button 
                                onClick={() => {
                                  const details = document.getElementById(`thinking-details-${index}`);
                                  if (details && details instanceof HTMLDetailsElement) {
                                    details.open = false;
                                  }
                                }}
                                className="mt-2 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded text-xs font-medium w-full flex items-center justify-center transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                                Collapse thinking
                              </button>
                            </div>
                          </details>
                        </div>
                      )}
                      
                      {/* Display answer content */}
                      <div className="prose prose-green max-w-none text-gray-800">
                        <ReactMarkdown>
                          {index === messages.length - 1 && streamedContent
                            ? streamedContent
                            : message.content}
                        </ReactMarkdown>
                      </div>
                      
                      {/* Display confidence score with visual indicator */}
                      {message.confidenceScore !== undefined && (
                        <div className="mt-4 flex items-center">
                          <span className="text-sm text-gray-600 mr-2">Confidence:</span>
                          <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className={`h-2.5 rounded-full ${
                                message.confidenceScore >= 80 ? 'bg-green-500' :
                                message.confidenceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{width: `${message.confidenceScore}%`}}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{message.confidenceScore}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">You</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about soccer tactics..."
                className="flex-1 border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-black rounded-lg p-3 outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`bg-green-600 text-white px-5 py-3 rounded-lg ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                } transition-colors flex items-center justify-center`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Thinking...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Send</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}