import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const [userData, setUserData] = useState(() => {
        // Initialize from localStorage or use defaults
        const stored = localStorage.getItem('userData');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Migration: Ensure installDate exists for existing users
                if (!parsed.installDate) {
                    parsed.installDate = new Date().toISOString();
                }
                return parsed;
            } catch (e) {
                console.error('Failed to parse userData from localStorage:', e);
                return DEFAULT_USER_DATA;
            }
        }
        return DEFAULT_USER_DATA;
    });

    // Persist to localStorage whenever userData changes
    useEffect(() => {
        localStorage.setItem('userData', JSON.stringify(userData));
    }, [userData]);

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
