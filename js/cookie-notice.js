/**
 * Cookie Notice for Saffron Walden Muslim Community
 * Uses only essential cookies and Cloudflare's cookieless analytics
 */

class CookieNotice {
    constructor() {
        // Cookie name for notice dismissal
        this.NOTICE_COOKIE = 'swmc_notice_dismissed';
        
        // Initialize
        this.init();
    }
    
    init() {
        // Wait for DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', () => {
            // Check if user has already dismissed the notice
            if (!this.hasNoticeCookie()) {
                // Show notice after a short delay
                setTimeout(() => {
                    this.showNotice();
                }, 1000);
            }
            
            // Set up event listeners for the dismiss button
            const dismissBtn = document.getElementById('dismiss-cookie-notice');
            if (dismissBtn) {
                dismissBtn.addEventListener('click', () => {
                    this.dismissNotice();
                });
            }
        });
    }
    
    hasNoticeCookie() {
        return this.getCookie(this.NOTICE_COOKIE) === 'true';
    }
    
    showNotice() {
        const notice = document.getElementById('cookie-notice');
        if (notice) {
            notice.classList.add('visible');
        }
    }
    
    dismissNotice() {
        // Set cookie so notice won't show again
        this.setCookie(this.NOTICE_COOKIE, 'true', 365);
        
        // Hide the notice
        const notice = document.getElementById('cookie-notice');
        if (notice) {
            notice.classList.remove('visible');
        }
    }
    
    // Cookie utility methods
    setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
    }
    
    getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    }
}

// Initialize cookie notice
const cookieNotice = new CookieNotice();