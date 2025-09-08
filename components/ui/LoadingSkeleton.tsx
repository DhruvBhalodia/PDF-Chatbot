export function MessageSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-gray-200" />
      <div className="flex-1 max-w-2xl">
        <div className="bg-gray-200 rounded-lg p-4">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-300 rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function DocumentSkeleton() {
  return (
    <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-gray-300 rounded" />
        <div className="flex-1">
          <div className="h-5 bg-gray-300 rounded w-3/4 mb-2" />
          <div className="flex items-center gap-4">
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function WorkspaceSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
        <div className="h-4 bg-gray-200 rounded w-12" />
      </div>
      <div className="h-6 bg-gray-300 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  )
}
