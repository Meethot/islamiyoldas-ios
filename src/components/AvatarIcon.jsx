import React from 'react';
import { User, Heart, Box, BookOpen, Moon, Landmark } from 'lucide-react';

export function BeadsIcon({ className, size = 24 }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="5" r="2" />
            <circle cx="17.5" cy="7.5" r="2" />
            <circle cx="19" cy="13" r="2" />
            <circle cx="16" cy="18.5" r="2" />
            <circle cx="11" cy="20" r="2" />
            <circle cx="6.5" cy="16.5" r="2" />
            <circle cx="5" cy="11" r="2" />
            <circle cx="7.5" cy="6" r="2" />
            <path d="M11 20l1 3" />
        </svg>
    );
}

export const AVATAR_MAP = {
    'male': { icon: User, label: 'Bey' },
    'female': { icon: Heart, label: 'Hanım' },
    'beads': { icon: BeadsIcon, label: 'Tesbih' },
    'kaaba': { icon: Box, label: 'Kabe' },
    'quran': { icon: BookOpen, label: 'Kuran' },
    'moon': { icon: Moon, label: 'Hilal' },
    'mosque': { icon: Landmark, label: 'Cami' }
};

export default function AvatarIcon({ id, className, size = 24 }) {
    const IconComponent = AVATAR_MAP[id]?.icon || User;
    return <IconComponent className={className} size={size} />;
}
