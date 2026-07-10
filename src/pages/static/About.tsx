import { Link } from 'react-router-dom';
import { ShieldCheck, BadgeIndianRupee, Lock, RefreshCw } from 'lucide-react';
import { BrandLockup } from '@/shared/components/Logo';

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <BrandLockup className="justify-center" logoClassName="h-14 w-14" sloganClassName="h-12 w-64 max-w-[70vw]" />
        <h1 className="mt-5 text-4xl font-extrabold" style={{ fontFamily: 'Playfair Display, serif' }}>About <span className="text-gold">VIP Number World</span></h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          VIP Number World is India's premium marketplace for buying and selling exclusive VIP, fancy and lucky mobile numbers.
          We believe your number is your identity — and everyone deserves one that stands out.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {[
          { icon: ShieldCheck, t: 'Genuine & Verified', d: 'Every number is verified for authenticity before listing.' },
          { icon: BadgeIndianRupee, t: 'Best Prices', d: 'Competitive pricing with regular offers up to 50% off.' },
          { icon: Lock, t: 'Secure Payments', d: 'Encrypted online payments powered by Razorpay.' },
          { icon: RefreshCw, t: 'Quick Transfer', d: 'Hassle-free ownership transfer handled by our team.' },
        ].map((f) => (
          <div key={f.t} className="vnw-card flex items-start gap-3 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-card-border text-primary"><f.icon className="h-5 w-5" /></span>
            <div><div className="font-semibold text-foreground">{f.t}</div><div className="text-sm text-muted-foreground">{f.d}</div></div>
          </div>
        ))}
      </div>

      <div className="vnw-card mt-12 p-8 text-center">
        <h2 className="text-2xl font-bold text-gold">Are you a dealer?</h2>
        <p className="mt-2 text-muted-foreground">List your premium numbers and reach thousands of buyers. Earn on every sale.</p>
        <Link to="/register?role=DEALER" className="btn-gold mt-5 inline-flex">Become a Dealer</Link>
      </div>
    </div>
  );
}
