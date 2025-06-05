# Saffron Walden Muslim Community Website

A simple static website for the Muslim community in Saffron Walden, Essex, UK.

## Overview

This project provides a website for the Saffron Walden Muslim Community. The site includes prayer times (calculated automatically based on location), information about the prayer venue, donation options, and contact details.

## Features

- **Responsive Design**: Works on devices of all sizes
- **Auto-updating Prayer Times**: Uses the Aladhan API to display accurate daily prayer times
- **Offline Support**: Caches prayer times for offline functionality
- **Interactive Map**: Shows the location of the Quaker Meeting House where prayers are held
- **Mobile-Friendly Navigation**: Collapsible menu on smaller screens
- **Clean, Locally-Inspired Design**: Color scheme inspired by Saffron Walden architecture

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Font Awesome for icons
- Google Maps embed
- Prayer times data provided by the Aladhan API
- Cloudflare Analytics for site metrics

## Project Structure

```
saffronmuslims/
├── css/
│   ├── cookie-notice.css
│   └── styles.css
├── images/
│   ├── fallback/
│   │   ├── large/ (desktop optimized JPG/PNG images)
│   │   ├── medium/ (tablet optimized JPG/PNG images)
│   │   └── small/ (mobile optimized JPG/PNG images)
│   ├── webp/
│   │   ├── large/ (desktop optimized WebP images)
│   │   ├── medium/ (tablet optimized WebP images)
│   │   └── small/ (mobile optimized WebP images)
│   ├── bridge-street.jpg
│   ├── Castle-Street-SW-Gordon-Ridgewell.jpg
│   └── workinglogo.png
├── js/
│   ├── cookie-notice.js
│   ├── main.js
│   └── prayer-times.js
├── index.html
└── README.md
```

## Setup and Deployment

### Local Development

1. Clone this repository:
   ```
   git clone https://github.com/haXeef/saffronmuslims.git
   ```
2. Open `index.html` in your browser

### GitHub Pages Deployment

1. Push to the `main` branch of your GitHub repository
2. Go to repository settings → Pages
3. Select the `main` branch as the source
4. Your site will be available at `https://haxeef.github.io/saffronmuslims/`

## Live Website

Visit the live website at: [https://saffronmuslims.com/](https://saffronmuslims.com/)

## Future Plans

- Add events calendar
- Implement donation processing
- Add educational resources section
- Create a community business directory
- Add Arabic language support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License. All code and customizations are original. External services and libraries are used with appropriate attribution.

## Acknowledgments

- [Aladhan API](https://aladhan.com/prayer-times-api) for prayer times calculation