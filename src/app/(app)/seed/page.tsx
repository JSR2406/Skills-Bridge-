'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function SeederPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState('Idle');

  const runSeeder = async () => {
    if (!user) {
      setStatus('Error: You must be logged in to seed data. Log in first.');
      return;
    }

    setStatus('Seeding mentors and mock users...');

    try {
      const dummies = [
        {
          id: 'mentor_alex_123',
          name: 'Alex Rivera',
          avatarUrl: 'https://i.pravatar.cc/150?u=mentor_alex_123',
          college: 'MIT',
          headline: 'Senior Full Stack Engineer @ Google',
          bio: 'I specialize in large-scale Distributed Systems and modern React ecosystems. Happy to help with system design interviews and strict web-development queries.',
          subjects: ['System Design', 'React', 'Node.js'],
          expertise: ['Web Development', 'Architecture'],
          fee: 500,
          averageRating: 4.8,
          totalRatings: 120,
          sessionCount: 230,
          mentorApproved: true,
        },
        {
          id: 'mentor_sarah_456',
          name: 'Sarah Chen',
          avatarUrl: 'https://i.pravatar.cc/150?u=mentor_sarah_456',
          college: 'Stanford',
          headline: 'Machine Learning Researcher @ OpenAI',
          bio: 'Passionate about deep learning and computer vision. Let me help you break into AI and master TensorFlow/PyTorch fundamentals.',
          subjects: ['Machine Learning', 'Python', 'Data Science'],
          expertise: ['AI', 'Data Structures'],
          fee: 800,
          averageRating: 4.9,
          totalRatings: 85,
          sessionCount: 154,
          mentorApproved: true,
        },
        {
          id: 'mentor_james_789',
          name: 'James Walker',
          avatarUrl: 'https://i.pravatar.cc/150?u=mentor_james_789',
          college: 'IIT Bombay',
          headline: 'Lead Cloud Architect @ AWS',
          bio: '10+ years of cloud infrastructure scaling. If your backend needs extreme performance tuning, setup a chat with me.',
          subjects: ['AWS', 'DevOps', 'Go'],
          expertise: ['Cloud Infrasturcture', 'Backend'],
          fee: 650,
          averageRating: 4.7,
          totalRatings: 42,
          sessionCount: 88,
          mentorApproved: true,
        }
      ];

      for (const m of dummies) {
        // Create user doc
        await setDoc(doc(db, 'users', m.id), {
          uid: m.id,
          name: m.name,
          email: `${m.name.split(' ')[0].toLowerCase()}@example.com`,
          avatar: m.avatarUrl,
          reputation: Math.floor(Math.random() * 500) + 100,
          badges: ['mentor'],
          role: 'mentor',
          expertise: m.expertise,
          createdAt: new Date(),
        });

        // Create mentor doc
        await setDoc(doc(db, 'mentors', m.id), {
          ...m,
          userId: m.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      setStatus('Success! 3 Mock Mentors and their user accounts injected into Database. You can navigate back to Mentors page.');
    } catch (error: any) {
      console.error(error);
      setStatus(`Failed: ${error.message}`);
    }
  };

  return (
    <div className="p-20 max-w-2xl mx-auto text-center space-y-6">
      <h1 className="text-3xl font-bold text-white">Database Mock Seeder</h1>
      <p className="text-gray-400">This will inject 3 heavily detailed mentors so you can explore Mentorship mapping, Real-Time Messaging and WebRTC Video Calls natively.</p>
      
      <button 
        onClick={runSeeder}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white shadow-xl transition-all"
      >
        Inject Mock Mentors
      </button>

      <div className="mt-8 p-4 bg-gray-900 rounded-lg text-sm text-green-400 border border-gray-800">
        Status: {status}
      </div>
    </div>
  );
}
