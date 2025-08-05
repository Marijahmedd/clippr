import express from "express";

import dotenv from "dotenv"
import { router } from "./routes/routes";
const app = express()

dotenv.config()
app.use(router)
app.use((req,res)=>{
    res.status(400).json({error:"Not Found"})
})

const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`)
})