
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

// Allowed origins for CORS and redirects
const ALLOWED_ORIGINS = [
  'https://www.vetorre.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

export default async function handler(req: any, res: any) {
  // CORS headers - restrict to allowed origins only
  const origin = req.headers.origin || '';

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, plan } = req.body;

    // Validate origin is in allowed list for security
    const requestOrigin = req.headers.origin || '';
    const safeOrigin = ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : 'https://www.vetorre.com';

    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Server Stripe configuration missing' });
    }

    let unitAmount = 0;
    let productName = '';

    // Define One-Time Payment Prices
    if (plan === 'Starter') {
        unitAmount = 999; // 9.99 EUR
        productName = 'VETORRE Starter (Lifetime Access)';
    } else if (plan === 'Pro') {
        unitAmount = 1999; // 19.99 EUR
        productName = 'VETORRE Pro (Lifetime Access)';
    } else {
        return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName,
              description: 'One-time payment for lifetime access to AI tools.',
              images: ['https://picsum.photos/seed/vetorre/200/200'], // Optional: Add your logo URL here
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // 'payment' indicates one-time charge
      success_url: `${safeOrigin}/#/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${safeOrigin}/#/pricing`,
      client_reference_id: userId, // Links the payment to Supabase User ID
      metadata: {
        userId: userId,
        plan: plan.toLowerCase() // 'starter' or 'pro'
      }
    });

    return res.status(200).json({ url: session.url });

  } catch (error: any) {
    console.error('Stripe Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
