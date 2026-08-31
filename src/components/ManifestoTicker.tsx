"use client";

const MANIFESTO =
  "one life — why aren't we running like we're on fire toward our wildest dreams?  ✦  we got one shot at this.  ✦  why aren't we like the crazy ones?  ✦  i want people to look at me and say that guy is nuts.  ✦  good.  ✦  i'd rather you call me crazy and a dreamer than a settler.  ✦  you are not made to stand in line.  ✦  you are made to stand out.  ✦  ";

export function ManifestoTicker({ variant }: { variant: "fullwidth" }) {
  if (variant === "fullwidth") {
    return (
      <div className="relative w-full overflow-hidden border-y-2 border-black bg-[var(--acid)] py-2.5">
        <div className="marquee-track flex whitespace-nowrap">
          <span className="px-4 text-[24px] sm:text-[30px] font-bold italic leading-none tracking-tight text-black">
            {MANIFESTO}
          </span>
          <span className="px-4 text-[24px] sm:text-[30px] font-bold italic leading-none tracking-tight text-black" aria-hidden>
            {MANIFESTO}
          </span>
        </div>
      </div>
    );
  }
  return null;
}
