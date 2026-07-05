import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { RotaryByline, RotaryMark } from "@/components/RotaryByline";
import { HeroCarousel, type HeroSlide } from "@/components/HeroCarousel";
import { getSessionProfile, dashboardPath } from "@/lib/auth";

const HERO_SLIDES: HeroSlide[] = [
  { src: "/hero-workplace.webp", alt: "A young man with Down syndrome working at a laptop, supported by two smiling colleagues in an inclusive office" },
  { src: "/work-bakery.png", alt: "A young man wearing noise-cancelling headphones arranging fresh baked goods on a tray" },
  { src: "/work-packing.png", alt: "A young man sealing a cardboard box with tape in a warehouse" },
  { src: "/work-greenhouse.png", alt: "A young man watering rows of seedlings in a greenhouse" },
  { src: "/work-archive.png", alt: "A young man sorting documents and files in an archive room" },
];

const ROLES = [
  { n: "01", t: "For Individuals", d: "Register yourself, build your own profile, choose when you're visible, and let inclusive employers find you." },
  { n: "02", t: "For Schools & Centres", d: "Build rich profiles for your students, list the handmade merchandise they make, and earn from company orders." },
  { n: "03", t: "For Recruiters", d: "Hire job-ready candidates with fair pay bands, and bulk-order handmade merchandise made by autistic adults." },
];

const SERVICES = [
  {
    tag: "Careers",
    t: "Inclusive hiring",
    d: "Individuals and centres build candidate profiles; recruiters search by skill and location and post roles with an automatic, fair ±30% pay band.",
  },
  {
    tag: "Marketplace",
    t: "Merchandise orders",
    d: "Centres list products their students make — candles, totes, soaps, crafts. Companies place bulk orders; centres accept and earn. A second path to dignified work.",
  },
];

export default async function Home() {
  const session = await getSessionProfile();
  if (session) redirect(dashboardPath(session.profile.role));

  return (
    <main className="flex-1">
      <header className="max-w-6xl mx-auto px-6 sm:px-8 py-6 flex items-center">
        <Logo textSize="text-[23px]" />
        <RotaryByline className="hidden sm:inline-flex ml-4" />
        <nav className="ml-auto flex items-center gap-2">
          <Link href="/login" className="text-[15px] font-semibold text-muted hover:text-foreground px-3.5 py-2.5 rounded-[10px]">
            Log in
          </Link>
          <ButtonLink href="/register">Get started</ButtonLink>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 sm:px-8 pt-10 pb-6 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-14 items-center">
        <div>
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.04em] uppercase text-clay">
            <span className="w-[18px] h-px bg-clay inline-block" />
            A Rotary social initiative
          </span>
          <h1 className="font-serif font-semibold text-5xl sm:text-6xl leading-[1.04] tracking-[-0.02em] mt-5 text-foreground text-balance">
            Meaningful work for <span className="text-accent italic">neurodiverse</span> talent.
          </h1>
          <p className="text-lg sm:text-xl leading-relaxed text-muted mt-6 max-w-[56ch]">
            WorkAble connects job-ready autistic and neurodiverse adults with employers
            ready to hire inclusively — with the dignity, clarity, and support that
            everyone deserves.
          </p>
          <div className="flex gap-3 flex-wrap mt-8">
            <ButtonLink href="/register">Create an account</ButtonLink>
            <ButtonLink href="/login" tone="secondary">I already have one</ButtonLink>
          </div>
        </div>

        <div className="relative">
          <HeroCarousel slides={HERO_SLIDES} />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 sm:px-8 pt-12 pb-16">
        <div className="grid sm:grid-cols-3 border-t border-border">
          {ROLES.map((r, i) => (
            <div
              key={r.n}
              className={`pt-8 pb-2 ${i === 0 ? "sm:pr-7" : i === 2 ? "sm:pl-7" : "sm:px-7"} ${
                i < 2 ? "sm:border-r border-border" : ""
              }`}
            >
              <span className="font-serif text-[15px] font-semibold text-clay">{r.n}</span>
              <h3 className="font-serif font-semibold text-2xl mt-2.5 text-foreground">{r.t}</h3>
              <p className="text-[15px] leading-relaxed text-muted mt-3">{r.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 sm:px-8 pb-16">
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.04em] uppercase text-clay">
          <span className="w-[18px] h-px bg-clay inline-block" />
          Two ways to make an impact
        </span>
        <div className="grid sm:grid-cols-2 gap-5 mt-6">
          {SERVICES.map((s) => (
            <div key={s.tag} className="bg-surface border border-border rounded-[20px] p-7">
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold bg-accent-soft text-accent border border-accent-soft-border">
                {s.tag}
              </span>
              <h3 className="font-serif font-semibold text-2xl mt-4 text-foreground">{s.t}</h3>
              <p className="text-[15px] leading-relaxed text-muted mt-2.5">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-dark text-[#cfc8b8] mt-8">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <span className="font-serif font-semibold text-[24px] tracking-[-0.01em] text-[#f7f3ea]">
              Work<span className="text-[#7fae84]">Able</span>
            </span>
            <p className="font-serif italic text-[19px] leading-relaxed text-[#e9e3d5] mt-5">
              Everyone deserves a doorway to good work.
            </p>
            <p className="text-[14px] leading-relaxed text-[#a39c8c] mt-3">
              We&rsquo;re building a kinder way to find work — one where being
              neurodiverse is met with understanding, not barriers.
            </p>
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/10">
              <RotaryMark size={38} />
              <span className="text-[13px] leading-snug text-[#a39c8c]">
                An initiative of
                <br />
                <span className="text-[#e9e3d5] font-semibold">Rotary International</span>
              </span>
            </div>
          </div>

          <nav className="text-[14px]">
            <h3 className="font-serif text-[15px] font-semibold text-[#f7f3ea]">Get started</h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/register" className="text-[#cfc8b8] hover:text-white">For individuals</Link></li>
              <li><Link href="/register" className="text-[#cfc8b8] hover:text-white">For schools &amp; centres</Link></li>
              <li><Link href="/register" className="text-[#cfc8b8] hover:text-white">For recruiters</Link></li>
            </ul>
          </nav>

          <nav className="text-[14px]">
            <h3 className="font-serif text-[15px] font-semibold text-[#f7f3ea]">Account</h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/login" className="text-[#cfc8b8] hover:text-white">Log in</Link></li>
              <li><Link href="/register" className="text-[#cfc8b8] hover:text-white">Create an account</Link></li>
            </ul>
          </nav>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-center gap-2 text-[13px] text-[#8f8978]">
            <span>&copy; {new Date().getFullYear()} WorkAble</span>
            <span className="hidden sm:inline text-white/20">·</span>
            <span>A Rotary social initiative for neurodiversity employment</span>
            <span className="sm:ml-auto">Made with care for talent that&rsquo;s too often overlooked.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
