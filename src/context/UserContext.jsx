import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { isPremium as checkIsPremium } from '../services/creditService';
import { syncPremiumStatusToWidget } from '../services/widgetService';

// Create the UserContext
const UserContext = createContext(null);

// Default user data
const DEFAULT_USER_DATA = {
    name: 'Kullanıcı',
    avatar: 'male',
    streak: 0,
    totalPrayers: 0,
    installDate: new Date().toISOString(), // Track installation date
};

// UserProvider component
export function UserProvider({ children }) {
    const [userData, setUserData] = useState(DEFAULT_USER_DATA);
    const [isLoaded, setIsLoaded] = useState(false);
    const [premiumStatus, setPremiumStatus] = useState(false);

    // Initial load and sync with storage
    const syncWithStorage = () => {
        const stored = localStorage.getItem('userData');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (!parsed.installDate) parsed.installDate = new Date().toISOString();
                setUserData(parsed);
            } catch (e) {
                console.error('Failed to parse userData:', e);
            }
        }
        setIsLoaded(true);
    };

    // Listen for storage completion and premium changes
    useEffect(() => {
        const updatePremium = () => {
            const status = checkIsPremium();
            setPremiumStatus(status);
            syncPremiumStatusToWidget(status);
        };
        
        const handleStorageReady = () => {
            console.log('[UserContext] Storage ready, syncing...');
            syncWithStorage();
            updatePremium();
        };

        // KRİTİK: storageService.initialize() tamamlanmadan ASLA premium okuma!
        // storageReady event'ini kaçırmış olabiliriz — isReady flag ile kontrol et
        if (storageService.isReady) {
            handleStorageReady();
        }

        window.addEventListener('storageReady', handleStorageReady);
        window.addEventListener('premiumStatusChanged', updatePremium);
        
        return () => {
            window.removeEventListener('storageReady', handleStorageReady);
            window.removeEventListener('premiumStatusChanged', updatePremium);
        };
    }, []);

    // Persist to storage ONLY after initial load is complete
    useEffect(() => {
        if (isLoaded) {
            storageService.setItem('userData', userData);
        }
    }, [userData, isLoaded]);

    // Function to update avatar
    const updateAvatar = (newAvatar) => {
        setUserData(prev => ({
            ...prev,
            avatar: newAvatar
        }));
    };

    // Function to update user name
    const updateName = (newName) => {
        setUserData(prev => ({
            ...prev,
            name: newName
        }));
    };

    // Function to update any user data field
    const updateUserData = (updates) => {
        setUserData(prev => ({
            ...prev,
            ...updates
        }));
    };

    const value = {
        userData,
        updateAvatar,
        updateName,
        updateUserData,
        isPremium: premiumStatus,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

// Custom hook to use the UserContext
export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}

export default UserContext;
