import Button from "./Button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-3xl bg-rose-100 ring-2 ring-rose-200 p-6 sm:p-8 text-center">
      <div className="text-4xl mb-2" aria-hidden="true">
        😵‍💫
      </div>
      <h3 className="font-extrabold text-lg text-rose-800">{title}</h3>
      <p className="text-rose-700 font-medium mt-1">{message}</p>
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <Button variant="danger" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
