export function AdminSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 w-48 rounded-md bg-canvas-soft" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-lg bg-canvas-soft" />
        ))}
      </div>
      <div className="h-72 rounded-lg bg-canvas-soft" />
    </div>
  );
}
