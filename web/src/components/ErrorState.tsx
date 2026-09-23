import Button from "./Button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

/** Something went wrong: a sheet with a vermilion edge, the one colour that means "now". */
function ErrorState({ title = "Bir şeyler ters gitti", message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-[20px] border-2 border-berry-soft bg-white p-6 text-center shadow-[0_2px_0_0_var(--color-berry-soft)] sm:p-8">
      <div className="mb-2 text-4xl" aria-hidden="true">
        😵‍💫
      </div>
      <h3 className="text-lg font-extrabold text-ink">{title}</h3>
      <p className="mt-1 font-medium text-graphite">{message}</p>
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <Button variant="ink" size="sm" onClick={onRetry}>
            Tekrar dene
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
