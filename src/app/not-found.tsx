export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl font-bold text-slate-200 mb-4">404</p>
        <h1 className="text-xl font-semibold text-slate-700 mb-2">Page not found</h1>
        <p className="text-sm text-slate-400 mb-6">
          This application doesn't exist or was deleted.
        </p>
        <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        </a>
      </div>
    </div>
  );
}