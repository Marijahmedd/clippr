import { socket, updateSocketAuth } from '@/lib/socket'
import React, { useEffect, useState } from 'react'
import { Bell, Plane, Send } from 'lucide-react'
import { useVideoStore } from '@/stores/videoStore'
import { useNavigate } from 'react-router-dom'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

const Notification = () => {
    const [newNotif, setNewNotif] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const { user } = useVideoStore()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { data: notificationData, isFetching, error } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await api.get('/me/notifications')
            return response.data
        },
        enabled: !!user,
        refetchOnWindowFocus: false,
    })

    const markAsReadMutation = useMutation({
        mutationFn: async () => {
            await api.patch('/me/notifications')
        },
        onSuccess: () => {
            // Avoid immediate refetch flicker; just update cached value
            queryClient.setQueryData(['notifications'], (old: any) =>
                old ? { ...old, isNewNotification: false } : old
            )
        }
    })

    // Set notifications and newNotif state from API response
    useEffect(() => {
        if (notificationData) {
            setNewNotif(notificationData.isNewNotification)

            const transformedNotifications = notificationData.notifications.map(notif => ({
                id: notif.id,
                senderName: notif.sender?.name || 'Unknown User',
                videoTitle: notif.video?.title || 'Untitled Video',
                videoId: notif.video?.id,
                message: `${notif.sender?.name || 'Someone'} shared a video: ${notif.video?.title}`,
                timestamp: new Date(notif.createdAt),
            }))

            setNotifications(transformedNotifications)
        }
    }, [notificationData])

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
        }

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
    }

    // Mark as read only AFTER popover is opened, decoupled from click
    useEffect(() => {
        if (isOpen && newNotif && !markAsReadMutation.isPending) {
            // Optimistically clear dot so Popover doesn't immediately close from refetch/focus churn
            setNewNotif(false)
            markAsReadMutation.mutate()
        }
    }, [isOpen, newNotif, markAsReadMutation.isPending])

    if (isFetching) {
        return (
            <Button
                variant="ghost"
                size="sm"
                className="relative text-white hover:bg-gray-800 focus:ring-2 focus:ring-blue-500/40"
            >
                <Bell className="h-5 w-5 animate-pulse" />
            </Button>
        )
    }

    const unreadDot = newNotif && (
        <span className="absolute -top-1 -right-1 inline-flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500/70 opacity-70 animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>
    )

    return (
        <Popover
            open={isOpen}
            onOpenChange={(open) => setIsOpen(open)}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`relative text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/70 transition 
                        ${newNotif ? 'ring-1 ring-red-500/40 shadow-red-500/10' : ''}`}
                >
                    <Bell className="h-5 w-5" />
                    {unreadDot}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-96 p-0 overflow-hidden rounded-lg border border-neutral-800 bg-gradient-to-b from-neutral-950 to-neutral-900 shadow-xl shadow-black/50"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/70 backdrop-blur">
                    <h3 className="text-sm font-semibold text-neutral-200 tracking-wide">Notifications</h3>
                    {newNotif === false && notifications.length > 0 && (
                        <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                            All caught up
                        </span>
                    )}
                </div>

                <div className="max-h-72 overflow-y-auto thin-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="mb-3 rounded-full bg-neutral-800/60 p-3">
                                <Bell className="h-5 w-5 text-neutral-600" />
                            </div>
                            <p className="text-sm font-medium text-neutral-300">No notifications</p>
                            <p className="mt-1 text-xs text-neutral-500">
                                You will see updates about videos shared with you here.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-neutral-800">
                            {notifications.map((n) => (
                                <li
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n.videoId)}
                                    className="group cursor-pointer px-4 py-3 hover:bg-neutral-800/70 transition relative"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 h-8 w-8 flex items-center justify-center rounded bg-neutral-800 text-neutral-500 group-hover:text-neutral-200 group-hover:bg-neutral-700 transition">
                                            <Send className="h-4 w-4" />

                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-neutral-500 flex items-center gap-2">
                                                <span className="font-medium text-neutral-300 group-hover:text-neutral-100">
                                                    {n.senderName}
                                                </span>
                                                <span className="text-[10px] uppercase tracking-wide text-neutral-600 group-hover:text-neutral-400">
                                                    shared
                                                </span>
                                                <span className="ml-auto text-[11px] text-neutral-500">
                                                    {formatTime(n.timestamp)}
                                                </span>
                                            </p>
                                            <p className="mt-1 text-sm text-neutral-300 font-medium truncate group-hover:text-neutral-100">
                                                {n.videoTitle}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-neutral-700/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-neutral-800 bg-neutral-900/60 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-xs px-2.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-neutral-100 transition border border-neutral-700"
                        >
                            Close
                        </button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

export default Notification