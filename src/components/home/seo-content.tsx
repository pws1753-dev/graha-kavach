"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils/cn";

const linkClass = "font-medium text-primary underline underline-offset-4 hover:text-primary-hover";

function ComparisonTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="my-5 overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead className="bg-background-subtle text-foreground"><tr>{headers.map((header) => <th className="border-b border-border px-4 py-3 font-semibold" key={header} scope="col">{header}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr className="border-b border-border last:border-b-0" key={row.join("-")}>{row.map((cell, index) => <td className="px-4 py-3 align-top" key={`${cell}-${index}`}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/** Long-form, answer-led home-page content. It stays in the DOM for crawlers and is optional for readers. */
export function HomeSeoContent() {
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-background py-16 lg:py-20" aria-labelledby="home-fire-safety-guide">
      <Container width="wide">
        <div className="max-w-4xl">
          <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Home fire safety guide</p>
          <h2 id="home-fire-safety-guide" className="mt-3 text-2xl leading-[1.2] font-medium tracking-[-0.02em] text-foreground lg:text-3xl">What Is the Best Fire Extinguisher for Home in India?</h2>
          <p className="mt-4 text-[15px] leading-7 text-foreground-muted">For most homes, an ABC dry powder extinguisher is the most versatile first-response option. Graha Kavach pairs it with a fire blanket and an automatic fire ball so the kitchen and unattended risk points have a dedicated tool too.</p>
        </div>

        <div className="relative mt-5">
          <div className={cn("gk-prose overflow-hidden text-[15px] leading-7 text-foreground-muted", !open && "max-h-[340px]")}>
            <ComparisonTable headers={["Extinguisher type", "Common uses", "Home suitability"]} rows={[
              ["ABC dry powder", "Wood, cloth, paper, flammable liquids and LPG", "A practical all-round option"],
              ["CO₂", "Electrical equipment and flammable liquids", "Useful for specific risks, not soft furnishings"],
              ["Water", "Wood, cloth and paper", "Not for electrical or oil fires"],
              ["Foam", "Wood, cloth and some flammable liquids", "Not for live electrical equipment"],
              ["Wet chemical", "Cooking-oil fires", "Kitchen-specific; a blanket is simpler for a small pan fire"],
            ]} />

            <h3>Why does every Indian home need a fire extinguisher?</h3>
            <p>Cooking, electrical panels, inverters and ageing wiring create everyday risks. A home extinguisher is for a small, early-stage fire only—if smoke is building, the fire is spreading or your exit is blocked, leave immediately and call 101 or 112.</p>

            <h3>Which home fires need more than one tool?</h3>
            <p>A single extinguisher does not solve every situation. Do not throw water on cooking oil, and do not cross a hazard to reach equipment. The three parts of the kit give each common risk a safer first response.</p>
            <ComparisonTable headers={["Fire at home", "Safer first response"]} rows={[
              ["Sofa, curtains, bedding or paper", "ABC extinguisher, only while the fire is small and escape remains clear"],
              ["Small LPG flame", "Turn off the regulator if safe, then use the ABC extinguisher"],
              ["Pan of burning cooking oil", "Turn off heat if safe and cover with the fire blanket—never add water"],
              ["MCB panel or inverter when nobody is present", "Automatic fire ball placed at the intended risk point"],
              ["Clothes on fire", "Use the fire blanket to smother; stop, drop and roll"],
            ]} />

            <h3>What comes with the Graha Kavach fire extinguisher for home?</h3>
            <ul>
              <li><strong>ABC dry powder extinguisher</strong> with a wall bracket, for a fire you can safely approach.</li>
              <li><strong>Automatic fire ball</strong> with a stand, for a selected flame-risk point without electricity.</li>
              <li><strong>Fire blanket</strong> for small kitchen oil fires and clothing fires.</li>
              <li><strong>Screws and wall plugs</strong> to mount the equipment.</li>
            </ul>
            <p>See the complete product specification and photos on the <Link href="/fire-safety-kit" className={linkClass}>3-in-1 fire safety kit</Link>.</p>

            <h3>How many fire extinguishers does a house need?</h3>
            <ComparisonTable headers={["Home size", "Suggested setup"]} rows={[
              ["Studio or 1 BHK", "One extinguisher by the exit; blanket in the kitchen"],
              ["2–3 BHK flat", "Extinguisher by the exit, blanket in the kitchen and fire ball near the intended electrical risk point"],
              ["Duplex or independent house", "At least one accessible extinguisher per floor, plus kitchen blanket and appropriately placed fire ball"],
            ]} />

            <h3>Where should you keep a fire extinguisher at home?</h3>
            <p>Mount the extinguisher near the main exit, where an adult can reach it while keeping an escape route behind them. Keep the blanket on a kitchen wall that can be reached without leaning over the stove. Place the fire ball only where its product instructions permit, such as near an MCB panel, inverter or gas-cylinder area. Our <Link href="/safety-guide" className={linkClass}>room-by-room safety guide</Link> explains the setup.</p>

            <h3>How do you use a fire extinguisher at home?</h3>
            <ol><li>Pull the safety pin.</li><li>Aim at the base of the fire from a safe distance.</li><li>Squeeze the handle.</li><li>Sweep side to side while keeping a clear exit behind you.</li></ol>
            <p>Leave and call emergency services if the fire is taller than you, spreading or filling the room with smoke.</p>

            <h3>How much does a home fire safety kit cost?</h3>
            <p>Graha Kavach combines the extinguisher, fire ball, blanket and mounting hardware in one kit for ₹2,499, with free delivery. You can book Cash on Delivery with ₹199 online and pay the balance on delivery.</p>

            <h3>Do you deliver across India?</h3>
            <p>Yes. Graha Kavach delivers across India with tracking. Orders are normally dispatched within one working day and delivery timing depends on the destination. For help before ordering, <Link href="/contact" className={linkClass}>contact our team</Link>.</p>

            <h3>Who makes Graha Kavach?</h3>
            <p>Graha Kavach is the home fire-safety brand of Speciality Geochem in Udaipur, Rajasthan. Learn more about the team, manufacturer and support options on our <Link href="/about" className={linkClass}>about page</Link>.</p>

            <h3>Get a fire extinguisher for home before you need it</h3>
            <p>Mount the equipment, show the people at home where it is, and check its visible condition regularly. The day an extinguisher is needed is not the day to buy or learn to use one.</p>
            <Link className="mt-2 inline-flex font-semibold text-primary underline underline-offset-4" href="/fire-safety-kit">Buy Fire Extinguisher for Home – ₹2,499</Link>
          </div>
          {!open ? <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" /> : null}
        </div>

        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          {open ? "Show less" : "Read more"}<ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
      </Container>
    </section>
  );
}
