import React, { useEffect } from 'react';
import { useProjectStore } from '../stores/useProjectStore';

export const ThemeInjector: React.FC = () => {
    const store = useProjectStore();
    const wl = store.backendConfig?.whitelabel;

    useEffect(() => {
        if (!wl) return;

        // Custom CSS
        const styleId = 'db-studio-custom-css';
        let styleTag = document.getElementById(styleId) as HTMLStyleElement;
        
        if (wl.customCss) {
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = styleId;
                document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = wl.customCss;
        } else {
            if (styleTag) {
                styleTag.remove();
            }
        }

        // Bootstrap
        const bsId = 'db-studio-bootstrap';
        let bsTag = document.getElementById(bsId) as HTMLLinkElement;
        
        if (wl.useBootstrap) {
            if (!bsTag) {
                bsTag = document.createElement('link');
                bsTag.id = bsId;
                bsTag.rel = 'stylesheet';
                bsTag.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
                document.head.appendChild(bsTag);
            }
        } else {
            if (bsTag) {
                bsTag.remove();
            }
        }

    }, [wl?.customCss, wl?.useBootstrap]);

    return null;
};
