import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Error',
  robots: { index: false, follow: false },
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4">500</h1>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-8">
            An unexpected error occurred. Please try again later.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-10 px-4 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
