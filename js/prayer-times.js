// Prayer Times Calculator
class PrayerTimesCalculator {
    constructor() {
        // Saffron Walden coordinates
        this.latitude = 52.0262;
        this.longitude = 0.2414;
        this.timezone = 0; // UTC+0 for UK
    }

    async updatePrayerTimes() {
        try {
            // Get current date
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();

            // Fetch Hanafi prayer times
            const hanafiResponse = await fetch(
                `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?` + 
                `latitude=${this.latitude}&longitude=${this.longitude}&method=12&adjustment=1&school=1&timezonestring=Europe/London`
            );
            
            const hanafiData = await hanafiResponse.json();
            
            // Fetch Shafi prayer times
            const shafiResponse = await fetch(
                `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?` + 
                `latitude=${this.latitude}&longitude=${this.longitude}&method=12&adjustment=1&school=0&timezonestring=Europe/London`
            );
            
            const shafiData = await shafiResponse.json();
            
            console.log("Hanafi API Response:", hanafiData); 
            console.log("Shafi API Response:", shafiData);

            if (hanafiData.code === 200 && shafiData.code === 200) {
                const timings = hanafiData.data.timings;
                const shafiAsr = shafiData.data.timings.Asr;
                const hijri = hanafiData.data.date.hijri;
                const gregorian = hanafiData.data.date.gregorian;
                
                this.updateDOM(timings, hijri, gregorian, shafiAsr);
            }
        } catch (error) {
            console.error('Error fetching prayer times:', error);
            // Show error state in the UI
            this.showError();
        }
    }

    updateDOM(timings, hijri, gregorian, shafiAsr) {
        // Update prayer times in the banner
        document.getElementById('fajr-begins').textContent = timings.Fajr;
        document.getElementById('zuhr-begins').textContent = timings.Dhuhr;
        document.getElementById('asr-begins').textContent = timings.Asr;
        document.getElementById('maghrib-begins').textContent = timings.Maghrib;
        document.getElementById('isha-begins').textContent = timings.Isha;

        // Update date
        // Use the gregorian date from the API response
        const gregorianDate = `${gregorian.day} ${gregorian.month.en} ${gregorian.year}`;
        
        // Format the Hijri date properly with the month name from the API
        const hijriDate = `${hijri.day} ${hijri.month.en} ${hijri.year}`;
        
        // Debug the date elements we're generating
        console.log('Formatted dates:', {
            gregorianDate,
            hijriDate
        });
        
        // Update the date text in the banner
        const dateElement = document.querySelector('.date-text');
        if (dateElement) {
            dateElement.innerHTML = `${gregorianDate} · <span class="ordinal-date">${hijriDate}</span>`;
            console.log('Date element updated');
        } else {
            console.error('Date element not found');
        }
        
        // Update dawn and sunrise (notice we're looking for prayer-info-labels)
        const dawnSunriseTimes = document.querySelectorAll('.prayer-info-item span.prayer-info-labels + span');
        if (dawnSunriseTimes && dawnSunriseTimes.length >= 2) {
            dawnSunriseTimes[0].textContent = timings.Imsak; // Dawn
            dawnSunriseTimes[1].textContent = timings.Sunrise; // Sunrise
        }
        
        // Update the five prayer times
        const prayerTimes = document.querySelectorAll('.prayer-info-item span.prayer-info-label + span');
        if (prayerTimes && prayerTimes.length >= 5) {
            prayerTimes[0].textContent = timings.Fajr;
            prayerTimes[1].textContent = timings.Dhuhr;
            prayerTimes[2].textContent = timings.Asr;
            prayerTimes[3].textContent = timings.Maghrib;
            prayerTimes[4].textContent = timings.Isha;
            
            // Update the note about Asr timing
            const prayerCardNote = document.querySelector('.prayer-card-note');
            if (prayerCardNote) {
                prayerCardNote.innerHTML = `Prayer times updated daily.<br><br> Asr time shown is according to Hanafi school. Shafi school Asr time is <strong>${shafiAsr}</strong> today.`;
            }
        }
    }

    showError() {
        const dateElement = document.querySelector('.date-text');
        if (dateElement) {
            dateElement.innerHTML = 'Unable to fetch prayer times. Please check your connection.';
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
});