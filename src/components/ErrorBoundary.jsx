import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertTriangle, Mail } from 'lucide-react';
import i18n from '@/i18n';
import { analytics } from '@/services/analyticsService';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        analytics.errorOccurred(error?.name || 'ReactError', window.location.pathname);
        this.setState({ error, errorInfo });
        // Açılışta hata olursa native splash'in takılı kalmaması için kapat
        import('@capacitor/splash-screen')
            .then(({ SplashScreen }) => SplashScreen.hide())
            .catch(() => { });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        localStorage.clear();
        window.location.href = '/';
    }

    handleReport = () => {
        const REPORT_FALLBACKS = {
            email_greeting: 'Merhaba,\n\nUygulamada bir hata ile karşılaştım.',
            email_info_header: '--- HATA BİLGİLERİ (lütfen silmeyin) ---',
            email_description_prompt: 'Açıklama (ne yaptığınızı kısaca yazın):',
        };
        const t = (key) => {
            try {
                const result = i18n.t(`error_boundary.${key}`, { ns: 'common' });
                if (!result || result === `error_boundary.${key}`) return REPORT_FALLBACKS[key] || key;
                return result;
            } catch {
                return REPORT_FALLBACKS[key] || key;
            }
        };
        const errorMsg = this.state.error?.toString() || 'Unknown error';
        const stack = this.state.errorInfo?.componentStack || '';
        const url = window.location.href;
        const ua = navigator.userAgent;
        const timestamp = new Date().toISOString();
        const lang = i18n.language || 'en';
        const appVersion = localStorage.getItem('appVersion') || '-';

        const subject = encodeURIComponent(`[Bug Report] ${errorMsg.substring(0, 80)}`);
        const body = encodeURIComponent(
            `${t('email_greeting')}

${t('email_info_header')}
Error: ${errorMsg}
Page: ${url}
Date: ${timestamp}
Device: ${ua}
Language: ${lang}
Version: ${appVersion}
Stack: ${stack.substring(0, 500)}
--- ---

${t('email_description_prompt')}

`
        );

        window.location.href = `mailto:support@islamiyoldas.com?subject=${subject}&body=${body}`;
    };

    render() {
        const FALLBACKS = {
            title: 'Bir şeyler ters gitti',
            description: 'Beklenmeyen bir hata oluştu. Lütfen sayfayı yeniden yüklemeyi deneyin.',
            reload: 'Sayfayı Yenile',
            report: 'Hatayı Bildir',
            reset: 'Önbelleği Temizle ve Sıfırla',
        };
        const t = (key) => {
            try {
                const result = i18n.t(`error_boundary.${key}`, { ns: 'common' });
                // i18n returns the raw key if translation is missing or not loaded
                if (!result || result === `error_boundary.${key}`) return FALLBACKS[key] || key;
                return result;
            } catch {
                return FALLBACKS[key] || key;
            }
        };

        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-red-50 text-center dark:bg-[#032e18]">
                    <div className="bg-white dark:bg-white/5 p-8 rounded-3xl shadow-xl max-w-4xl w-full border border-red-100 dark:border-white/10">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>

                        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {t('title')}
                        </h1>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            {t('description')}
                        </p>

                        <div className="space-y-3 max-w-sm mx-auto">
                            <Button
                                onClick={this.handleReload}
                                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-12"
                            >
                                <RefreshCcw className="w-4 h-4 mr-2" />
                                {t('reload')}
                            </Button>

                            <Button
                                onClick={this.handleReport}
                                variant="outline"
                                className="w-full rounded-xl h-12 border-amber-300 dark:border-amber-600/40 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                {t('report')}
                            </Button>

                            <button
                                onClick={this.handleReset}
                                className="text-xs text-gray-400 hover:text-red-500 underline"
                            >
                                {t('reset')}
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-8 text-left bg-gray-900 rounded-lg p-4 overflow-auto max-h-[60vh] border border-red-900/50">
                                <p className="text-red-400 font-mono text-sm mb-2 font-bold select-all">{this.state.error.toString()}</p>
                                <pre className="text-gray-400 font-mono text-xs whitespace-pre-wrap select-all">
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
