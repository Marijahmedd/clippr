import { Request, Response } from "express";
import { prisma } from "../lib/db";

export async function createVideo(req:Request,res:Response){
    type VideoRequest = {
        url:string,
        title:string,
        description?:string
    }

    const {url,title,description} = req.body as VideoRequest
    if(!url || ! title){
        return res.status(400).json({error:"No url or title provided"})
    }
    const userId = req.user?.id as string
    try {
    //     const userData = await prisma.user.findUnique({
    //     where: {
    //         id:userId
    //     }
    // })
    //     if (!userData){
    //         return res.status(404).json({error:"User not found"})
    //     }
        const videoData = await prisma.video.create({
        data:{
            url,
            title,
            description,
            user:{
                connect:{id:userId}
            }
        }
    })
    return res.status(201).json({message:"Video created successfully", videoData})
} catch (error) {
        return res.status(500).json({error:"Error creating video"})
    }


}


export async function getVideo(req:Request,res:Response) {
    const userId = req.user?.id
    try {
        const userVideos = await prisma.video.findMany({
        where:{
            userId
        }
    })
    return res.status(200).json({videos:userVideos})
    } catch (error) {
        res.status(500).json({error:"Unable to fetch videos"})
    }
    
}




export async function deleteVideo(req:Request,res:Response) {
    const userId = req.user?.id
    const videoId = req.body.videoId
    try {
        const video = await prisma.video.findUnique({
            where:{
                id:videoId
            },
            include:{
                user:true
            }
        })
        if(!video){
            return res.status(404).json({error:"Video do not exist"})
        }

        if (video?.user.id !== userId){
            return res.status(403).json({error:"Unauthorized Action"})
        }

        const response = await prisma.video.delete({
            where:{
                id:videoId
            }
        })

        return res.status(200).json({message:"video deleted",response})

    } catch (error) {
        res.status(500).json({error:"Unable to delete"})
    }
    
}