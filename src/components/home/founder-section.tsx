import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

type Props = {
  notesHtml?: string | null;
};

export function FounderSection({ notesHtml }: Props) {
  return (
    <section className="py-8 lg:py-12 bg-white">
      <Container width="wide">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 items-center">
          
          {/* Left Column: Clean Cutout Portrait (No border, No shadow, No background, No bottom box) */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md">
              <Image
                src="https://admin.grahakavach.in/wp-content/uploads/rakesh-mishra-3-1536x1411-1.webp"
                alt="Rakesh Mishra — Founder of Speciality Geochem & Graha Kavach"
                width={1536}
                height={1411}
                sizes="(max-width: 1024px) 100vw, 420px"
                priority
                className="w-full h-auto object-contain block"
              />
            </div>
          </div>

          {/* Right Column: Crisp & Concise Bio with Link */}
          <div className="flex flex-col justify-center">
            <span className="gk-text-gradient text-xs font-semibold tracking-[0.2em] uppercase">
              The Founder
            </span>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Rakesh Mishra
            </h2>
            <p className="mt-1 text-sm sm:text-base font-medium text-foreground-muted">
              Founder & Business Owner, Speciality Geochem (Est. 2010)
            </p>

            <h3 className="mt-4 text-sm font-semibold text-foreground">A note from our founder, Rakesh Mishra</h3>
            {/* Short Quote */}
            <div className="mt-2 border-l-2 border-primary pl-4 py-0.5 text-foreground italic text-sm sm:text-base leading-relaxed">
              “A manufacturing business is only as strong as the systems behind it. Every facility we run is certified, every product is tested, and we never compromise on what leaves the factory.”
            </div>

            {/* Concise Story */}
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-foreground-muted">
              Based in Udaipur, Rajasthan, Rakesh Mishra established <strong className="text-foreground font-semibold">Speciality Geochem with roots dating back to 2010</strong>. With over 15 years of helping protect workplaces and businesses from fire, he expanded it into a premier manufacturing enterprise across two RIICO production units, engineering certified fire safety equipment and industrial minerals. He created <strong className="text-foreground font-semibold">Graha Kavach</strong> to bring that same uncompromising standard to homes across India.
            </p>

            {notesHtml ? (
              <div
                className="mt-3 text-xs sm:text-sm text-foreground-muted [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: notesHtml }}
              />
            ) : null}

            {/* Link to personal website */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                href="https://therakeshmishra.com/"
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="md"
              >
                <span>Visit therakeshmishra.com</span>
                <ExternalLink className="size-4" />
              </Button>
            </div>

          </div>

        </div>
      </Container>
    </section>
  );
}
