'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { VaultItem, EncryptedVaultItem } from '@/types';
import { decodeToken, isTokenExpired } from '@/lib/clientAuth';

interface User {
  id: string;
  email: string;
}

interface AppContextType {
  // Authentication
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Master password for encryption/decryption
  masterPassword: string | null;
  setMasterPassword: (password: string) => void;
  clearMasterPassword: () => void;
  
  // Vault items cache
  vaultItems: VaultItem[];
  setVaultItems: (items: VaultItem[]) => void;
  addVaultItem: (item: VaultItem) => void;
  updateVaultItem: (item: VaultItem) => void;
  removeVaultItem: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to false to prevent hydration errors
  const [mounted, setMounted] = useState(false);
  const [masterPassword, setMasterPasswordState] = useState<string | null>(null);
  const [vaultItems, setVaultItemsState] = useState<VaultItem[]>([]);

  // Apply dark mode class immediately to prevent flash
  useEffect(() => {
    if (!mounted) return; // Don't apply changes until mounted
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode, mounted]);

  // Initialize from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    // Check for saved token
    const savedToken = localStorage.getItem('token');
    if (savedToken && !isTokenExpired(savedToken)) {
      const decoded = decodeToken(savedToken);
      if (decoded) {
        setToken(savedToken);
        setUser({
          id: decoded.userId,
          email: decoded.email
        });
      } else {
        localStorage.removeItem('token');
      }
    } else if (savedToken) {
      // Token is expired
      localStorage.removeItem('token');
    }

    // Initialize dark mode after mounting
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedDarkMode === 'true' || (savedDarkMode === null && prefersDark)) {
      setIsDarkMode(true);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setMasterPasswordState(null);
    setVaultItemsState([]);
    localStorage.removeItem('token');
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    console.log('Toggling dark mode:', { current: isDarkMode, new: newDarkMode });
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      console.log('Added dark class, current classes:', document.documentElement.className);
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Removed dark class, current classes:', document.documentElement.className);
    }
  };

  const setMasterPassword = (password: string) => {
    setMasterPasswordState(password);
  };

  const clearMasterPassword = () => {
    setMasterPasswordState(null);
  };

  const setVaultItems = (items: VaultItem[]) => {
    setVaultItemsState(items);
  };

  const addVaultItem = (item: VaultItem) => {
    setVaultItemsState(prev => [item, ...prev]);
  };

  const updateVaultItem = (updatedItem: VaultItem) => {
    setVaultItemsState(prev => 
      prev.map(item => item._id === updatedItem._id ? updatedItem : item)
    );
  };

  const removeVaultItem = (id: string) => {
    setVaultItemsState(prev => prev.filter(item => item._id !== id));
  };

  const value: AppContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    isDarkMode,
    toggleDarkMode,
    masterPassword,
    setMasterPassword,
    clearMasterPassword,
    vaultItems,
    setVaultItems,
    addVaultItem,
    updateVaultItem,
    removeVaultItem,
  };

  // Don't render until mounted to prevent hydration errors
  if (!mounted) {
    return (
      <AppContext.Provider value={value}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}