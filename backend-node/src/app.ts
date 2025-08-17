import express from "express";
import cors from "cors"
import dotenv from "dotenv"
import { createAdapter } from "@socket.io/redis-adapter";
import { router } from "./routes/routes";
import { Server } from "socket.io";
import jwt from 'jsonwebtoken'
import http from 'http'
import Redis from 'ioredis'
dotenv.config()


const pubClient = new Redis(process.env.REDIS_URI!);
const subClient = pubClient.duplicate();

const client = pubClient.duplicate();



async function redisTest() {
    await client.set('foo', 'bar');
    const res = await client.get('foo')
    if (res == 'bar') {
        console.log('redis working')
        console.log(res)
    }
    else {
        console.log('error in redis')
        process.exit(0)
    }
}

redisTest()


const app = express()
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use(express.json())
app.use('/api', router)

const httpServer = http.createServer(app)

export const io = new Server(httpServer, {
    cors: {
        credentials: true,
        origin: process.env.FRONTEND_URL
    },
    adapter: createAdapter(pubClient, subClient)
    , path: "/ws/"
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
        console.log("no token present in ws req")
        return next(new Error("Missing token"))

    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
        socket.userId = decoded.userId || decoded.id
        socket.userEmail = decoded.email
        console.log("ws request passed middleware")

        next()
    } catch (error) {
        return next(new Error("Invalid token"))
    }

})

io.on("connection", (socket) => {
    // every socket initiated by the same userId will always join the same room, so user can open multiple tabs and all his sockets will be in one room. which is his ID.. also we can target a notif to user as we already know his userID
    socket.join(socket.userId as string)

    console.log(`${socket.userEmail} joined the room ${socket.userId}`)
    socket.on("disconnect", (reason) => {
        // console.log(`${socket.userEmail} disconnected due to ${reason}`)

    })

})




app.use((req, res) => {
    console.log('404 for ', req.url)
    res.status(400).json({ error: "Not Found" })
})

async function shutdown() {
    console.log("Shutting down...");
    io.sockets.sockets.forEach((s) => s.disconnect(true));
    await pubClient.quit().catch(() => { });
    await subClient.quit().catch(() => { });
    await client.quit().catch(() => { });
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);




const PORT = process.env.PORT

httpServer.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})