**Clippr** 

Clippr is a web platform that lets users record, upload, and share videos instantly, all from the browser. Users can log in via Google OAuth, store videos securely in AWS S3, and share them with other users in real-time using WebSockets. Built for seamless collaboration and fast video sharing.

**Architecture Diagram**

<img width="1404" height="816" alt="Clippr arch" src="https://github.com/user-attachments/assets/7878d85e-86a9-4967-a2e6-0d67cac4f101" />


**Features**

User Authentication: Google OAuth + JWT for secure login.

Screen Recording in Browser: Record directly using React Media Library.

Video Uploads: Upload videos using S3 pre-signed URLs.

Real-Time Sharing: Share videos with other users via email, receiving instant browser notifications.

Fast Media Delivery: Videos served through CloudFront CDN for low-latency playback worldwide.

Horizontal Scalability: WebSocket notifications powered by Redis Pub/Sub.

Database: Postgres with Prisma ORM for structured and reliable storage.

**Tech Stack**

Frontend: React, React Media Library

Backend: Express.js, WebSockets

Database: PostgreSQL with Prisma

Storage: AWS S3 with pre-signed URLs

Realtime: WebSockets + Redis Pub/Sub

Authentication: Google OAuth + JWT

**Architecture Highlights**

Scalable Real-Time Notifications: Redis Pub/Sub allows multiple server instances to broadcast notifications reliably.

Secure & Fast Media Storage: S3 with pre-signed URLs + CloudFront CDN ensures secure, low-latency video delivery.
