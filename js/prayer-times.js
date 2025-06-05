// Prayer Times Calculator
class PrayerTimesCalculator {
    constructor() {
        // Saffron Walden coordinates
        this.latitude = 52.0262;
        this.longitude = 0.2414;
        this.timezone = 0; // UTC+0 for UK
        
        // Cache keys
        this.CACHE_KEY = 'saffron_prayer_times';
        this.CACHE_TIMESTAMP_KEY = 'saffron_prayer_times_timestamp';
        this.CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    }

    async updatePrayerTimes() {
        try {
            // Try to load from cache first
            if (this.loadFromCache()) {
                return;
            }

            // Get current date
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();

            // Show loading state
            this.showLoadingState();

            // Fetch Hanafi prayer times
            const hanafiResponse = await fetch(
                `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?` + 
                `latitude=${this.latitude}&longitude=${this.longitude}&method=12&adjustment=1&school=1&timezonestring=Europe/London`
            );
            
            const hanafiData = await hanafiResponse.json();
            
            // Fetch Shaf'i prayer times
            const shafiResponse = await fetch(
                `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?` + 
                `latitude=${this.latitude}&longitude=${this.longitude}&method=12&adjustment=1&school=0&timezonestring=Europe/London`
            );
            
            const shafiData = await shafiResponse.json();

            if (hanafiData.code === 200 && shafiData.code === 200) {
                const timings = hanafiData.data.timings;
                const shafiAsr = shafiData.data.timings.Asr;
                const hijri = hanafiData.data.date.hijri;
                const gregorian = hanafiData.data.date.gregorian;
                
                // Save to cache
                this.saveToCache({
                    timings, 
                    shafiAsr, 
                    hijri, 
                    gregorian
                });
                
                this.updateDOM(timings, hijri, gregorian, shafiAsr);
            } else {
                throw new Error('Invalid response from prayer times API');
            }
        } catch (error) {
            console.error('Error fetching prayer times:', error);
            
            // Try to load from cache even if it's expired, as a last resort
            if (!this.loadFromCache(true)) {
                // Show error state in the UI if no cache is available
                this.showError();
            }
        }
    }

    updateDOM(timings, hijri, gregorian, shafiAsr) {
        // Clear any loading or error states
        this.clearLoadingState();
        
        // Update prayer times in the banner
        document.getElementById('fajr-begins').textContent = timings.Fajr;
        document.getElementById('zuhr-begins').textContent = timings.Dhuhr;
        document.getElementById('asr-begins').textContent = timings.Asr;
        document.getElementById('maghrib-begins').textContent = timings.Maghrib;
        document.getElementById('isha-begins').textContent = timings.Isha;
    
        // Update date
        const gregorianDate = `${gregorian.day} ${gregorian.month.en} ${gregorian.year}`;
        const hijriDate = `${hijri.day} ${hijri.month.en} ${hijri.year}`;
        
        // Update the date text in the banner
        const dateElement = document.querySelector('.date-text');
        if (dateElement) {
            dateElement.innerHTML = `${gregorianDate} · <span class="ordinal-date">${hijriDate}</span>`;
            console.log('Date element updated');
        } else {
            console.error('Date element not found');
        }
        
        // Update the five prayer times in the detailed section
        const prayerInfoItems = document.querySelectorAll('.prayer-info-item');
        if (prayerInfoItems && prayerInfoItems.length) {
            // Create a mapping of label text to timing values
            const prayerMap = {
                'Fajr:': timings.Fajr,
                'Sunrise:': timings.Sunrise,
                'Dhuhr:': timings.Dhuhr,
                'Asr:': timings.Asr,
                'Maghrib:': timings.Maghrib,
                'Isha:': timings.Isha
            };
            
            // Update each prayer time by finding its label
            prayerInfoItems.forEach(item => {
                const label = item.querySelector('.prayer-info-label')?.textContent || 
                              item.querySelector('.prayer-info-labels')?.textContent;
                              
                if (label && prayerMap[label]) {
                    const valueSpan = item.querySelector('span:last-child');
                    if (valueSpan) {
                        valueSpan.textContent = prayerMap[label];
                    }
                }
            });
        }
        
        // Find the Daily Prayers card to update the Shaf'i Asr time
        const dailyPrayersCard = this.findDailyPrayersCard();
        if (dailyPrayersCard) {
            const noteElement = dailyPrayersCard.querySelector('.prayer-card-note');
            if (noteElement) {
                noteElement.innerHTML = `Prayer times updated daily.<br><br>Asr time shown is according to Hanafi school. Shaf'i school Asr time is <strong>${shafiAsr}</strong> today.`;
            }
        }
    }
    
    findDailyPrayersCard() {
        // Find the card by its title
        const cards = document.querySelectorAll('.prayer-card');
        for (const card of cards) {
            const title = card.querySelector('.prayer-card-title');
            if (title && title.textContent.trim() === 'Daily Prayers') {
                return card;
            }
        }
        // Fallback to the first card if we can't find by title
        return document.querySelector('.prayer-card');
    }

    showLoadingState() {
        // Add subtle loading indicators
        const dateElement = document.querySelector('.date-text');
        if (dateElement) {
            dateElement.innerHTML = `<em>Updating prayer times...</em>`;
        }
        
        // Apply a subtle pulsing effect to the prayer times
        const prayerValues = document.querySelectorAll('.prayer-value');
        prayerValues.forEach(value => {
            value.classList.add('prayer-time-loading');
        });
    }
    
    clearLoadingState() {
        // Remove loading indicators
        const prayerValues = document.querySelectorAll('.prayer-value');
        prayerValues.forEach(value => {
            value.classList.remove('prayer-time-loading');
            value.classList.remove('prayer-time-error');
        });
    }

    showError() {
        const dateElement = document.querySelector('.date-text');
        if (dateElement) {
            dateElement.innerHTML = `<span style="color: #ffaa9d;">Unable to fetch prayer times. <a href="#" id="retry-prayer-times" style="color: white; text-decoration: underline;">Retry</a></span>`;
            
            // Add retry functionality
            setTimeout(() => {
                const retryButton = document.getElementById('retry-prayer-times');
                if (retryButton) {
                    retryButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.updatePrayerTimes();
                    });
                }
            }, 100);
        }
        
        // Show error state for prayer times
        const prayerValues = document.querySelectorAll('.prayer-value');
        prayerValues.forEach(value => {
            value.classList.remove('prayer-time-loading');
            value.classList.add('prayer-time-error');
        });
        
        // Update the note in daily prayers card
        const dailyPrayersCard = this.findDailyPrayersCard();
        if (dailyPrayersCard) {
            const noteElement = dailyPrayersCard.querySelector('.prayer-card-note');
            if (noteElement) {
                noteElement.innerHTML = `<span style="color: #d25757;">Prayer times unavailable. Please check your connection and try again.</span>`;
            }
        }
    }

    saveToCache(data) {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(this.CACHE_TIMESTAMP_KEY, Date.now().toString());
            // Optionally trigger event for service worker caching after saveToCache()
        } catch (error) {
            console.warn('Failed to cache prayer times:', error);
        }
    }

    loadFromCache(ignoreExpiry = false) {
        try {
            const cachedData = localStorage.getItem(this.CACHE_KEY);
            const timestamp = localStorage.getItem(this.CACHE_TIMESTAMP_KEY);
            
            if (!cachedData || !timestamp) return false;
            
            // Check if cache is expired (unless we're ignoring expiry)
            if (!ignoreExpiry) {
                const now = Date.now();
                const cacheTime = parseInt(timestamp);
                if (now - cacheTime > this.CACHE_DURATION) return false;
            }
            
            // Cache is valid, use it
            const data = JSON.parse(cachedData);
            this.updateDOM(data.timings, data.hijri, data.gregorian, data.shafiAsr);
            return true;
        } catch (error) {
            console.warn('Failed to load cached prayer times:', error);
            return false;
        }
    }

    getOrdinal(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }
}

// Initialize and run
document.addEventListener('DOMContentLoaded', () => {
    const prayerTimes = new PrayerTimesCalculator();

    // Update initially
    prayerTimes.updatePrayerTimes();

    // Update every hour
    setInterval(() => prayerTimes.updatePrayerTimes(), 3600000);

    // Also update when the page becomes visible again
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            prayerTimes.updatePrayerTimes();
        }
    });
    
    // Add this CSS for loading and error states
    const style = document.createElement('style');
    style.textContent = `
        .prayer-time-loading {
            opacity: 0.7;
            animation: pulsePrayerTime 1.5s infinite;
        }
        
        .prayer-time-error {
            color: #d25757;
        }
        
        @keyframes pulsePrayerTime {
            0% { opacity: 0.7; }
            50% { opacity: 0.4; }
            100% { opacity: 0.7; }
        }
    `;
    document.head.appendChild(style);
});