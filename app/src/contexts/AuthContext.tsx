import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { apiService } from '@/services/api.service';
import { User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ONBOARDING_KEY = '@checkmate_onboarding_complete';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Set to false - no auth check needed

  // Auth disabled - skip authentication check
  // useEffect(() => {
  //   checkAuthStatus();
  // }, []);

  const checkAuthStatus = async () => {
    // Auth disabled - do nothing
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      setUser(response.user);
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMsg = error.response?.data?.message 
        || error.message 
        || 'Login failed. Please try again.';
      throw new Error(errorMsg);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await apiService.register(name, email, password);
      setUser(response.user);
      // Mark onboarding as complete after registration
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error: any) {
      console.error('Registration failed:', error);
      const errorMsg = error.response?.data?.message 
        || error.message 
        || 'Registration failed. Please try again.';
      throw new Error(errorMsg);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const userProfile = await apiService.getProfile();
      setUser(userProfile);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
