import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LegalSettings() {
    const navigate = useNavigate();
    const { t } = useTranslation(['settings', 'misc']);
    return (
        <div className="min-h-screen bg-white dark:bg-[#021a0f] text-gray-900 dark:text-white p-5 pb-24">
            <header className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-xl font-bold font-serif">{t('legalAbout')}</h1>
            </header>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('comingSoon', { ns: 'misc' })}</p>
        </div>
    );
}
