'use client'

import Link from 'next/link'
import { Avatar } from './Avatar'
import { formatDistanceToNow } from '@/core/utils/date'
import { cn } from '@/core/utils/cn'
import styles from './NotificationItem.module.css'

interface NotificationItemProps {
  notification: any
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { type, payload, created_at, read } = notification
  const timeAgo = formatDistanceToNow(new Date(created_at))

  const getMessage = () => {
    const actorName = payload.actor_name || 'Someone'
    switch (type) {
      case 'post_liked':
        return <span><strong>{actorName}</strong> liked your post</span>
      case 'comment_liked':
        return <span><strong>{actorName}</strong> liked your comment</span>
      case 'post_commented':
        return <span><strong>{actorName}</strong> commented on your post: &quot;{payload.comment_content}&quot;</span>
      case 'comment_replied':
        return <span><strong>{actorName}</strong> replied to your comment: &quot;{payload.reply_content}&quot;</span>
      case 'new_follower':
        return <span><strong>{actorName}</strong> started following you</span>
      case 'post_mentioned':
        return <span><strong>{actorName}</strong> mentioned you in a post</span>
      default:
        return <span>New activity from <strong>{actorName}</strong></span>
    }
  }

  const getHref = () => {
    if (payload.post_id) return `/post/${payload.post_id}`
    if (type === 'new_follower' && payload.actor_username) return `/profile/${payload.actor_username}`
    if (type === 'new_follower') return `/profile/${payload.actor_name}`
    return '#'
  }

  return (
    <Link href={getHref()} className={cn(styles.item, !read && styles.unread)}>
      <Avatar src={payload.actor_avatar} fallback={payload.actor_name || '?'} size="sm" />
      <div className={styles.content}>
        <p className={styles.message}>{getMessage()}</p>
        <span className={styles.time}>{timeAgo}</span>
      </div>
      {!read && <div className={styles.unreadDot} />}
    </Link>
  )
}
