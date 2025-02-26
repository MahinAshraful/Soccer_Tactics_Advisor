'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

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

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedContent, streamedThinking]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamedContent('');
    setStreamedThinking('');

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
        
        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete JSON objects
        const parts = buffer.split('\n');
        buffer = parts.pop() || ''; // Keep the last part if incomplete
        
        // Update the part that processes the data from the stream
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
                
                // If this is the first answer chunk after thinking completes, ensure UI updates immediately
                if (data.data.prioritize_render || data.data.thinking_complete) {
                  // Force a render by calling a state update with a timeout
                  setTimeout(() => {
                    setStreamedContent(prev => prev);
                  }, 0);
                }
              }

              // Update the message in state with different logic based on update type
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                
                // Create new message preserving appropriate fields
                const update: Message = {
                  role: 'assistant',
                  content: (data.data.update_type === 'answer' || data.data.update_type === 'final') 
                    ? data.data.answer 
                    : newMessages[lastIdx].content,
                  thinking: data.data.thinking || newMessages[lastIdx].thinking || '',
                  // Only update confidence score for final updates
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
      
      // Process any remaining buffer
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
    <div className="flex flex-col min-h-screen">
      <nav className="bg-green-700 p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-white text-2xl font-bold text-center">
            Tactical Soccer Coach
          </h1>
        </div>
      </nav>

      <main className="flex-1 container mx-auto p-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-6rem)]">
          <div className="h-[calc(100%-4rem)] overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={index} className="flex items-start gap-2.5 mb-4">
                <div className={`rounded-lg p-3 max-w-[80%] ${
                  message.role === 'assistant' ? 'bg-green-100' : 'bg-blue-100 ml-auto'
                }`}>
                  {message.role === 'user' ? (
                    <div className="text-gray-800">{message.content}</div>
                  ) : (
                    <>
                      {/* Display thinking process in collapsible section */}
                      {(message.thinking || (index === messages.length - 1 && streamedThinking)) && (
                        <details className="mb-2" open={index === messages.length - 1}>
                          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                            View thinking process
                          </summary>
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                            {index === messages.length - 1 && streamedThinking
                              ? streamedThinking
                              : message.thinking || ''}
                          </div>
                        </details>
                      )}
                      
                      {/* Display answer content */}
                      <div className="prose text-gray-800">
                        <ReactMarkdown>
                          {index === messages.length - 1 && streamedContent
                            ? streamedContent
                            : message.content}
                        </ReactMarkdown>
                      </div>
                      
                      {/* Display confidence score when available, regardless of content length */}
                      {message.confidenceScore !== undefined && (
                        <div className="mt-2 text-sm text-gray-600">
                          Confidence: {message.confidenceScore}%
                        </div>
                      )}
                    </>
                  )}
                </div>
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
                className="flex-1 border text-black rounded p-2"
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`bg-green-600 text-white px-4 py-2 rounded ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                }`}
                disabled={isLoading}
              >
                {isLoading ? 'Thinking...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}