import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
                    <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-md w-full">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-red-500/10 rounded-full p-4 mb-4">
                                <AlertTriangle className="w-12 h-12 text-red-400" />
                            </div>

                            <h1 className="text-2xl font-bold text-white mb-2">Erro no Sistema</h1>
                            <p className="text-slate-400 mb-6">
                                Ocorreu um erro inesperado. Por favor, recarregue a página.
                            </p>

                            {this.state.error && (
                                <div className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-4 mb-6 text-left">
                                    <p className="text-xs font-mono text-red-400 break-all">
                                        {this.state.error.toString()}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={this.handleReload}
                                className="flex items-center gap-2 bg-brand-cyan hover:bg-brand-cyan/90 text-slate-950 font-bold py-3 px-6 rounded-xl transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Recarregar Página
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
