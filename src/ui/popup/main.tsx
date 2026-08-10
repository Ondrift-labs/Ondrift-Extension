import React from 'react';
import { createRoot } from 'react-dom/client';
import { chromeUiBridge } from '../shared/chromeBridge';
import { PopupApp } from './PopupApp';

const root = document.getElementById('root');
if (!root) throw new Error('Popup root element is missing');
createRoot(root).render(<React.StrictMode><PopupApp bridge={chromeUiBridge} /></React.StrictMode>);
