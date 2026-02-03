import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

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
        this.setState({ error, errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        localStorage.clear();
        window.location.href = '/';
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-red-50 text-center dark:bg-[#032e18]">
                    <div className="bg-white dark:bg-white/5 p-8 rounded-3xl shadow-xl max-w-4xl w-full border border-red-100 dark:border-white/10">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>

                        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Bir şeyler ters gitti
                        </h1>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            Uygulama beklenmedik bir hatayla karşılaştı. Lütfen sayfayı yenilemeyi deneyin.
                        </p>

                        <div className="space-y-3 max-w-sm mx-auto">
                            <Button
                                onClick={this.handleReload}
                                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-12"
                            >
                                <RefreshCcw className="w-4 h-4 mr-2" />
                                Yeniden Başlat
                            </Button>

                            <button
                                onClick={this.handleReset}
                                className="text-xs text-gray-400 hover:text-red-500 underline"
                            >
                                Önbelleği Temizle ve Sıfırla
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
