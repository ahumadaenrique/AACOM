"use client"

import { useState } from "react"

interface AgentAvatarProps {
  type: string
  name: string
  className?: string
}

export function AgentAvatar({ type, name, className = "w-10 h-10" }: AgentAvatarProps) {
  const [imageError, setImageError] = useState(false)

  const getAvatarUrl = (roleType: string) => {
    switch (roleType) {
      case 'SOCIAL_MEDIA_MANAGER':
        return '/avatars/social-media-manager.png'
      case 'EXECUTIVE_ASSISTANT':
        return '/avatars/executive-assistant.png'
      case 'RECEPTIONIST':
        return '/avatars/receptionist.png'
      default:
        return null
    }
  }

  const avatarUrl = getAvatarUrl(type)
  const initials = name ? name.substring(0, 2).toUpperCase() : "AA"

  // Base sizing and rounded styling matching the design system
  const containerClasses = `rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-indigo-500/30 bg-indigo-500/20 text-indigo-400 ${className}`

  if (avatarUrl && !imageError) {
    return (
      <div className={containerClasses}>
        <img
          src={avatarUrl}
          alt={name || "Agent Avatar"}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      <span className="font-medium">
        {initials}
      </span>
    </div>
  )
}
