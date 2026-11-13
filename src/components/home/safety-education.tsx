import Image from "next/image";
import { Container } from "@/components/ui/container";
import { CheckIcon, ShieldIcon } from "@/components/ui/icons";

const RISKS = [
  {
    title: "Electrical panel / MCB",
    text: "Distribution boards collect dust and heat. Keep them visible, reachable and inspected by a qualified electrician.",
    image: "https://admin.grahakavach.in/wp-content/uploads/electrical-panel-mcb-fire-safety-graha-kavach.webp",
    alt: "Electrical panel and MCB fire safety guidance",
  },
  {
    title: "Inverter / battery",
    text: "Backup power sits in cupboards and lofts, often unventilated and rarely checked between failures.",
    image: "https://admin.grahakavach.in/wp-content/uploads/inverter-battery-fire-safety-graha-kavach.webp",
    alt: "Inverter and battery storage fire safety",
  },
  {
    title: "Kitchen",
    text: "Oil, open flame and fabric meet here. Keep the blanket near the exit side, not across the cooking hazard.",
    image: "https://admin.grahakavach.in/wp-content/uploads/kitchen-fire-safety-graha-kavach.webp",
    alt: "Kitchen fire safety with open flame and cooking hazards",
  },
  {
    title: "Old or overloaded wiring",
    text: "Extension boards and old wiring are worth checking before they become everyday risk.",
    image: "https://admin.grahakavach.in/wp-content/uploads/old-overloaded-wiring-fire-safety-graha-kavach.webp",
    alt: "Overloaded extension board and household wiring fire risk",
  },
] as const;

export function RiskAreas() {
  return (
    <section className="bg-white py-10 lg:py-14 border-t border-border/60">
      <Container width="wide">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/70">
          <div className="max-w-2xl">
            <span className="gk-text-gradient text-xs font-semibold tracking-[0.18em] uppercase">
              Fire can start anywhere
            </span>
            <h2 className="mt-3 text-3xl leading-[1.14] font-medium tracking-[-0.025em] text-balance text-foreground lg:text-[42px]">
              Where you need a fire extinguisher at home.
            </h2>
            <p className="mt-4 leading-7 text-foreground-muted">
              Most house fires start in one of a handful of predictable spots — not from anything
              exotic. Knowing where reduces how long it takes to notice one. This guidance does not
              replace a professional electrical inspection.
            </p>
          </div>

          <div className="flex shrink-0">
            <div className="flex items-center gap-3 rounded-[12px] border border-border/80 bg-stone-50/80 p-4 max-w-sm">
              <ShieldIcon className="size-5 shrink-0 text-primary" />
              <p className="text-xs sm:text-sm font-medium leading-snug text-foreground">
                Mount the kit where you move through the home, not inside the risk zone itself.
              </p>
            </div>
          </div>
        </div>

        {/* All 4 cards in one row on desktop */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {RISKS.map((risk) => (
            <article
              key={risk.title}
              className="group flex flex-col overflow-hidden rounded-[16px] border border-border/80 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)]"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100">
                <Image
                  src={risk.image}
                  alt={risk.alt}
                  width={1672}
                  height={941}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="text-lg font-semibold tracking-tight text-foreground lg:text-xl">
                  {risk.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-foreground-muted">
                  {risk.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full overflow-hidden p-0 m-0">
      <div className="flex flex-col w-full p-0 m-0 leading-none">
        <Image
          src="https://admin.grahakavach.in/wp-content/uploads/extinguish-home-office-1870x623-1.webp"
          alt="Graha Kavach 01 - Extinguish: ABC Dry Powder Extinguisher"
          width={1870}
          height={623}
          sizes="100vw"
          className="block h-auto w-full p-0 m-0 align-top"
          style={{ aspectRatio: "1870 / 623" }}
          loading="lazy"
        />
        <Image
          src="https://admin.grahakavach.in/wp-content/uploads/graha-kavach-02-activate-21x6-1.webp"
          alt="Graha Kavach 02 - Activate: Automatic Fire Ball"
          width={2172}
          height={724}
          sizes="100vw"
          className="block h-auto w-full p-0 m-0 align-top"
          style={{ aspectRatio: "2172 / 724" }}
          loading="lazy"
        />
        <Image
          src="https://admin.grahakavach.in/wp-content/uploads/graha-kavach-03-smother-fire-blanket-21x6-1.webp"
          alt="Graha Kavach 03 - Smother: Fire Blanket"
          width={2172}
          height={724}
          sizes="100vw"
          className="block h-auto w-full p-0 m-0 align-top"
          style={{ aspectRatio: "2172 / 724" }}
          loading="lazy"
        />
      </div>
    </section>
  );
}

const PLACEMENTS = [
  {
    title: "Extinguisher",
    text: "Mount it on the supplied bracket in a common area or corridor, somewhere on the way out.",
    image: "https://admin.grahakavach.in/wp-content/uploads/Fire-Extinguisher-in-Modern-Hallway.png",
    alt: "Fire Extinguisher mounted in a modern hallway near the exit",
  },
  {
    title: "Fire ball",
    text: "Set it on its stand or bracket near the electrical risk area it is meant to cover.",
    image: "https://admin.grahakavach.in/wp-content/uploads/Modern-Utility-Wall-with-Fire-Safety-Ball.png",
    alt: "Automatic Fire Ball on utility wall near electrical distribution board",
  },
  {
    title: "Fire blanket",
    text: "Keep it near the kitchen exit, within reach without crossing the cooking hazard.",
    image: "https://admin.grahakavach.in/wp-content/uploads/Modern-Kitchen-with-Fire-Blanket-Safety.png",
    alt: "Fire Blanket mounted on modern kitchen wall for quick emergency release",
  },
] as const;

export function Placement() {
  return (
    <section id="placement" className="scroll-mt-24 bg-background py-10 lg:py-14">
      <Container width="wide">
        <div className="max-w-2xl">
          <p className="gk-text-gradient text-xs font-medium tracking-[0.18em] uppercase">
            Placement and installation
          </p>
          <h2 className="mt-4 text-3xl leading-[1.14] font-medium tracking-[-0.02em] text-balance text-foreground lg:text-[42px]">
            Where you put it decides whether it helps.
          </h2>
          <p className="mt-4 leading-7 text-foreground-muted">
            Mounting hardware for all three is in the box. Never place a device where reaching it
            would put you between yourself and the way out.
          </p>
        </div>

        {/* 3 cards in one row on tablet/desktop, mobile responsive */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mt-10 lg:gap-8">
          {PLACEMENTS.map((item, index) => (
            <article
              key={item.title}
              className="group flex flex-col overflow-hidden rounded-[16px] border border-border/80 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)]"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100">
                <Image
                  src={item.image}
                  alt={item.alt}
                  width={1600}
                  height={900}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <span className="gk-text-gradient text-xs font-semibold tabular-nums tracking-wider uppercase">
                  Step {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-xl font-medium tracking-[-0.01em] text-foreground lg:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                  {item.text}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {["Visible from daily routes", "Not behind the hazard", "Reachable without searching"].map(
            (item) => (
              <div key={item} className="flex items-center gap-3 rounded-[10px] border border-border/60 bg-white p-4 shadow-sm">
                <CheckIcon className="size-4 shrink-0 text-primary" />
                <p className="text-sm font-medium text-foreground">{item}</p>
              </div>
            ),
          )}
        </div>
      </Container>
    </section>
  );
}
