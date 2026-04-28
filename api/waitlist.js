/**
 * api/waitlist.js
 * Vercel edge function — saves waitlist email signups to Supabase
 * 
 * Add these environment variables in Vercel dashboard for yardmind-landing project:
 *   SUPABASE_URL=https://weivzjtlalwdmmpawqkx.supabase.co
 *   SUPABASE_SERVICE_KEY=your_service_role_key
 */

export const config = { runtime: 'edge' }

export default async function handler(req) {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { email } = await req.json()

    // Basic email validation
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Save to Supabase waitlist table
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/waitlist`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          source: 'landing_page',
          signed_up_at: new Date().toISOString(),
        })
      }
    )

    // Handle duplicate email gracefully
    if (res.status === 409) {
      return new Response(JSON.stringify({ success: true, message: 'Already on the list' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!res.ok) {
      const err = await res.text()
      console.error('Supabase error:', err)
      return new Response(JSON.stringify({ error: 'Failed to save signup' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Waitlist error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
