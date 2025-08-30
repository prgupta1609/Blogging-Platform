# Deployment Guide - BlogHub

This guide will help you deploy your BlogHub blogging platform to production.

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file in your project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Build the Application

```bash
npm run build
```

### 3. Deploy

Choose your preferred deployment platform from the options below.

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

**Pros**: Fast, easy, great for React apps
**Cons**: Limited free tier

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Go to your Vercel dashboard
   - Navigate to Settings > Environment Variables
   - Add your Supabase credentials

4. **Custom Domain** (Optional)
   - Go to Settings > Domains
   - Add your custom domain

### Option 2: Netlify

**Pros**: Generous free tier, easy setup
**Cons**: Slightly slower than Vercel

1. **Install Netlify CLI**
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy**
   ```bash
   netlify deploy --prod --dir=dist
   ```

3. **Configure Environment Variables**
   - Go to Site Settings > Environment Variables
   - Add your Supabase credentials

### Option 3: GitHub Pages

**Pros**: Free, integrated with GitHub
**Cons**: Limited features, no server-side functionality

1. **Update package.json**
   ```json
   {
     "homepage": "https://yourusername.github.io/yourrepo",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

2. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

### Option 4: AWS S3 + CloudFront

**Pros**: Highly scalable, cost-effective for high traffic
**Cons**: More complex setup

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://your-blog-domain
   ```

2. **Enable Static Website Hosting**
   ```bash
   aws s3 website s3://your-blog-domain --index-document index.html --error-document index.html
   ```

3. **Upload Files**
   ```bash
   aws s3 sync dist/ s3://your-blog-domain
   ```

4. **Configure CloudFront** (Optional, for CDN)
   - Create CloudFront distribution
   - Point to S3 bucket
   - Configure custom domain

### Option 5: Docker

**Pros**: Consistent environment, easy scaling
**Cons**: More complex, requires Docker knowledge

1. **Create Dockerfile**
   ```dockerfile
   FROM nginx:alpine
   COPY dist/ /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create nginx.conf**
   ```nginx
   events {
       worker_connections 1024;
   }
   
   http {
       include /etc/nginx/mime.types;
       default_type application/octet-stream;
       
       server {
           listen 80;
           server_name localhost;
           root /usr/share/nginx/html;
           index index.html;
           
           location / {
               try_files $uri $uri/ /index.html;
           }
       }
   }
   ```

3. **Build and Run**
   ```bash
   docker build -t bloghub .
   docker run -p 80:80 bloghub
   ```

## 🔧 Production Configuration

### 1. Supabase Setup

1. **Enable Row Level Security (RLS)**
   ```sql
   ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
   ```

2. **Configure RLS Policies**
   - Ensure your migration file has proper policies
   - Test policies in development

3. **Set up Storage Buckets**
   ```sql
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('blog-images', 'blog-images', true);
   ```

### 2. Performance Optimization

1. **Enable Compression**
   ```bash
   # For nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   ```

2. **Set Cache Headers**
   ```bash
   # For static assets
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **Enable HTTP/2** (if supported by your hosting)

### 3. Security Headers

Add these headers to your server configuration:

```bash
# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;
```

## 📊 Monitoring & Analytics

### 1. Error Tracking

- **Sentry**: Free tier available
- **LogRocket**: Session replay and error tracking
- **Bugsnag**: Error monitoring

### 2. Performance Monitoring

- **Web Vitals**: Core Web Vitals tracking
- **Lighthouse CI**: Automated performance testing
- **Real User Monitoring (RUM)**: User experience metrics

### 3. Analytics

- **Google Analytics**: Free, comprehensive
- **Plausible**: Privacy-focused, lightweight
- **Fathom**: Simple, privacy-friendly

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Errors**
   - Check TypeScript compilation
   - Verify all dependencies are installed
   - Check environment variables

2. **Runtime Errors**
   - Check browser console for errors
   - Verify Supabase connection
   - Check RLS policies

3. **Performance Issues**
   - Optimize images
   - Enable compression
   - Use CDN for static assets

### Debug Mode

Enable debug mode in development:

```typescript
// In your Supabase client
const supabase = createClient(url, key, {
  auth: {
    debug: true
  }
});
```

## 📚 Additional Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Production Build](https://create-react-app.dev/docs/production-build/)
- [Supabase Production Checklist](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Tailwind CSS Production](https://tailwindcss.com/docs/optimizing-for-production)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the error logs
3. Check Supabase dashboard for database issues
4. Create an issue in the repository

---

Happy deploying! 🚀
