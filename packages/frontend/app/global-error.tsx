'use client';

import React from 'react';

/**
 * Catches errors thrown in the Root Layout.
 * Must include <html> and <body> — replaces the entire app shell.
 * Only activates in production builds.
 */
export default function GlobalError({
                                        error,
                                        reset,
                                    }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
        <body
            style={{
                margin: 0,
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0a0a0c',
                color: '#f4f4f5',
                fontFamily: 'system-ui, sans-serif',
            }}
        >
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
            <div
                style={{
                    display: 'inline-block',
                    background: '#e10600',
                    color: '#fff',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: 4,
                    marginBottom: '1rem',
                    fontStyle: 'italic',
                }}
            >
                F1
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                Critical Error
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                {error.message}
            </p>
            <button
                onClick={reset}
                style={{
                    background: '#e10600',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 1.5rem',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                }}
            >
                Reload
            </button>
        </div>
        </body>
        </html>
    );
}