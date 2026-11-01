import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/press-start-2p/latin-400.css';
import './styles.css';
import App from './app/App';

createRoot(document.getElementById('root')!).render(<App/>);
