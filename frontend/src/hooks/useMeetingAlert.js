import { useEffect } from 'react'

// Request browser notification permission
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

// Schedule a browser notification for a meeting
export function scheduleMeetingAlert(title, place, meetingTime) {
  if (!('Notification' in window)) return

  const now      = new Date().getTime()
  const meetTime = new Date(meetingTime).getTime()
  const fiveMin  = 5 * 60 * 1000
  const oneMin   = 1 * 60 * 1000

  // 5 minutes before
  const diff5 = meetTime - fiveMin - now
  if (diff5 > 0) {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('📚 BookXchange — Meeting in 5 minutes!', {
          body: `📍 ${place}\n🕐 ${new Date(meetingTime).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
          })}`,
          icon: '/favicon.svg',
        })
      }
    }, diff5)
  }

  // 1 minute before
  const diff1 = meetTime - oneMin - now
  if (diff1 > 0) {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('📚 BookXchange — Meeting in 1 minute!', {
          body: `📍 ${place} — Get ready!`,
          icon: '/favicon.svg',
        })
      }
    }, diff1)
  }

  // At meeting time
  const diffNow = meetTime - now
  if (diffNow > 0) {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('📚 BookXchange — Meeting Time Now!', {
          body: `📍 ${place} — Time to exchange your books! 🔄`,
          icon: '/favicon.svg',
        })
      }
    }, diffNow)
  }
}

export default function useMeetingAlert(messages) {
  useEffect(() => {
    if (!messages || messages.length === 0) return

    requestNotificationPermission()

    // Schedule alerts for all future meeting messages
    messages.forEach((msg) => {
      if (msg.message_type === 'meeting' && msg.meeting_time) {
        const meetTime = new Date(msg.meeting_time).getTime()
        if (meetTime > Date.now()) {
          scheduleMeetingAlert('Meeting', msg.meeting_place, msg.meeting_time)
        }
      }
    })
  }, [messages])
}
