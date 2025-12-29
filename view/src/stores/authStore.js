import {create} from 'zustand'
import { axiosInstance } from "../libs/axios"
import toast from 'react-hot-toast';


export const useAuthStore = create( (set,get)=> ({
    authUser : false,
    isCheckingAuth : true,
    isLogging : false,
    isSigning : false,
    checkAuth : async ()=> {
        try {
            const res = await axiosInstance.get("/auth/me");
            set( { authUser : res.data});
        } catch (error) {
            console.log( "Error in authentication", error);
            set( { authUser : null});
        }finally{
            set( {isCheckingAuth: false});
        }
    },

    login : async (formData)=> {
        set( {isLogging : true});
        try {
            const res = await axiosInstance.post("/auth/login",formData);
            set({authUser: res.data});
            toast.success(res.data.msg || "Logged in successfully");
        } catch (error) {
            let errorMessage = "Login failed. Please try again.";
            if (error.response) {
                // HTTP error from server
                errorMessage = `HTTP ${error.response.status}: ${error.response.data?.msg || error.message}`;
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timed out. Please check your connection and try again.';
            } else if (error.request && !error.response) {
                errorMessage = 'Network error: Cannot connect to server. Is it running?';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }
            console.error('Login error full object:', error);
            if(error.response){
              console.error('Error response data:', error.response.data);
              console.error('Error response status:', error.response.status);
              console.error('Error response headers:', error.response.headers);
            }
            toast.error(errorMessage);
        }finally{
            set({ isLogging : false});
        }
    },
    signUp : async (formData)=> {
        set( {isSigning : true});
        try {
            const res = await axiosInstance.post("/auth/signup",formData);
            set({authUser: res.data});
            toast.success("Signed up successfully");
        } catch (error) {
            let errorMessage = "Sign up failed. Please try again.";
            if (error.response) {
                // HTTP error from server
                errorMessage = `HTTP ${error.response.status}: ${error.response.data?.msg || error.message}`;
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timed out. Please check your connection and try again.';
            } else if (error.request && !error.response) {
                errorMessage = 'Network error: Cannot connect to server. Is it running?';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }
            console.error('Signup error full object:', error);
            if(error.response){
              console.error('Error response data:', error.response.data);
              console.error('Error response status:', error.response.status);
              console.error('Error response headers:', error.response.headers);
            }
            toast.error(errorMessage);
        }finally{
            set({ isSigning : false});
        }
    },
    logout : async ()=> {
        try {
            const res = await axiosInstance.post("/auth/logout");
            set({ authUser : null});
            toast.success(res.data?.msg || "Logged out successfully");
        } catch (error) {
            const errorMessage = error.response?.data?.msg || error.message || "Logout failed";
            toast.error(errorMessage);
            console.error("Logout error:", error);
        }
    },
    
    updateAuthUser: (userData) => {
        set({ authUser: { ...get().authUser, ...userData }});
    }

}));