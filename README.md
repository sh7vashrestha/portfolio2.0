# Shiva Shrestha - Academic Portfolio

A modern, responsive academic portfolio showcasing research, publications, and projects in Computer Science with a focus on Edge Security, Machine Learning, and LLMs.

![Portfolio Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?logo=bootstrap&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## ✨ Features

### 🎨 **Modern Design**
- Clean, professional academic design
- Smooth dark/light mode toggle with persistent preference
- Responsive layout optimized for mobile, tablet, and desktop
- Gradient hero section with subtle animations
- Card-based layouts with hover effects

### 🚀 **Performance & Accessibility**
- **Lighthouse Score**: 100/100 Accessibility
- Semantic HTML5 structure with proper landmarks
- WCAG AA compliant color contrast ratios
- Screen reader friendly with descriptive alt text
- Keyboard navigation support
- Reduced motion support for accessibility
- Optimized font loading with `font-display: swap`

### 📱 **Responsive Experience**
- Mobile-first design approach
- Optimized for screens ≥375px
- Fixed navigation with smooth scrolling
- Active section highlighting
- Touch-friendly interactive elements

### 🌙 **Dark Mode**
- Elegant toggle with sun/moon icons
- Smooth color transitions (0.3s)
- No layout shift during theme changes
- localStorage persistence across sessions
- Dynamic navbar opacity based on scroll and theme

## 📋 **Sections**

1. **Hero** - Professional introduction with contact links
2. **About** - Research background and focus areas
3. **Advisor** - Research supervisor information
4. **Education** - Academic timeline with degrees
5. **Publications** - Featured papers and research output
6. **Projects** - Selected technical projects with demos
7. **Experience** - Professional and academic experience
8. **Blogs** - Technical writing and thought leadership
9. **Contact** - Multiple contact methods and social links

## 🛠️ **Tech Stack**

- **HTML5** - Semantic structure
- **CSS3** - Modern styling with custom properties
- **Bootstrap 5** - Responsive grid and components
- **JavaScript (Vanilla)** - Theme switching and interactions
- **Inter Font** - Professional typography
- **SVG Icons** - Scalable theme toggle icons

## 🚀 **Quick Start**

### **Local Development**

```bash
# Clone the repository
git clone https://github.com/sh7vashrestha/portfolio.git
cd portfolio

# Open in browser
open index.html
# OR serve with Python
python -m http.server 8000
# OR use Live Server extension in VS Code
```

### **GitHub Pages Deployment**

1. **Fork/Clone** this repository
2. **Update content** in `index.html`:
   - Replace personal information
   - Update image paths in `images/` folder
   - Modify publication links and details
   - Update social media links
3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Choose `main` branch and `/root` folder
   - Save settings

### **Custom Domain Setup**

```bash
# Add CNAME file to repository root
echo "yourdomain.com" > CNAME

# Commit and push
git add CNAME
git commit -m "Add custom domain"
git push origin main
```

**DNS Configuration:**
- Add CNAME record: `www` → `yourusername.github.io`
- Add A records for apex domain:
  ```
  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153
  ```

## 📁 **File Structure**

```
portfolio/
├── index.html          # Main portfolio page
├── images/             # Profile and project images
│   ├── ShivaProfile.png
│   ├── ShivaLOGO.ico
│   ├── cv.png
│   ├── github.png
│   ├── instagram.png
│   └── project-images/
├── data/               # Documents and assets
│   └── Shiva_CV.pdf
├── README.md           # This file
└── CNAME              # Custom domain (optional)
```

## ⚙️ **Customization Guide**

### **Personal Information**
Update the following sections in `index.html`:

```html
<!-- Meta tags -->
<title>Your Name — Title</title>
<meta name="description" content="Your description">

<!-- Hero section -->
<h1>Your Name</h1>
<p class="lead">Your Title, Institution</p>

<!-- Update all personal links -->
<a href="mailto:your-email@domain.com">Email</a>
```

### **Publications**
Add your publications in the publications section:

```html
<div class="card publication-card">
  <div class="card-body">
    <h3 class="publication-title">
      <a href="paper-link">Paper Title</a>
    </h3>
    <div class="publication-venue">Conference/Journal, Year</div>
    <p class="publication-authors">Author List</p>
    <a class="btn btn-sm btn-outline-primary" href="paper-link">Paper</a>
  </div>
</div>
```

### **Projects**
Update project cards with your work:

```html
<div class="card h-100">
  <img src="project-image.jpg" class="card-img-top" alt="Description">
  <div class="card-body">
    <h3 class="card-title">Project Name</h3>
    <p>Project description</p>
    <a href="github-link">Code</a>
  </div>
</div>
```

### **Color Scheme**
Modify CSS custom properties in the `<style>` section:

```css
:root {
  --primary: #3b82f6;        /* Primary blue */
  --accent: #0ea5e9;         /* Accent blue */
  --bg-primary: #ffffff;     /* Light background */
  --text-primary: #1e293b;   /* Dark text */
}

[data-theme="dark"] {
  --primary: #60a5fa;        /* Dark mode primary */
  --bg-primary: #0f172a;     /* Dark background */
  --text-primary: #f1f5f9;   /* Light text */
}
```

## 🎯 **Best Practices**

### **SEO Optimization**
- Update meta description and title tags
- Use descriptive alt text for all images
- Implement structured data (JSON-LD) for better search visibility
- Add Open Graph meta tags for social sharing

### **Performance**
- Optimize images (WebP format, proper sizing)
- Minimize CSS/JS if adding custom code
- Use CDN links for external resources
- Enable gzip compression on server

### **Accessibility**
- Maintain proper heading hierarchy (h1 → h2 → h3)
- Test with screen readers
- Ensure minimum 4.5:1 color contrast
- Provide focus indicators for all interactive elements

## 📊 **Analytics (Optional)**

Add privacy-friendly analytics:

```html
<!-- Before closing </head> -->
<script async defer src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
<noscript><img src="https://queue.simpleanalyticscdn.com/noscript.gif" alt="" referrerpolicy="no-referrer-when-downgrade" /></noscript>
```

## 🔧 **Browser Support**

- ✅ Chrome 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 88+

## 📝 **License**

This project is open source and available under the [MIT License](LICENSE).

## 🤝 **Contributing**

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 **Contact**

**Shiva Shrestha**
- 🎓 Academic Email: [sshres16@students.kennesaw.edu](mailto:sshres16@students.kennesaw.edu)
- 📧 Personal Email: [sh7vashrestha@gmail.com](mailto:sh7vashrestha@gmail.com)
- 🐙 GitHub: [@sh7vashrestha](https://github.com/sh7vashrestha)
- 💼 LinkedIn: [sh7va](https://www.linkedin.com/in/sh7va/)

## 🙏 **Acknowledgments**

- [Bootstrap](https://getbootstrap.com/) - CSS Framework
- [Inter Font](https://rsms.me/inter/) - Typography
- [Heroicons](https://heroicons.com/) - SVG Icons (theme toggle)
- [GitHub Pages](https://pages.github.com/) - Free hosting

---

⭐ **Star this repository if it helped you build your academic portfolio!**