import { Link } from "wouter";
import { BiChevronRight, BiSolidHome } from "react-icons/bi";

export type BreadcrumbSegment = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ segments }: { segments: BreadcrumbSegment[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-0.5" data-testid="breadcrumbs">
      {segments.map((segment, i) => {
        const isLast = i === segments.length - 1;
        const testId = segment.label.toLowerCase().replace(/\s+/g, "-");
        return (
          <span key={i} className="flex items-center">
            {i > 0 && <BiChevronRight className="w-3 h-3 text-muted-foreground/50 mx-1 shrink-0" />}
            {isLast || !segment.href ? (
              <span
                className="whitespace-nowrap text-[13px] font-medium text-foreground"
                data-testid={`breadcrumb-${testId}`}
              >
                {segment.label}
              </span>
            ) : (
              <Link
                href={segment.href}
                className="inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-lg bg-transparent border border-border text-[13px] font-medium text-foreground hover:bg-secondary transition-all"
                data-testid={`breadcrumb-link-${testId}`}
              >
                {i === 0 && <BiSolidHome className="w-3 h-3 shrink-0" />}
                {segment.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
