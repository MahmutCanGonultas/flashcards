import { StarIcon } from "./icons";

/** Three stars, lit gold up to what was earned. */
function Stars({ count, size = "h-4 w-4", dim = "text-rule" }: { count: number; size?: string; dim?: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${count} yıldız`}>
      {[0, 1, 2].map((i) => (
        <StarIcon key={i} className={`${size} ${i < count ? "text-sunny" : dim}`} />
      ))}
    </span>
  );
}

export default Stars;
