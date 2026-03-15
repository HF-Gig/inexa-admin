import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './Router';
import './index.css';
import { ToastProvider } from './components/ToastProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ToastProvider>
            <AppRouter />
        </ToastProvider>
    </React.StrictMode>
);