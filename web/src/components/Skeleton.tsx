type SkeletonProps = {
  className?: string;
};

function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse bg-stone-100 ${className}`} aria-hidden="true" />;
}

export default Skeleton;
