import React, { createContext, useState, useEffect, useContext } from 'react';

const LeagueContext = createContext(null);

export function LeagueProvider({ children }) {
    const [currentLeagueCode, setCurrentLeagueCode] = useState(() => {
        // Load from localStorage on initial render
        return localStorage.getItem('currentLeagueCode') || null;
    });

    // Persist to localStorage whenever it changes
    useEffect(() => {
        if (currentLeagueCode) {
            localStorage.setItem('currentLeagueCode', currentLeagueCode);
        }
    }, [currentLeagueCode]);

    return (
        <LeagueContext.Provider value={{ currentLeagueCode, setCurrentLeagueCode }}>
            {children}
        </LeagueContext.Provider>
    );
}

// Custom hook to use the league context
export function useLeagueContext() {
    const context = useContext(LeagueContext);
    if (!context) {
        throw new Error('useLeagueContext must be used within a LeagueProvider');
    }
    return context;
}