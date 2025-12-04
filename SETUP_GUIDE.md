# Portfolio Setup Instructions

## ✅ Completed Setup

Your portfolio website has been successfully set up with:

- ✅ Next.js 15 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS with custom theme
- ✅ Framer Motion for animations
- ✅ All necessary components and sections
- ✅ Dark/Light mode toggle
- ✅ Responsive design
- ✅ Data files for projects, experience, and skills

## 🚀 Getting Started

### Run Development Server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 📝 Customization Guide

### 1. Replace Profile Photo
- Add your photo to `/public/profile.jpg`
- Update the Hero section in `components/sections/Hero.tsx`

### 2. Update CV File
- Replace `/public/Mahmoud_Haisam_CV.pdf` with your actual CV PDF
- Or rename your CV to match the current filename

### 3. Add Your Actual CV Content
The uploaded PDF content can be used to update:
- `data/experience.ts` - Work experience details
- `data/projects.ts` - Project descriptions
- `data/skills.ts` - Skills and proficiency levels

### 4. Social Media Links
Update social links in:
- `components/sections/Hero.tsx`
- `components/Footer.tsx`
- Add your actual LinkedIn URL

### 5. Contact Form Integration
The contact form in `components/sections/Contact.tsx` currently logs to console.
To integrate with a backend:
- Use services like FormSpree, EmailJS, or Resend
- Or create a custom API route in `app/api/contact/route.ts`

### 6. Project Images
Add project screenshots to `/public/projects/` and update `data/projects.ts`

### 7. Analytics (Optional)
Add Google Analytics or Vercel Analytics by:
1. Installing the package
2. Adding to `app/layout.tsx`

## 🎨 Design Customization

### Colors
Edit `tailwind.config.ts` to change:
- Primary colors
- Neon accent colors
- Gradient stops

### Fonts
Change fonts in `app/layout.tsx`:
```typescript
import { YourFont } from "next/font/google";
```

### Animations
Adjust animation settings in:
- `tailwind.config.ts` (keyframes)
- Component files (Framer Motion variants)

## 📱 Features Included

✅ **Hero Section** - Animated introduction with stats
✅ **About Section** - Education, languages, soft skills
✅ **Skills Section** - Categorized skills with progress bars
✅ **Experience Section** - Timeline view of work history
✅ **Projects Section** - Filterable project showcase
✅ **Contact Section** - Contact form and information
✅ **Dark Mode** - Smooth theme switching
✅ **Responsive** - Mobile-first design
✅ **Animations** - Smooth Framer Motion transitions
✅ **SEO** - Optimized meta tags

## 🌐 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import to Vercel
3. Deploy automatically

### Netlify
1. Build: `npm run build`
2. Publish directory: `.next`
3. Deploy

### Other Platforms
Follow Next.js deployment guidelines for your platform.

## 🐛 Troubleshooting

### Module Not Found
```bash
npm install
```

### Build Errors
Check TypeScript errors:
```bash
npm run build
```

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
npx kill-port 3000
```

## 📧 Support

For questions or issues:
- Email: mahmoudhaisam15@gmail.com
- GitHub: github.com/MahmoudHaitham

---

**Next Steps:**
1. Run `npm run dev`
2. Customize content with your information
3. Replace placeholder images
4. Upload your actual CV PDF
5. Deploy to production!

🎉 Happy coding!


