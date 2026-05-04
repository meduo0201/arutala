// Generate VAPID keypair untuk Web Push.
// Output:
//   - VITE_PUSH_VAPID_PUBLIC_KEY (frontend, di-bundle)
//   - PUSH_VAPID_PRIVATE_KEY (server-side only — Edge Function secret)
// Run: node scripts/generate-vapid.mjs
//
// Save output ke .env.local + tambah ke Cloudflare Pages env (public key)
// + Supabase Edge Function secrets (private key, via `supabase secrets set`).

import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('VAPID keypair generated.');
console.log('');
console.log('Add to .env.local (frontend reads VITE_PUSH_VAPID_PUBLIC_KEY):');
console.log(`VITE_PUSH_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log('');
console.log('Add to Supabase Edge Function secrets (server-only):');
console.log(`  supabase secrets set PUSH_VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`  supabase secrets set PUSH_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`  supabase secrets set PUSH_VAPID_SUBJECT=mailto:you@example.com`);
console.log('');
console.log('Public key (safe to commit/expose, used for client-side subscribe):');
console.log(`  ${keys.publicKey}`);
console.log('');
console.log('PRIVATE KEY (NEVER expose, never commit):');
console.log(`  ${keys.privateKey}`);
