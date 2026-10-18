import { useEffect, useState } from 'react';
import { MapPin, Truck } from 'lucide-react';
import { siteAPI, type DeliveryCity } from '@/core/api/vnwAPI';

export default function HomeDeliveryCities() {
  const [cities, setCities] = useState<DeliveryCity[]>([]);
  useEffect(() => {
    let active = true;
    siteAPI.deliveryCities().then((items) => { if (active) setCities(items); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  if (!cities.length) return null;
  return <section className="bg-card py-6" aria-labelledby="delivery-cities-title"><div className="page-container">
    <div className="home-discovery-heading"><h2 id="delivery-cities-title" className="flex items-center gap-2"><Truck className="h-6 w-6 text-primary" />Home delivery in selected cities</h2></div>
    <p className="mb-4 text-sm text-muted-foreground">Get your VIP number delivered in these service areas.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cities.map((city) => <article key={city.city_id} className={`rounded-2xl border p-4 ${Number(city.is_highlighted) ? 'border-primary/40 bg-primary/10' : 'border-border bg-background'}`}><div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" /><h3 className="text-sm font-black">{city.city_name}</h3>{Number(city.is_highlighted) ? <span className="ml-auto rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">Featured</span> : null}</div><p className="mt-1 text-xs text-muted-foreground">{city.state_name}</p>{city.description && <p className="mt-2 text-xs leading-5">{city.description}</p>}</article>)}</div>
  </div></section>;
}
