import { socket, updateSocketAuth } from '@/lib/socket'
import React, { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useVideoStore } from '@/stores/videoStore'
import { useNavigate } from 'react-router-dom'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

const Notification = () => {
    const [newNotif, setNewNotif] = useState(false)
    const [notifications, setNotifications] = useState([])
    const { user } = useVideoStore()
    const navigate = useNavigate()

    const { data, isFetching, error } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await api.get('/me/notifications')
            return response.data.notifications
        },
        enabled: !!user,
        refetchOnWindowFocus: false, // Prevent double fetching
    })

    // ✅ Move this inside useEffect
    useEffect(() => {
        if (data && Array.isArray(data)) {
            console.log('Setting notifications:', data)

            // Transform backend data to frontend format
            const transformedNotifications = data.map(notif => ({
                id: notif.id,
                senderName: notif.sender?.name || 'Unknown User',
                videoTitle: notif.video?.title || 'Untitled Video',
                videoId: notif.video?.id,
                message: `${notif.sender?.name || 'Someone'} shared a video: ${notif.video?.title}`,
                timestamp: new Date(notif.createdAt),
            }))

            setNotifications(transformedNotifications)
        }
    }, [data]) // Only run when data changes

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!user || !token) {
            updateSocketAuth(null)
            socket.disconnect()
            return
        }

        updateSocketAuth(token)

        if (!socket.connected) {
            socket.connect()
        } else {
            console.log('socket already connected')
        }

        socket.on('connect', () => {
            console.log('user connected from frontend', socket.id)
        })

        socket.on('newNotification', (data) => {
            const newNotification = {
                id: data.id,
                senderName: data.senderName,
                videoTitle: data.videoTitle,
                videoId: data.videoId,
                message: `${data.senderName} shared a video: ${data.videoTitle}`,
                timestamp: new Date(data.createdAt),
            }
            setNotifications(prev => [newNotification, ...prev])
            setNewNotif(true)
        })

        return () => {
            socket.off('newNotification')
            socket.off('connect')
        }
    }, [user])

    const formatTime = (date) => {
        const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
        return `${Math.floor(minutes / 1440)}d ago`
    }

    const handleNotificationClick = (videoId) => {
        navigate(`/video/${videoId}`)
        setNewNotif(false)
    }

    // Show loading state
    if (isFetching) {
        return (
            <Button variant="ghost" size="sm" className="relative text-white hover:bg-gray-800">
                <Bell className="h-5 w-5 animate-pulse" />
            </Button>
        )
    }

    return (
        <Popover onOpenChange={() => setNewNotif(false)}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative text-white hover:bg-gray-800">
                    <Bell className="h-5 w-5" />
                    {newNotif && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-80 bg-black border-gray-800" align="end">
                <h3 className="font-semibold text-white mb-3">Notifications</h3>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">No notifications</p>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className="p-3 bg-gray-900 rounded hover:bg-gray-800 cursor-pointer transition-colors"
                                onClick={() => handleNotificationClick(notification.videoId)}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                        <p className="text-sm text-gray-300 leading-tight">
                                            <span className="font-medium text-white">
                                                {notification.senderName}
                                            </span>
                                            {' '}shared a video with you
                                        </p>
                                        <p className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                            {formatTime(notification.timestamp)}
                                        </p>
                                    </div>

                                    <p className="text-sm text-blue-400 font-medium truncate">
                                        {notification.videoTitle}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default Notification