import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/db";
import jwt from "jsonwebtoken"
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function authenticator(req: Request, res: Response) {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: "Missing credential token" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(401).json({ error: "Invalid ID token payload" });
    }

    type userData = {
      email:string
      name: string
      image: string
    }
    console.log(payload)
    const userData:userData = {
      email: payload.email,
      name: payload.name || "",
      image : payload.picture || "",
    }
    try {
      let user = await prisma.user.findUnique({
        where:{
          email:payload.email,
        }
      })
      
      if (!user){
         user =  await prisma.user.create({
          data:userData
        })
      }
      const token = jwt.sign({userId:user.id,email:payload.email},process.env.JWT_SECRET!,{expiresIn:"1d"})
      return res.status(200).json({message:"Authenticated Successfully",token,userData})

    } catch (error) {
      return res.status(400).json({message:"Error Signing in "})
    }
    
  } catch (error) {
    console.error("Error verifying Google ID token:", error);
    return res.status(401).json({ error: "Invalid or expired Google token" });
  }
}
