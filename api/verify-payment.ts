
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// We need the service role key to bypass RLS and update another user's profile
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
       return res.status(500).json({ error: 'Stripe configuration missing on server' });
    }

    // 1. Retrieve the session from Stripe to ensure it's valid and paid
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const userId = session.client_reference_id;
    const plan = session.metadata?.plan || 'pro'; // Default to pro if missing

    if (!userId) {
      return res.status(400).json({ error: 'No user ID attached to payment' });
    }

    // 2. Update Supabase Profile using Service Role (Bypasses RLS)
    // Set expiration to 100 years from now for "Lifetime" access
    const lifetimeEnd = new Date();
    lifetimeEnd.setFullYear(lifetimeEnd.getFullYear() + 100);

    const { error: dbError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        plan: plan,
        subscription_end: lifetimeEnd.toISOString()
      })
      .eq('id', userId);

    if (dbError) {
      console.error('Supabase Update Error:', dbError);
      return res.status(500).json({ error: 'Failed to update user profile in database' });
    }

    return res.status(200).json({ success: true, plan });

  } catch (error: any) {
    console.error('Verification Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
