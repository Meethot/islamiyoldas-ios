import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useHaptics } from '@/hooks/useMobile';
import {
    SettingsContainer,
    SettingsHeader,
    SettingsSection,
    SettingsToggle
} from '@/components/SettingsComponents';

export default function AppearanceSettings() {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const { selection } = useHaptics();

    return (
        <SettingsContainer>
            <SettingsHeader title="Görünüm" onBack={() => navigate(-1)} />

            <div className="p-5 space-y-6">
                <SettingsSection title="Tema">
                    <SettingsToggle
                        icon={isDarkMode ? Moon : Sun}
                        label="Gece Modu"
                        subtitle={isDarkMode ? "Karanlık tema aktif" : "Aydınlık tema aktif"}
                        active={isDarkMode}
                        onToggle={() => {
                            selection();
                            toggleTheme();
                        }}
                    />
                </SettingsSection>

                {/* Future: Font size, accent color etc. */}
                <p className="px-2 text-[9px] text-gray-400 dark:text-gray-500 italic text-center">
                    Daha fazla özelleştirme seçeneği yakında eklenecek.
                </p>
            </div>
        </SettingsContainer>
    );
}
