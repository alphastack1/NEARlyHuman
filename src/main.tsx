import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/press-start-2p/latin-400.css';
import './styles.css';
import './viewport.css';
import App from './app/Entry';

createRoot(document.getElementById('root')!).render(<App/>);
