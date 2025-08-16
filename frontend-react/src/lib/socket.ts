import { io } from 'socket.io-client';

export const socket = io('http://localhost:3000', {
    autoConnect: false,
});



export const updateSocketAuth = (token: string | null) => {
    socket.auth = { token };
};