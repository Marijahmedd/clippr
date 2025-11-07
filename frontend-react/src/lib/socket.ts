import { io } from 'socket.io-client';

export const socket = io(import.meta.env.VITE_WS_BASE_URL, {
    autoConnect: false,
    path: "/ws/"
});

export const updateSocketAuth = (token: string | null) => {
    socket.auth = { token };
};  