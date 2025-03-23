"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface PendingVerification {
  id: string
  type: string
  timestamp: string
  userId: string
}

interface PendingVerificationsListProps {
  items: PendingVerification[]
  isLoading: boolean
  onItemClick: (item: PendingVerification) => void
  onRefresh: () => void
}

export function PendingVerificationsList({ items, isLoading, onItemClick, onRefresh }: PendingVerificationsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center p-3 border rounded-lg">
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-16 ml-2" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-400">
        <p>No pending verifications</p>
        <Button variant="ghost" size="sm" className="mt-2" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
      {items.map((item) => {
        const timeAgo = getTimeAgo(new Date(item.timestamp))

        return (
          <Button
            key={item.id}
            variant="outline"
            className="w-full justify-start p-3 h-auto"
            onClick={() => onItemClick(item)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 text-left">
                <p className="font-medium truncate">{item.id}</p>
                <p className="text-sm text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {timeAgo}
                </p>
              </div>
              <Badge variant="outline" className="ml-2">
                {item.type}
              </Badge>
            </div>
          </Button>
        )
      })}
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`
}

