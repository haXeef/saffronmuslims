# Saffron Walden Muslim Community Website

A simple static website for the Muslim community in Saffron Walden, Essex, UK.

## Overview

This project provides a website for the Saffron Walden Muslim Community. The site includes prayer times (calculated automatically based on location), information about the prayer venue, donation options, and contact details.

## Features

- **Responsive Design**: Works on devices of all sizes
- **Auto-updating Prayer Times**: Uses the Aladhan API to display accurate daily prayer times
- **Interactive Map**: Shows the location of the Quaker Meeting House where prayers are held
- **Mobile-Friendly Navigation**: Collapsible menu on smaller screens
- **Clean, Locally-Inspired Design**: Color scheme inspired by Saffron Walden architecture

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Font Awesome for icons
- Google Maps embed
- Aladhan API for prayer times

## Project Structure

```
saffronmuslims/
├── css/
│   └── styles.css
├── images/
│   └── bridge-street.png
│   └── Castle-Street-SW-Gordon-Ridgewell.jpg
│   └── 20250221_*.jpg (direction images)
│   └── workinglogo.png
├── js/
│   ├── main.js
│   └── prayer-times.js
├── index.html
└── README.md
```

## Setup and Deployment

### Local Development

1. Clone this repository:
   ```
   git clone https://github.com/your-username/saffronmuslims.git
   ```
2. Open `index.html` in your browser

### GitHub Pages Deployment

1. Push to the `main` branch of your GitHub repository
2. Go to repository settings → Pages
3. Select the `main` branch as the source
4. Your site will be available at `https://your-username.github.io/saffronmuslims/`

## Future Plans

- Add events calendar
- Implement donation processing
- Add educational resources section
- Create a community business directory
- Add Arabic language support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Aladhan API](https://aladhan.com/prayer-times-api) for prayer times calculation