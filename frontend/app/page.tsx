'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      title: "Tactical Analysis",
      description: "Get expert analysis on soccer formations, game plans, and team strategies.",
      icon: "📊"
    },
    {
      title: "Real-Time Advice",
      description: "Ask questions and receive immediate tactical insights based on validated soccer knowledge.",
      icon: "⚡"
    },
    {
      title: "Training Drills",
      description: "Access a library of training exercises designed to improve specific aspects of your team's performance.",
      icon: "🏃"
    },
    {
      title: "Strategic Planning",
      description: "Plan your approach to upcoming matches with personalized strategy recommendations.",
      icon: "🧠"
    }
  ];

  const testimonials = [
    {
      quote: "This tool has transformed how I prepare my youth team for matches. The tactical insights are spot on!",
      author: "Coach Michael S.",
      role: "Youth Academy Coach"
    },
    {
      quote: "I love how the AI shows its thinking process, helping me understand not just what to do, but why it works.",
      author: "Sarah T.",
      role: "Amateur Team Manager"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-green-700 text-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-green-700 text-2xl">⚽</span>
            </div>
            <span className="text-xl font-bold">Soccer Tactics Advisor</span>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Desktop navigation */}
          <div className="md:flex flex flex-row space-x-8 items-center">
            <a href="#features" className="hover:text-green-200">Features</a>
            <a href="#how-it-works" className="hover:text-green-200">How It Works</a>
  
            <Link href="/home" className="bg-white text-green-700 px-4 py-2 rounded-md font-medium hover:bg-green-100 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-green-800 px-4 py-2">
            <a href="#features" className="block py-2 hover:text-green-200" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block py-2 hover:text-green-200" onClick={() => setIsMenuOpen(false)}>How It Works</a>
            <Link href="/home" className="block mt-2 bg-white text-green-700 px-4 py-2 rounded-md font-medium hover:bg-green-100 transition-colors text-center">
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-700 to-green-600 text-white py-20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Elevate Your Soccer Strategy</h1>
            <p className="text-xl mb-8">Get AI-powered tactical analysis and coaching advice based on expert soccer knowledge.</p>
            <Link href="/home" className="bg-white text-green-700 px-6 py-3 rounded-md font-medium text-lg hover:bg-green-100 transition-colors inline-block">
              Start Your Tactical Journey
            </Link>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md">
              <div className="bg-green-100 rounded-t-md p-3 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">AI</span>
                  </div>
                  <p className="text-green-800 font-medium">Tactical Soccer Coach</p>
                </div>
              </div>
              <div className="p-3">
                <div className="bg-green-100 rounded-lg p-3 mb-3 max-w-[80%]">
                  <p className="text-gray-800">How should I set up my team against opponents who play a high pressing game?</p>
                </div>
                <div className="bg-blue-100 rounded-lg p-3 ml-auto max-w-[80%]">
                  <p className="text-gray-800">Against a high-pressing team, consider a 4-3-3 formation with quick wingers to exploit the space behind their defense...</p>
                </div>
              </div>
              <div className="p-3 border-t border-gray-200">
                <div className="flex">
                  <input type="text" placeholder="Ask about soccer tactics..." className="flex-1 border rounded-l p-2 text-gray-700" />
                  <button className="bg-green-600 text-white px-4 py-2 rounded-r">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How We Can Help Your Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-green-700">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
              <h3 className="text-xl font-bold mb-3 text-green-700">Ask Your Question</h3>
              <p className="text-gray-600">Type in any tactical problem or scenario you're facing with your team.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
              <h3 className="text-xl font-bold mb-3 text-green-700">AI Analysis</h3>
              <p className="text-gray-600">Our AI analyzes your question against expert soccer knowledge and tactical principles.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
              <h3 className="text-xl font-bold mb-3 text-green-700">Get Actionable Advice</h3>
              <p className="text-gray-600">Receive detailed tactical recommendations you can implement immediately.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Ready to Transform Your Team's Performance?</h2>
          <p className="text-xl mb-8 text-gray-600 max-w-3xl mx-auto">Join coaches worldwide who are using Soccer Tactics Advisor to gain a competitive edge.</p>
          <Link href="/home" className="bg-green-700 text-white px-8 py-4 rounded-md font-medium text-lg hover:bg-green-800 transition-colors inline-block">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center justify-center md:justify-start">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2">
                  <span className="text-green-700 text-lg">⚽</span>
                </div>
                <span className="text-lg font-bold">Soccer Tactics Advisor</span>
              </div>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-green-400">Terms</a>
              <a href="#" className="hover:text-green-400">Privacy</a>
              <a href="#" className="hover:text-green-400">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Soccer Tactics Advisor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}