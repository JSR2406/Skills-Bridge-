'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const SAMPLE_TESTS = [
  {
    subject: "Computer Science",
    topic: "Object-Oriented Programming",
    difficulty: "medium",
    durationMinutes: 15,
    createdByAI: false,
    questions: [
      {
        text: "Which of the following is NOT a pillar of Object-Oriented Programming?",
        options: ["Encapsulation", "Polymorphism", "Compilation", "Inheritance"],
        correctIndex: 2,
        explanation: "Compilation is a translation process, not an OOP concept."
      },
      {
        text: "What is polymorphism?",
        options: ["Hiding data", "Many forms", "Protecting methods", "Static typing"],
        correctIndex: 1,
        explanation: "Polymorphism comes from Greek meaning 'many forms', allowing objects of different types to be treated as instances of the same class."
      },
      {
        text: "Which concept allows a class to acquire the properties of another class?",
        options: ["Abstraction", "Inheritance", "Overloading", "Encapsulation"],
        correctIndex: 1,
        explanation: "Inheritance is the mechanism by which one class acquires the properties and runtime behaviors of a parent class."
      }
    ]
  },
  {
    subject: "Web Development",
    topic: "React Core Concepts",
    difficulty: "easy",
    durationMinutes: 10,
    createdByAI: false,
    questions: [
      {
        text: "Which hook is used to manage state in functional components?",
        options: ["useEffect", "useState", "useContext", "useRef"],
        correctIndex: 1,
        explanation: "useState is the React Hook that lets you add a state variable to your component."
      },
      {
        text: "What does the useEffect hook do?",
        options: ["Performs side effects", "Handles form submittion", "Optimizes rendering", "Mutates the DOM continuously"],
        correctIndex: 0,
        explanation: "useEffect lets you perform side effects in function components, like data fetching and subscriptions."
      }
    ]
  }
];

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateMentor = async () => {
    try {
      setLoading(true);
      const email = 'mentor_' + Math.floor(Math.random() * 1000) + '@skillbridge.com';
      const password = 'mentorpassword123';
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: 'Sample Mentor',
        email: email,
        role: 'mentor',
        reputation: 1500,
        badges: ['expert', 'master', 'top_answerer'],
        streakDays: 45,
        testsCompletedCount: 12,
        createdAt: serverTimestamp()
      });

      // Sign them out so the dev doesn't lose their own session if they want
      await signOut(auth);

      toast.success('Mentor created!', {
        description: `Email: ${email} | Password: ${password}`
      });
      console.log('Mentor Credentials:', { email, password });
    } catch (error: any) {
      toast.error('Error creating mentor', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTests = async () => {
    try {
      setLoading(true);
      for (const test of SAMPLE_TESTS) {
        await addDoc(collection(db, 'tests'), {
          ...test,
          createdAt: serverTimestamp()
        });
      }
      toast.success('Sample tests seeded successfully!');
      router.push('/tests');
    } catch (error: any) {
      toast.error('Error seeding tests', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 pt-20">
      <Card className="bg-surface-card border-border">
        <CardHeader>
          <CardTitle>Developer Seed Tools</CardTitle>
          <CardDescription>Quickly generate sample data for testing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-border rounded-lg bg-surface">
            <h3 className="font-bold mb-2">1. Generate Sample Mentor</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Creates a new Firebase Auth user with the "mentor" role and logs credentials to the console and a toast message.
            </p>
            <Button onClick={handleCreateMentor} disabled={loading} className="w-full">
              Create Mentor Account
            </Button>
          </div>

          <div className="p-4 border border-border rounded-lg bg-surface">
            <h3 className="font-bold mb-2">2. Seed Practice Tests</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generates static sample tests (React, CS OOP) for students to attempt. The timer and UI will automatically handle these.
            </p>
            <Button onClick={handleCreateTests} disabled={loading} variant="secondary" className="w-full">
              Seed Practice Tests
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
