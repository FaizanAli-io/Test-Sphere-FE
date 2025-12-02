interface AlertMessageProps {
  error: string;
  success: string;
}

export default function AlertMessage({ error, success }: AlertMessageProps) {
  if (!error && !success) return null;

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
          <p className="text-sm text-green-700 font-medium">{success}</p>
        </div>
      )}
    </>
  );
}
