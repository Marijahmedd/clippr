import express from "express";
import cors from "cors"
import dotenv from "dotenv"
import { router } from "./routes/routes";
dotenv.config()

const app = express()
app.use(cors({ origin: ['http://localhost:5173','http://localhost:3001'], credentials: true }))
app.use(express.json())
app.use('/api',router)
app.use((_req,res)=>{
    res.status(400).json({error:"Not Found"})
})

const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`)
})