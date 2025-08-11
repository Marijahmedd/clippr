'use client'
import { GoogleLogin } from '@react-oauth/google';
import { useVideoStore } from '@/stores/videoStore';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

function GoogleAuth() {
    const { login } = useVideoStore();
    const { toast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient(); const responseMessage = async (credentials: any) => {
        try {
            const response = await api.post('/login/google', { credential: credentials.credential });

            // Clear any cached data from previous user
            queryClient.clear();

            // Store user data and token
            login(response.data.userData, response.data.token);

            toast({
                title: "Success!",
                description: "You have been logged in successfully",
            });

            // Navigate to videos page
            navigate('/videos');
        } catch (error) {
            console.error('Login error:', error);
            toast({
                title: "Login failed",
                description: "Failed to login with Google. Please try again.",
                variant: "destructive",
            });
        }
    };

    const errorMessage = () => {
        toast({
            title: "Login failed",
            description: "An error occurred while logging in with Google",
            variant: "destructive",
        });
    };

    return (
        <div className="w-fit mx-auto">
            <GoogleLogin onSuccess={responseMessage} onError={errorMessage} />
        </div>
    );
}

export default GoogleAuth;
