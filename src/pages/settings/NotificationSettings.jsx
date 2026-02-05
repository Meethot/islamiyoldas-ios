import React from 'react';
import { Bell, Loader2, Info, Moon, Share2, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '@/hooks/useMobile';
import { usePrayerTimes } from '@/context/PrayerTimesContext';
import {
    SettingsContainer,
    SettingsHeader,
    SettingsSection,
    SettingsToggle
} from '@/components/SettingsComponents';

export default function NotificationSettings() {
    const navigate = useNavigate();
    const { selection } = useHaptics();
    const { settings, updateSettings } = usePrayerTimes();

    return (
        <SettingsContainer>
            <SettingsHeader title="Bildirimler" onBack={() => navigate(-1)} />

            <div className="p-5 space-y-6">
                {/* Prayer Notifications */}
                <SettingsSection title="Namaz Vakitleri">
                    <SettingsToggle
                        icon={Bell}
                        label="Ezan Vakti"
                        subtitle="Vakit yaklaştığında haberdar et"
                        active={settings.adhanEnabled}
                        onToggle={() => {
                            selection();
                            updateSettings({ adhanEnabled: !settings.adhanEnabled });
                        }}
                    />
                    {settings.adhanEnabled && (
                        <SettingsToggle
                            icon={Loader2}
                            label="Sadece Titreşim"
                            subtitle="Ses çalma, sadece titret"
                            active={settings.vibrateOnly}
                            onToggle={() => {
                                selection();
                                updateSettings({ vibrateOnly: !settings.vibrateOnly });
                            }}
                        />
                    )}
                </SettingsSection>

                {/* Daily Inspiration */}
                <SettingsSection title="Günlük İlham">
                    <SettingsToggle
                        icon={Info}
                        label="Günün Ayeti"
                        subtitle="Her gün yeni bir ilham"
                        active={settings.verseEnabled}
                        onToggle={() => {
                            selection();
                            updateSettings({ verseEnabled: !settings.verseEnabled });
                        }}
                    />
                    <SettingsToggle
                        icon={MessageSquare}
                        label="Cuma Mesajı"
                        subtitle="Her Cuma manevi bir hatırlatma al"
                        active={settings.fridayMessage}
                        onToggle={() => {
                            selection();
                            updateSettings({ fridayMessage: !settings.fridayMessage });
                        }}
                    />
                </SettingsSection>

                {/* Prayer Motivation */}
                <SettingsSection title="Namaz Motivasyonu">
                    <SettingsToggle
                        icon={Moon}
                        label="Namaz Modu"
                        subtitle="Vakit girince huzurlu odaklanma modu"
                        active={settings.prayerFocusMode}
                        onToggle={() => {
                            selection();
                            updateSettings({ prayerFocusMode: !settings.prayerFocusMode });
                        }}
                    />
                    <SettingsToggle
                        icon={Share2}
                        label="Manevi Ödüller"
                        subtitle="Namaz sonrası hadis ve dualar"
                        active={settings.spiritualRewards}
                        onToggle={() => {
                            selection();
                            updateSettings({ spiritualRewards: !settings.spiritualRewards });
                        }}
                    />
                </SettingsSection>

                {/* Info Note */}
                <p className="px-2 text-[9px] text-gray-400 dark:text-gray-500 italic text-center">
                    Bildirimlerin çalışması için uygulama izinlerinin açık olduğundan emin olun.
                </p>
            </div>
        </SettingsContainer>
    );
}
