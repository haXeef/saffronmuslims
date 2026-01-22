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
                const hijriFromAlAdhan = hanafiData.data.date.hijri;
                const gregorian = hanafiData.data.date.gregorian;

                // Use New Crescent Society calendar for Hijri date display when possible.
                // This keeps AlAdhan as the source of prayer timings only.
                let hijri = hijriFromAlAdhan;
                try {
                    const api = window.NcsIslamicCalendar;
                    if (api && typeof api.fetchEvents === 'function') {
                        const events = await api.fetchEvents();
                        const today = new Date();
                        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                        const sameDate = (a, b) =>
                            a.getFullYear() === b.getFullYear() &&
                            a.getMonth() === b.getMonth() &&
                            a.getDate() === b.getDate();

                        const parseHijriFromSummary = (summary) => {
                            if (typeof summary !== 'string') return null;
                            const parts = summary.split('•').map(p => p.trim()).filter(Boolean);
                            if (!parts.length) return null;

                            // Format: DD/MM/YYYY • MonthName • (optional extras)
                            const datePart = parts[0];
                            const m = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                            if (!m) return null;

                            const day = parseInt(m[1], 10);
                            const monthName = parts[1] || null;
                            const year = parseInt(m[3], 10);
                            if (!day || !year) return null;

                            return {
                                day,
                                month: { en: monthName || '' },
                                year
                            };
                        };

                        const todaysEvent = (events || [])
                            .filter(e => e && e.startDate instanceof Date && !Number.isNaN(e.startDate.valueOf()))
                            .find(e => sameDate(e.startDate, todayMidnight) && parseHijriFromSummary(e.summary));

                        const parsed = todaysEvent ? parseHijriFromSummary(todaysEvent.summary) : null;
                        if (parsed && parsed.month && parsed.month.en) {
                            hijri = parsed;
                        }
                    }
                } catch (error) {
                    console.warn('Hijri date display: failed to use NCS calendar feed, falling back:', error);
                    hijri = hijriFromAlAdhan;
                }
                
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

    async refreshHijriFromNcs(gregorian) {
        try {
            const api = window.NcsIslamicCalendar;
            if (!api || typeof api.fetchEvents !== 'function') return;

            const events = await api.fetchEvents();
            const now = new Date();
            const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const sameDate = (a, b) =>
                a.getFullYear() === b.getFullYear() &&
                a.getMonth() === b.getMonth() &&
                a.getDate() === b.getDate();

            const parseHijriFromSummary = (summary) => {
                if (typeof summary !== 'string') return null;
                const parts = summary.split('•').map(p => p.trim()).filter(Boolean);
                if (parts.length < 2) return null;

                const datePart = parts[0];
                const m = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                if (!m) return null;

                const day = parseInt(m[1], 10);
                const year = parseInt(m[3], 10);
                const monthName = parts[1] || '';

                if (!day || !year || !monthName) return null;

                return {
                    day,
                    month: { en: monthName },
                    year
                };
            };

            const todayEvents = (events || [])
                .filter(e => e && e.startDate instanceof Date && !Number.isNaN(e.startDate.valueOf()))
                .filter(e => sameDate(e.startDate, todayMidnight))
                .map(e => ({ e, parsed: parseHijriFromSummary(e.summary) }))
                .filter(x => x.parsed);

            const parsed = todayEvents[0]?.parsed;
            if (!parsed) return;

            const dateElement = document.querySelector('.date-text');
            if (!dateElement) return;

            const gregorianDate = `${gregorian.day} ${gregorian.month.en} ${gregorian.year}`;
            const hijriDate = `${parsed.day} ${parsed.month.en} ${parsed.year}`;
            dateElement.innerHTML = `${gregorianDate} · <span class="ordinal-date">${hijriDate}</span>`;

            // Update cached hijri so subsequent loads stay consistent.
            try {
                const cachedData = localStorage.getItem(this.CACHE_KEY);
                if (cachedData) {
                    const data = JSON.parse(cachedData);
                    data.hijri = parsed;
                    localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
                }
            } catch {
                // ignore
            }
        } catch (error) {
            console.warn('Hijri date display: NCS refresh failed:', error);
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

            // Even when we use cached prayer times, refresh the Hijri display from NCS if possible
            // to prevent off-by-one differences between AlAdhan's Hijri date and NCS.
            this.refreshHijriFromNcs(data.gregorian);
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

// Ramadan Countdown Function
async function updateRamadanCountdown() {
    // Prefer New Crescent Society Islamic Calendar feed for Ramadan start.
    // Fallback to the previously hardcoded date if feed is unavailable.
    const fallbackStartDate = new Date('2026-02-18T00:00:00');

    // If we can only infer from moon-sighting, represent a window:
    // earliest = moonSightingDate + 1 day
    // latest   = moonSightingDate + 2 days (if the month completes 30 days)
    let ramadanStartDate = fallbackStartDate;
    let ramadanStartLatestDate = null;

    function addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    try {
        const api = window.NcsIslamicCalendar;
        if (api && typeof api.fetchEvents === 'function') {
            const events = await api.fetchEvents();
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const allEvents = (events || [])
                .filter(e => e && e.startDate instanceof Date && !Number.isNaN(e.startDate.valueOf()));

            // 1) Preferred: explicit Ramadan "Month Begins" event.
            const candidates = allEvents
                .filter(e => e && e.startDate instanceof Date && !Number.isNaN(e.startDate.valueOf()))
                .filter(e => typeof e.summary === 'string' && e.summary.toLowerCase().includes('ramadan'))
                .sort((a, b) => a.startDate - b.startDate);

            const monthBegins = candidates.find(e => e.summary.toLowerCase().includes('month begins'));
            const nextRamadan = monthBegins || candidates.find(e => e.startDate >= today);

            if (nextRamadan && nextRamadan.startDate) {
                ramadanStartDate = new Date(
                    nextRamadan.startDate.getFullYear(),
                    nextRamadan.startDate.getMonth(),
                    nextRamadan.startDate.getDate(),
                    0, 0, 0
                );
                ramadanStartLatestDate = null;
            } else {
                // 2) Fallback: use the next "Moon Sighting" night and infer a start window.
                // In practice: if the crescent is seen, Ramadan starts the next day.
                // If not seen, the month completes 30 days and Ramadan starts the day after.
                const moonCandidates = allEvents
                    .filter(e => e.startDate >= today)
                    .filter(e => {
                        const summary = (e.summary || '').toLowerCase();
                        const categories = (e.categories || '').toLowerCase();

                        return categories.includes('moon sighting') || summary.includes('moon sighting');
                    })
                    .sort((a, b) => a.startDate - b.startDate);

                const moon = moonCandidates[0];
                if (moon && moon.startDate) {
                    const earliest = addDays(moon.startDate, 1);
                    const latest = addDays(moon.startDate, 2);

                    ramadanStartDate = new Date(
                        earliest.getFullYear(),
                        earliest.getMonth(),
                        earliest.getDate(),
                        0, 0, 0
                    );
                    ramadanStartLatestDate = new Date(
                        latest.getFullYear(),
                        latest.getMonth(),
                        latest.getDate(),
                        0, 0, 0
                    );
                }
            }
        }
    } catch (error) {
        console.warn('Ramadan countdown: failed to use NCS calendar feed, falling back:', error);
    }

    const today = new Date();
    const start = new Date(ramadanStartDate.getFullYear(), ramadanStartDate.getMonth(), ramadanStartDate.getDate());
    const nowMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Calculate days remaining (calendar days)
    const timeDiff = start - nowMidnight;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // Update the expected start label
    const startDateElement = document.getElementById('ramadan-start-date');
    if (startDateElement) {
        const fmt = new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        if (ramadanStartLatestDate && ramadanStartLatestDate.getTime() !== start.getTime()) {
            startDateElement.textContent = `${fmt.format(start)}–${fmt.format(ramadanStartLatestDate)}`;
        } else {
            startDateElement.textContent = fmt.format(start);
        }
    }

    // Update the countdown display
    const countdownElement = document.getElementById('countdown-days');
    if (countdownElement) {
        if (daysRemaining > 0) {
            countdownElement.textContent = daysRemaining;
        } else if (daysRemaining === 0) {
            countdownElement.textContent = 'Today!';
        } else {
            countdownElement.textContent = 'Started';
        }
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

    // Initialize Ramadan countdown
    updateRamadanCountdown();

    // Update countdown daily at midnight
    setInterval(updateRamadanCountdown, 86400000); // 24 hours

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