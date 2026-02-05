import React from 'react';
import { Shield, HelpCircle, Share2, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '@/hooks/useMobile';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import {
    SettingsContainer,
    SettingsHeader,
    SettingsSection,
    SettingsLink
} from '@/components/SettingsComponents';

export default function LegalSettings() {
    const navigate = useNavigate();
    const { selection, success } = useHaptics();

    const handleShareApp = async () => {
        selection();
        try {
            if (Capacitor.isNativePlatform()) {
                await Share.share({
                    title: 'İslami Yoldaş',
                    text: 'Namaz öğrenmek ve dini bilgilerimi tazelemek için bu harika uygulamayı kullanıyorum. Sen de dene!',
                    url: 'https://islamiyoldas.app',
                    dialogTitle: 'Uygulamayı Paylaş',
                });
                success();
            } else {
                await navigator.clipboard.writeText('https://islamiyoldas.app');
                alert('Bağlantı kopyalandı!');
                success();
            }
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const handleContact = () => {
        selection();
        const email = "destek@islamiyoldas.app";
        const subject = encodeURIComponent("İslami Yoldaş - İletişim");
        window.location.href = `mailto:${email}?subject=${subject}`;
    };

    return (
        <SettingsContainer>
            <SettingsHeader title="Yasal & Destek" onBack={() => navigate(-1)} />

            <div className="p-5 space-y-6">
                <SettingsSection title="Yasal Bilgiler">
                    <SettingsLink
                        icon={Shield}
                        label="Gizlilik Politikası"
                        onClick={() => navigate('/legal/privacy')}
                    />
                    <SettingsLink
                        icon={HelpCircle}
                        label="Hakkımızda"
                        onClick={() => navigate('/legal/about')}
                    />
                </SettingsSection>

                <SettingsSection title="Destek">
                    <SettingsLink
                        icon={Share2}
                        label="Uygulamayı Paylaş"
                        subtitle="Arkadaşlarınızla paylaşın"
                        onClick={handleShareApp}
                    />
                    <SettingsLink
                        icon={MessageSquare}
                        label="Bize Ulaşın"
                        subtitle="Soru ve önerileriniz için"
                        onClick={handleContact}
                    />
                </SettingsSection>

                {/* Version Info */}
                <div className="py-10 text-center">
                    <p className="text-[10px] text-gray-300 dark:text-gray-600 font-bold uppercase tracking-[0.3em]">
                        İslami Yoldaş v1.0.0
                    </p>
                    <p className="text-[8px] text-gray-200 dark:text-gray-700 mt-2 italic">
                        Maneviyat Yolunda Beraberiz
                    </p>
                </div>
            </div>
        </SettingsContainer>
    );
}
