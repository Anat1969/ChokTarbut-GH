import { useState } from 'react';
import { INITIAL_LAWS, ALL_DOMAINS, getLawsByDomain } from '../data/laws';
import LawCard from '../components/LawCard';
import DomainBadge from '../components/DomainBadge';
import type { Domain } from '../types';

export default function Library() {
  const [activeDomain, setActiveDomain] = useState<Domain | null>(null);

  const laws = activeDomain ? getLawsByDomain(activeDomain) : INITIAL_LAWS;

  return (
    <div className="page-content px-8 py-10">
      <div className="max-w-5xl">
        <div className="mb-8">
          <h1 className="section-title mb-1">ספריית חוקים</h1>
          <p className="text-sm text-zinc-500">{INITIAL_LAWS.length} חוקים ממדעים שונים</p>
        </div>

        {/* פילטר תחומים */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveDomain(null)}
            className={`px-3 py-1.5 text-xs font-medium border transition-colors
              ${activeDomain === null
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-zinc-300 hover:border-black'
              }`}
          >
            הכל ({INITIAL_LAWS.length})
          </button>
          {ALL_DOMAINS.map((domain) => {
            const count = getLawsByDomain(domain).length;
            if (count === 0) return null;
            return (
              <button
                key={domain}
                onClick={() => setActiveDomain(domain === activeDomain ? null : domain)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors
                  ${activeDomain === domain
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-zinc-300 hover:border-black'
                  }`}
              >
                <DomainBadge domain={domain} />
                <span className="mr-1 text-zinc-400">({count})</span>
              </button>
            );
          })}
        </div>

        {/* גריד חוקים */}
        <div className="grid grid-cols-2 gap-px bg-zinc-200">
          {laws.map((law) => (
            <LawCard key={law.id} law={law} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
