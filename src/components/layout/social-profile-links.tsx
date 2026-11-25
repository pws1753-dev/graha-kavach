import { ExternalLink } from "lucide-react";
import { SOCIAL_PROFILES } from "@/lib/config/social";

export function SocialProfileLinks({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="font-semibold">Follow Graha Kavach</p>
      <ul className="mt-1 flex flex-wrap gap-x-3">
        {SOCIAL_PROFILES.map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 underline underline-offset-4 transition-opacity hover:opacity-80"
            >
              {label}
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
