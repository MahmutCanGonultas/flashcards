type SkeletonProps = {
  className?: string;
};

/** A recessed band where the content will land: the paper's deeper tint, breathing. */
function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse bg-paper-deep ${className}`} aria-hidden="true" />;
}

export default Skeleton;
