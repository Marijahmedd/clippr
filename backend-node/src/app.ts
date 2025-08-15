import express from "express";
import cors from "cors"
import dotenv from "dotenv"
import { router } from "./routes/routes";
import { Server } from "socket.io";
import jwt from 'jsonwebtoken'
import http from 'http'
dotenv.config()

const app = express()
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use(express.json())
app.use('/api', router)
app.use((_req, res) => {
    res.status(400).json({ error: "Not Found" })
})

const httpServer = http.createServer(app)

export const io = new Server(httpServer, {
    cors: {
        credentials: true,
        origin: process.env.FRONTEND_URL
    }
})

// io.use() middleware here that will check jwt and attach the userId from jwt to socket object and will call next ..
declare module "socket.io" {
    interface Socket {
        userId?: string;
        userEmail?: string;
    }
}
io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
        return next(new Error("Missing token"))
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
        socket.userId = decoded.userId || decoded.id
        socket.userEmail = decoded.email

        console.log("Token verified for user:", socket.userEmail)
        next()
    } catch (error) {
        console.log("Invalid token:", error)
        return next(new Error("Invalid token"))
    }

})

io.on("connection", (socket) => {
    // every socket initiated by the same userId will always join the same room, so user can open multiple tabs and all his sockets will be in one room. which is his ID.. also we can target a notif to user as we already know his userID
    socket.join(socket.userId as string)

    console.log(`${socket.userEmail} joined the room ${socket.userId}`)
    socket.on("disconnect", (reason) => {
        console.log(`${socket.userEmail} disconnected due to ${reason}`)

    })

})

io.on("disconnect", (socket) => {
    console.log(`${socket.userEmail} disconnected`)

})




const PORT = process.env.PORT || 3000

httpServer.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})