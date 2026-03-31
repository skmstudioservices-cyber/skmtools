// SKMTools Universal Worker (Backend Entrypoint for Cloudflare Pages)
const TEMP_DOMAINS = ['mailinator','guerrillamail','tempmail','yopmail','sharklasers','throwaway','dispostable','trashmail','fakeinbox','maildrop','getnada','spamgourmet','mytemp','tempr','mintemail','spamex','getairmail','mailnull','binkmail','discardmail'];

function isTempEmail(email) {
  const domain = (email.split('@')[1] || '').toLowerCase();
  return TEMP_DOMAINS.some(d => domain.includes(d));
}

function genRefCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

function corsHeaders() {
  return new Response(null, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' }
  });
}

async function verifyAdmin(request, env) {
  const key = request.headers.get('x-admin-key');
  if (!key) return false;
  if (!env.DB) return false; // Safety check
  const admin = await env.DB.prepare('SELECT role FROM admin_users WHERE password_hash = ?').bind(key).first();
  return admin ? admin : false;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') return corsHeaders();

    // ── GEO ──
    if (path === '/api/geo') {
      const country = (request.headers.get('CF-IPCountry') || 'US').toLowerCase();
      return json({ country });
    }

    // ── REGISTER (free path email capture) ──
    if (path === '/api/register' && request.method === 'POST') {
      try {
        if (!env.DB) return json({ error: 'Database not bound. Please check Cloudflare Settings.' }, 500);
        const body = await request.json();
        const email = (body.email || '').toLowerCase().trim();
        const refBy = (body.ref_code || '').toUpperCase().trim();
        const country = (body.country || 'us').toLowerCase();

        if (!email || !email.includes('@')) return json({ error: 'Invalid email' }, 400);
        if (isTempEmail(email)) return json({ error: 'Disposable emails not accepted' }, 400);

        // Check existing
        const existing = await env.DB.prepare('SELECT ref_code FROM leads WHERE email = ?').bind(email).first();
        if (existing) return json({ ref_code: existing.ref_code, existing: true });

        // Generate unique ref code
        let refCode = genRefCode();
        let tries = 0;
        while (tries < 5) {
          const check = await env.DB.prepare('SELECT id FROM leads WHERE ref_code = ?').bind(refCode).first();
          if (!check) break;
          refCode = genRefCode(); tries++;
        }

        // Insert lead
        await env.DB.prepare(
          'INSERT INTO leads (email, ref_code, referred_by, country) VALUES (?, ?, ?, ?)'
        ).bind(email, refCode, refBy || null, country).run();

        // Log audit
        await env.DB.prepare(
          'INSERT INTO audit_log (email, country) VALUES (?, ?)'
        ).bind(email, country).run();

        // Credit referrer
        if (refBy) {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO referrals (referrer_code, referred_email, completed) VALUES (?, ?, 1)'
          ).bind(refBy, email).run();
          await env.DB.prepare(
            'UPDATE leads SET referral_count = referral_count + 1 WHERE ref_code = ?'
          ).bind(refBy).run();
        }

        return json({ ref_code: refCode, success: true });
      } catch (e) {
        return json({ error: 'Server error', detail: e.message }, 500);
      }
    }

    // ── REFERRAL STATUS ──
    if (path === '/api/referral-status' && request.method === 'GET') {
      if (!env.DB) return json({ error: 'Database not bound' }, 500);
      const code = url.searchParams.get('code');
      if (!code) return json({ error: 'Missing code' }, 400);
      const lead = await env.DB.prepare('SELECT referral_count, tier, plan FROM leads WHERE ref_code = ?').bind(code.toUpperCase()).first();
      if (!lead) return json({ error: 'Not found' }, 404);
      return json({ referral_count: lead.referral_count, tier: lead.tier, plan: lead.plan });
    }

    // ── BLOG: LIST ──
    if (path === '/api/blog') {
      if (!env.DB) return json({ error: 'Database not bound' }, 500);
      const { results } = await env.DB.prepare(
        'SELECT slug, title, meta_description, category, country_target, created_at FROM blog_posts WHERE published = 1 ORDER BY created_at DESC LIMIT 20'
      ).all();
      return json({ posts: results });
    }

    // ── BLOG: SINGLE POST ──
    if (path.startsWith('/api/blog/')) {
      if (!env.DB) return json({ error: 'Database not bound' }, 500);
      const slug = path.replace('/api/blog/', '');
      const post = await env.DB.prepare('SELECT * FROM blog_posts WHERE slug = ? AND published = 1').bind(slug).first();
      if (!post) return json({ error: 'Not found' }, 404);
      return json(post);
    }

    // ── STATS (public) ──
    if (path === '/api/stats') {
      if (!env.DB) return json({ total_audits: 1247, today_audits: 47 }); // Fallback if DB unbound
      const totalLeads = await env.DB.prepare('SELECT COUNT(*) as c FROM leads').first('c');
      const todayLeads = await env.DB.prepare("SELECT COUNT(*) as c FROM leads WHERE date(created_at) = date('now')").first('c');
      return json({ total_audits: (totalLeads || 0) + 1247, today_audits: (todayLeads || 0) + 47 });
    }

    // ── ADMIN ──
    if (path.startsWith('/api/admin')) {
      if (!env.DB) return json({ error: 'Database unbound' }, 500);
      const admin = await verifyAdmin(request, env);
      if (!admin) return json({ error: 'Unauthorized' }, 403);

      if (path === '/api/admin/leads') {
        const { results } = await env.DB.prepare(
          'SELECT id, email, ref_code, referred_by, country, tier, referral_count, plan, created_at FROM leads ORDER BY created_at DESC LIMIT 100'
        ).all();
        return json({ leads: results });
      }

      if (path === '/api/admin/stats') {
        const total = await env.DB.prepare('SELECT COUNT(*) as c FROM leads').first('c');
        const refs = await env.DB.prepare('SELECT COUNT(*) as c FROM referrals WHERE completed = 1').first('c');
        const paid = await env.DB.prepare("SELECT COUNT(*) as c FROM leads WHERE plan != 'free'").first('c');
        return json({ total_leads: total, total_referrals: refs, paid_users: paid, role: admin.role });
      }
    }

    // ── PRICES ──
    if (path === '/api/prices') {
      const country = (request.headers.get('CF-IPCountry') || 'US').toLowerCase();
      const prices = {
        in: { report: '₹299', consult: '₹1,499', setup: '₹9,999' },
        gb: { report: '£8', consult: '£42', setup: '£2,499' },
        ae: { report: 'AED 35', consult: 'AED 180', setup: 'AED 3,500' },
        default: { report: '$9', consult: '$49', setup: '$2,999' }
      };
      return json({ country, prices: prices[country] || prices.default });
    }

    // ── ASSETS FALLBACK ──
    // If not an API route, allow Pages to serve the static file
    return env.ASSETS.fetch(request);
  }
};
