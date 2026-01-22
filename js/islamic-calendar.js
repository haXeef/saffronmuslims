(() => {
    // For production, this should be a URL that allows browser fetches (CORS).
    // If the upstream feed blocks CORS, set `window.NCS_ICS_URL` to a proxy URL
    // (e.g., a Cloudflare Worker) that adds `Access-Control-Allow-Origin`.
    const FEED_URL = window.NCS_ICS_URL || 'https://newcrescentsociety.org/api/calendar/ics/subscribe';

    const container = document.getElementById('islamic-calendar-items');

    const CACHE_KEY = 'ncs_islamic_calendar_ics_cache';
    const CACHE_TS_KEY = 'ncs_islamic_calendar_ics_cache_ts';
    const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

    const CATEGORY_LABELS = {
        'significant': 'Significant',
        'monthly': 'Monthly',
        'Moon Sighting': 'Moon Sighting',
        'Islamic Calendar': 'Calendar'
    };

    function setStatus(text) {
        if (!container) return;
        container.innerHTML = '';
        const item = document.createElement('div');
        item.className = 'prayer-info-item';
        const left = document.createElement('span');
        left.className = 'prayer-info-label';
        left.textContent = text;
        const right = document.createElement('span');
        right.textContent = '';
        item.appendChild(left);
        item.appendChild(right);
        container.appendChild(item);
    }

    function unfoldIcs(text) {
        // RFC 5545 line folding: CRLF followed by a single whitespace (space or tab)
        return text.replace(/\r?\n[ \t]/g, '');
    }

    function unescapeIcsValue(value) {
        return value
            .replace(/\\n/g, '\n')
            .replace(/\\N/g, '\n')
            .replace(/\\,/g, ',')
            .replace(/\\;/g, ';')
            .replace(/\\\\/g, '\\');
    }

    function parseDateValue(value) {
        // Supports YYYYMMDD or YYYYMMDDTHHMMSSZ (best-effort)
        if (!value) return null;

        const dateOnly = /^\d{8}$/;
        if (dateOnly.test(value)) {
            const yyyy = value.slice(0, 4);
            const mm = value.slice(4, 6);
            const dd = value.slice(6, 8);
            return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
        }

        // Fallback: try Date parsing for timestamp formats
        // Example: 20260122T031955Z
        const ts = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;
        const m = value.match(ts);
        if (m) {
            const [, yyyy, mm, dd, hh, min, ss] = m;
            return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}Z`);
        }

        return null;
    }

    function parseIcsEvents(icsText) {
        const unfolded = unfoldIcs(icsText);
        const lines = unfolded.split(/\r?\n/);

        const events = [];
        let current = null;

        for (const rawLine of lines) {
            const line = rawLine.trimEnd();
            if (!line) continue;

            if (line === 'BEGIN:VEVENT') {
                current = {};
                continue;
            }
            if (line === 'END:VEVENT') {
                if (current) events.push(current);
                current = null;
                continue;
            }
            if (!current) continue;

            const idx = line.indexOf(':');
            if (idx === -1) continue;

            const keyPart = line.slice(0, idx);
            const valuePart = line.slice(idx + 1);

            const key = keyPart.split(';')[0].toUpperCase();
            const value = unescapeIcsValue(valuePart);

            switch (key) {
                case 'UID':
                    current.uid = value;
                    break;
                case 'SUMMARY':
                    current.summary = value;
                    break;
                case 'DESCRIPTION':
                    current.description = value;
                    break;
                case 'CATEGORIES':
                    current.categories = value;
                    break;
                case 'DTSTART':
                    current.startRaw = value;
                    current.startDate = parseDateValue(value);
                    break;
                default:
                    break;
            }
        }

        return events;
    }

    function formatShortDate(date) {
        return new Intl.DateTimeFormat('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short'
        }).format(date);
    }

    function isSameOrAfter(a, b) {
        return a.getTime() >= b.getTime();
    }

    function addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    function renderEvents(events) {
        if (!container) return;
        container.innerHTML = '';

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const horizon = addDays(today, 45);

        const upcoming = events
            .filter(e => e.startDate instanceof Date && !Number.isNaN(e.startDate.valueOf()))
            .filter(e => isSameOrAfter(e.startDate, today) && e.startDate <= horizon)
            .sort((a, b) => a.startDate - b.startDate)
            .slice(0, 7);

        if (!upcoming.length) {
            setStatus('No upcoming items');
            return;
        }

        for (const event of upcoming) {
            const item = document.createElement('div');
            item.className = 'prayer-info-item';

            const left = document.createElement('span');
            left.className = 'prayer-info-label';
            left.textContent = formatShortDate(event.startDate);

            const right = document.createElement('span');
            const wrap = document.createElement('span');
            wrap.className = 'calendar-summary';

            const summaryText = document.createElement('span');
            summaryText.textContent = event.summary || 'Event';

            wrap.appendChild(summaryText);

            const category = (event.categories || '').trim();
            if (category) {
                const badge = document.createElement('span');
                badge.className = 'calendar-badge';
                badge.textContent = CATEGORY_LABELS[category] || category;
                wrap.appendChild(badge);
            }

            // Provide detail on hover/focus via title
            if (event.description) {
                item.title = event.description.replace(/\n+/g, '\n');
            }

            right.appendChild(wrap);
            item.appendChild(left);
            item.appendChild(right);
            container.appendChild(item);
        }
    }

    function loadFromCache() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            const ts = localStorage.getItem(CACHE_TS_KEY);
            if (!cached || !ts) return null;
            const age = Date.now() - parseInt(ts, 10);
            if (Number.isNaN(age) || age > CACHE_TTL_MS) return null;
            return cached;
        } catch {
            return null;
        }
    }

    function saveToCache(text) {
        try {
            localStorage.setItem(CACHE_KEY, text);
            localStorage.setItem(CACHE_TS_KEY, Date.now().toString());
        } catch {
            // ignore
        }
    }

    async function fetchIcs() {
        const cached = loadFromCache();
        if (cached) return cached;

        const resp = await fetch(FEED_URL, {
            method: 'GET',
            cache: 'no-store'
        });

        if (!resp.ok) {
            throw new Error(`Calendar feed request failed (${resp.status})`);
        }

        const text = await resp.text();
        if (!text || !text.includes('BEGIN:VCALENDAR')) {
            throw new Error('Calendar feed returned unexpected content');
        }

        saveToCache(text);
        return text;
    }

    async function fetchEvents() {
        const icsText = await fetchIcs();
        return parseIcsEvents(icsText);
    }

    async function init() {
        if (!container) return;
        setStatus('Loading…');

        try {
            const events = await fetchEvents();
            renderEvents(events);
        } catch (err) {
            console.warn('Failed to load Islamic calendar feed:', err);
            container.innerHTML = '';

            const item = document.createElement('div');
            item.className = 'prayer-info-item';

            const left = document.createElement('span');
            left.className = 'prayer-info-label';
            left.textContent = 'Calendar';

            const right = document.createElement('span');
            right.innerHTML = `Unable to load in-browser. <a href="${FEED_URL}" target="_blank" rel="noopener noreferrer">Open feed</a>`;

            item.appendChild(left);
            item.appendChild(right);
            container.appendChild(item);
        }
    }

    // Expose a tiny API for other scripts (e.g., Ramadan countdown) to reuse
    // the same feed + parser + cache.
    window.NcsIslamicCalendar = {
        fetchEvents,
        FEED_URL
    };

    // Only render the calendar UI if the page includes a target container.
    // Defer execution until DOM is ready (safe even with defer scripts)
    document.addEventListener('DOMContentLoaded', init);
})();
