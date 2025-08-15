import { Request, Response } from 'express'
import { prisma } from "../lib/db";
import { io } from "../app";

export async function shareVideo(req: Request, res: Response) {
    const { recepientMail, videoId } = req.body
    // console.log(req.user)

    if (!recepientMail || !videoId
    ) {
        return res.status(400).json({ error: "Missing Recepient mail or video id" })
    }
    if (!req.user?.id) {
        return res.status(400).json({ error: "Sender Id is missing" })
    }
    const senderId = req.user.id
    // Prevent sharing video with yourself.
    if (req.user.email === recepientMail) {
        return res.status(400).json({ error: "Cannot share video to this email" })
    }


    const senderName = req.user.name
    let videoData = null
    try {
        videoData = await prisma.video.findUnique({
            where: {
                id: videoId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })

        if (!videoData || videoData.user.id !== senderId) {
            return res.status(400).json({ error: "Video does not exist or do not belong to this user" })
        }
    }
    catch {
        return res.status(500).json({ error: "Error fetching data" })
    }


    try {
        const recepient = await prisma.user.findUnique({
            where: {
                email: recepientMail
            }
        })
        if (!recepient) {
            return res.status(404).json({ error: "This User Do not exist" })
        }
        const newNotification = await prisma.notification.create({
            data: {
                senderId,
                recepientId: recepient?.id,
                videoId,
            }
        })

        const notification = {
            id: newNotification.id,
            senderId,
            senderName,
            videoTitle: videoData.title,
            createdAt: newNotification.createdAt
        }

        io.to(recepient.id).emit("newNotification", notification)
        return res.status(200).json({ message: "Video Shared" })
    } catch {
        return res.status(500).json({ error: "Error sharing video" })

    }
}


export async function getNotifications(req: Request, res: Response) {
    const userId = req.user?.id
    if (!userId) {
        return res.status(400).json({ error: "missing user ID" })

    }
    try {
        const notifications = await prisma.notification.findMany({
            where: {
                recepientId: userId
            },

            select: {
                id: true,
                createdAt: true,
                sender: {
                    select: {
                        name: true

                    }
                },
                video: {

                    select: {
                        title: true,
                        id: true
                    }

                }

            },
            orderBy: {
                createdAt: "desc"
            }
        })
        return res.status(200).json({
            notifications
        })
    } catch (error) {
        return res.status(500).json({ error: "Error fetching notifications" })
    }
}