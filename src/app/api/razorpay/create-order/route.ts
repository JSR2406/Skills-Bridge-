import { NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay/client';

export async function POST(req: Request) {
  try {
    const { amount, currency = "INR" } = await req.json();

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    const options = {
      amount: amount * 100, // amount in the smallest currency unit (paise)
      currency,
      receipt: `rcptid_${Date.now()}`,
    };

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create(options);
    
    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
