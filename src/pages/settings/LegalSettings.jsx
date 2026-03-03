import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Shield, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';

const LEGAL_URLS = {
    terms: 'https://www.islamiyoldas.com/terms',
    privacy: 'https://www.islamiyoldas.com/privacy',
};

function openURL(url) {
    if (Capacitor.isNativePlatform()) {
        // Opens in SFSafariViewController (iOS) / Chrome Custom Tab (Android)
        window.open(url, '_blank');
    } else {
        window.open(url, '_blank', 'noopener');
    }
}

export default function LegalSettings() {
    const navigate = useNavigate();
    const { t } = useTranslation(['settings']);
    return (
        <div className="min-h-screen bg-white dark:bg-[#021a0f] text-gray-900 dark:text-white p-5 pb-24">
            <header className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-xl font-bold font-serif">{t('legalAbout')}</h1>
            </header>

            <div className="bg-white dark:bg-white/5 rounded-[2rem] shadow-md shadow-stone-200/60 dark:shadow-none border border-stone-200/80 dark:border-white/5 overflow-hidden divide-y divide-stone-100 dark:divide-white/5">
                {/* Terms of Use */}
                <button
                    onClick={() => openURL(LEGAL_URLS.terms)}
                    className="w-full p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform">
                            <FileText size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-stone-800 dark:text-white">{t('legal.terms_title')}</p>
                            <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">{t('legal.terms_desc')}</p>
                        </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-stone-400 dark:text-gray-500 group-hover:text-stone-600 dark:group-hover:text-gray-300 transition-colors" />
                </button>

                {/* Privacy Policy */}
                <button
                    onClick={() => openURL(LEGAL_URLS.privacy)}
                    className="w-full p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                            <Shield size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-stone-800 dark:text-white">{t('legal.privacy_title')}</p>
                            <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">{t('legal.privacy_desc')}</p>
                        </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-stone-400 dark:text-gray-500 group-hover:text-stone-600 dark:group-hover:text-gray-300 transition-colors" />
                </button>
            </div>

            <p className="text-center text-xs text-stone-400 dark:text-gray-500 mt-6 px-4">
                {t('legal.footer_note')}
            </p>
        </div>
    );
}
