'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getMentorProfile, getMentorSlots, createSessionBooking, confirmBookingPayment } from '@/features/mentors/api';
import { MentorProfile, MentorSlot } from '@/features/mentors/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Star, Video, Clock, IndianRupee, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function MentorProfilePage() {
  const params = useParams() as { id: string };
  const { user, profile } = useAuth();
  const router = useRouter();

  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [slots, setSlots] = useState<MentorSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const mProfile = await getMentorProfile(params.id);
        if (mProfile) {
          setMentor(mProfile);
          const mSlots = await getMentorSlots(params.id);
          setSlots(mSlots);
        }
      } catch (error) {
        console.error('Error loading mentor:', error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.id]);

  const handleBookSlot = async (slot: MentorSlot) => {
    if (!user || !profile) {
      toast.error('Please login to book a session');
      return;
    }

    if (!mentor) return;
    
    setIsBooking(slot.id);
    try {
      // 1. Create order on logic backend
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: slot.fee }),
      });
      
      const { order, error } = await res.json();
      if (error) throw new Error(error);

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: order.currency,
        name: 'SkillBridge',
        description: `Mentorship Session with ${mentor.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            
            const verifyData = await verifyRes.json();
            if (verifyData.verified) {
              // Create booking doc
              const bookingId = await createSessionBooking(
                slot, mentor, user.uid, profile.name, response.razorpay_order_id
              );
              await confirmBookingPayment(bookingId, response.razorpay_payment_id);
              
              toast.success('Session booked successfully!');
              router.push('/sessions');
            } else {
              toast.error('Payment verification failed');
            }
          } catch (err: any) {
            console.error('Verify error:', err);
            toast.error('Failed to verify payment');
          }
        },
        prefill: {
          name: profile.name,
          email: user.email,
        },
        theme: {
          color: '#6366f1'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate booking');
    } finally {
      setIsBooking(null);
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (!mentor) return <div className="text-center py-20 text-muted-foreground">Mentor not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      
      {/* Mentor Header */}
      <div className="bg-surface-card border border-border rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-brand-500/20 to-transparent" />
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center pt-8">
          <Avatar className="w-24 h-24 border-4 border-surface-card shadow-lg">
            <AvatarImage src={mentor.avatarUrl} alt={mentor.name} />
            <AvatarFallback className="text-2xl bg-brand-500/10 text-brand-500">{mentor.name.substring(0,2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-grow space-y-2">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{mentor.name}</h1>
                <p className="text-brand-400 font-medium">{mentor.headline}</p>
                <p className="text-sm text-muted-foreground">{mentor.college}</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-1.5 bg-surface-elevated px-3 py-1.5 rounded-full border border-border/50">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-sm">{mentor.averageRating > 0 ? mentor.averageRating.toFixed(1) : 'New'}</span>
                  <span className="text-xs text-muted-foreground">({mentor.totalRatings})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-surface-card border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm text-muted-foreground whitespace-pre-wrap">
              {mentor.bio}
            </CardContent>
          </Card>

          <Card className="bg-surface-card border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-lg">Expertise & Subjects</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2 text-foreground">Core Subjects</h4>
                <div className="flex flex-wrap gap-2">
                  {mentor.subjects.map(s => <Badge key={s} variant="secondary" className="bg-surface-elevated">{s}</Badge>)}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 text-foreground">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {mentor.expertise.map(s => <Badge key={s} variant="outline" className="border-border text-muted-foreground">{s}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-surface-card border-border sticky top-24">
            <CardHeader className="border-b border-border/50 pb-4 bg-surface-elevated/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-500" />
                Available Slots
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {slots.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No availability. Check back later.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {slots.map((slot) => {
                    const start = new Date(slot.startTime as Date);
                    const end = new Date(slot.endTime as Date);
                    const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                    const timeStr = `${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

                    return (
                      <div key={slot.id} className="p-4 flex flex-col gap-3 hover:bg-surface-elevated/30 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm text-foreground">{dateStr}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {timeStr}
                            </p>
                          </div>
                          <p className="text-sm font-semibold flex items-center text-foreground">
                            <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-muted-foreground" /> {slot.fee}
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleBookSlot(slot)} 
                          disabled={isBooking === slot.id}
                          className="w-full bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20"
                          size="sm"
                        >
                          {isBooking === slot.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Video className="w-4 h-4 mr-2" />}
                          Book Session
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
