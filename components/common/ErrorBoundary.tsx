"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4 bg-muted/10 rounded-lg border border-dashed">
                    <div className="bg-red-100 p-3 rounded-full">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
                        </p>
                    </div>
                    {/* Optional: Show error message in dev mode */}
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <div className="bg-muted p-2 rounded text-xs text-left w-full overflow-auto max-h-32 font-mono">
                            {this.state.error.message}
                        </div>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.reload();
                        }}
                    >
                        Refresh Page
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
