# Shiva Shrestha

Academic portfolio and CV site for Shiva Shrestha. Live at [shivashrestha7.com.np](https://shivashrestha7.com.np).

## Page sections

The page includes an introduction, News, Publications, Projects, Experience, Education, Honors, Writing, and Contact.

## Built with

The site uses plain HTML and CSS, the Inter font from Google Fonts, and a small `js/main.js` script that highlights the current section in the top menu. It has no framework or build step.

## Run locally

```bash
git clone https://github.com/sh7vashrestha/portfolio2.0.git
cd portfolio2.0
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in a browser.

## File structure

```text
portfolio2.0/
├── index.html
├── stylesheet.css
├── js/
│   └── main.js
├── images/
│   ├── profile.webp, profile.jpg
│   ├── og-image.jpg
│   ├── ShivaLOGO.ico
│   └── projects/
├── data/
│   ├── Shiva_CV.pdf
│   └── cv/
│       └── Shiva_CV.tex
└── CNAME
```

## Updating content

Edit `index.html` to update the page content. The CV is built from `data/cv/Shiva_CV.tex` (see `data/cv/README.md` for the build command). Project thumbnails are 800×500 WebP files in `images/projects/`. `images/og-image.jpg` is the preview image shown when the link is shared.

## Deployment

GitHub Pages publishes the site from the `main` branch. The `CNAME` file configures the custom domain.

## Contact

- [sshres16@students.kennesaw.edu](mailto:sshres16@students.kennesaw.edu)
- [sh7vashrestha@gmail.com](mailto:sh7vashrestha@gmail.com)
