interface AdBannerProps {
  slot?: string;
  format?: string;
  className?: string;
}

export function AdBanner({ className = "" }: AdBannerProps) {
  return (
    <div
      className={`w-full max-w-4xl mx-auto ${className}`}
      data-ocid="ad.banner"
    >
      <p className="text-xs text-muted-foreground text-center mb-1 uppercase tracking-widest opacity-50">
        Advertisement
      </p>
      <div
        style={{ minHeight: "90px", width: "100%" }}
        className="rounded-lg overflow-hidden bg-white/5"
      />
    </div>
  );
}
