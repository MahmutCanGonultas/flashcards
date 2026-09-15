type PhotoProps = {
  src: string;
  className?: string;
  /** Rounded corners etc. on the frame. */
  frameClassName?: string;
};

/**
 * A photo that is never cropped: the whole picture, contained, on a soft
 * warm mat with a hairline frame — like a print laid on paper. Any aspect
 * ratio fills any frame without chopping heads off.
 */
function Photo({ src, className = "", frameClassName = "" }: PhotoProps) {
  return (
    <div className={`relative overflow-hidden bg-[#F3EEE4] ${frameClassName}`}>
      <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.7),transparent_70%)]" />
      <div className="absolute inset-3">
        <img
          src={src}
          alt=""
          className={`h-full w-full rounded-xl object-contain drop-shadow-[0_6px_12px_rgba(28,25,23,0.18)] ${className}`}
          draggable={false}
        />
      </div>
    </div>
  );
}

export default Photo;
