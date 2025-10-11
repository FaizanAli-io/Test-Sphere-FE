interface AuthFooterProps {
  authMode: "login" | "signup" | "forgot" | "reset";
  loading: boolean;
  onSwitchMode: (mode: "login" | "signup" | "forgot" | "reset") => void;
}

export default function AuthFooter({
  authMode,
  loading,
  onSwitchMode,
}: AuthFooterProps) {
  return (
    <div className="mt-6 text-center">
      <p className="text-sm text-gray-600">
        {authMode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => onSwitchMode("signup")}
              disabled={loading}
              className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline disabled:opacity-50"
            >
              Sign up
            </button>
          </>
        ) : authMode === "signup" ? (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => onSwitchMode("login")}
              disabled={loading}
              className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline disabled:opacity-50"
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            Remember your password?{" "}
            <button
              type="button"
              onClick={() => onSwitchMode("login")}
              disabled={loading}
              className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline disabled:opacity-50"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
