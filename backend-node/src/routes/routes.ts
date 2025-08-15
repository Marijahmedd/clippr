import express from "express";
import { authenticator } from "../controllers/controller";
import { AuthenticatedRequest } from "../controllers/middleware";
import { createVideo, deleteVideo, getVideo, getVideoData } from "../controllers/video.controller";
import { getNotifications, shareVideo } from "../controllers/notifications.controller";
import { getPresignedUrl } from "../controllers/upload.controller";

export const router = express.Router();

router.get("/", (_req, res) => {
    res.send("hello from router")
})

router.post("/presigned-url", AuthenticatedRequest, getPresignedUrl)




router.post("/video", AuthenticatedRequest, createVideo)
router.get("/video", AuthenticatedRequest, getVideo)
router.get("/video/:id", getVideoData)

router.delete("/video", AuthenticatedRequest, deleteVideo)

router.get("/me/notifications", AuthenticatedRequest, getNotifications)
router.post("/video/share", AuthenticatedRequest, shareVideo)




router.get('/protected', AuthenticatedRequest, (req, res) => {
    return res.status(200).json({ message: "succfully passed throguh middleware", user: [req.user] })
})


router.post("/login/google", authenticator)

