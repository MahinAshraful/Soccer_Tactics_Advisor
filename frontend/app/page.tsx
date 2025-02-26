'use client';
import { useState, FormEvent } from "react";

interface Message {
  role: 'assistant' | 'user';
  content: string;
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/tactics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.data.answer,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
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
        <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-12rem)]">
          <div className="h-[calc(100%-4rem)] overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  <div className={`rounded-lg p-3 max-w-[80%] ${
                    message.role === 'assistant' ? 'bg-green-100' : 'bg-blue-100 ml-auto'
                  }`}>
                    <p className="text-gray-800">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t p-4">
            <form className="flex gap-2" onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about soccer tactics..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 text-black focus:ring-green-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors disabled:bg-green-500"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}