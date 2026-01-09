# 🚀 Railway Deployment Guide

This guide walks you through deploying the AI-Powered Code Review Assistant to Railway.

## 📋 Prerequisites Checklist

Before you begin, ensure you have:

- [ ] GitHub account
- [ ] Railway account ([Sign up here](https://railway.app/))
- [ ] Anthropic API key ([Get one here](https://console.anthropic.com/))
- [ ] GitHub OAuth Application credentials

---

## 🔐 Step 1: Create GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:
   - **Application name:** `AI Code Review Assistant`
   - **Homepage URL:** `https://your-frontend.railway.app` (update after deployment)
   - **Authorization callback URL:** `https://your-backend.railway.app/api/auth/github/callback` (update after deployment)
4. Click **"Register application"**
5. Note down your **Client ID**
6. Generate a new **Client Secret** and save it securely

> ⚠️ **Important:** You'll need to update the callback URL after getting your Railway domain.

---

## 🔑 Step 2: Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to **API Keys**
4. Create a new API key
5. Save the key securely

---

## 🛤️ Step 3: Create Railway Project

1. Log in to [Railway](https://railway.app/)
2. Click **"New Project"**
3. Select **"Empty Project"**
4. Give your project a name (e.g., `ai-code-review-assistant`)

---

## 🗄️ Step 4: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Wait for the database to provision
4. Click on the PostgreSQL service
5. Go to the **"Variables"** tab
6. Copy the `DATABASE_URL` value

---

## 📦 Step 5: Add Redis Database

1. Click **"+ New"** again
2. Select **"Database"** → **"Redis"**
3. Wait for Redis to provision
4. Click on the Redis service
5. Go to the **"Variables"** tab
6. Copy the `REDIS_URL` value

---

## ⚙️ Step 6: Deploy Backend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your `ai-code-review-assistant` repository
3. In the service settings:
   - Set **Root Directory:** `backend`
   - Railway will auto-detect Node.js

### Configure Backend Environment Variables

Go to the backend service's **"Variables"** tab and add:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<paste from PostgreSQL service>
REDIS_URL=<paste from Redis service>
GITHUB_CLIENT_ID=<your GitHub OAuth Client ID>
GITHUB_CLIENT_SECRET=<your GitHub OAuth Client Secret>
GITHUB_CALLBACK_URL=https://<your-backend-domain>.railway.app/api/auth/github/callback
ANTHROPIC_API_KEY=<your Anthropic API key>
JWT_SECRET=<generate a random 64-character string>
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=<generate a random 32-byte hex string>
FRONTEND_URL=https://<your-frontend-domain>.railway.app
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Generate Secrets

Run these commands to generate secure values:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Generate Domain

1. Go to the backend service's **"Settings"** tab
2. Under **"Domains"**, click **"Generate Domain"**
3. Note down the generated URL (e.g., `backend-production-xxxx.railway.app`)

---

## 🎨 Step 7: Deploy Frontend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select the same repository
3. In the service settings:
   - Set **Root Directory:** `frontend`

### Configure Frontend Environment Variables

Go to the frontend service's **"Variables"** tab and add:

```env
VITE_API_URL=https://<your-backend-domain>.railway.app
VITE_GITHUB_CLIENT_ID=<your GitHub OAuth Client ID>
```

### Generate Domain

1. Go to the frontend service's **"Settings"** tab
2. Under **"Domains"**, click **"Generate Domain"**
3. Note down the generated URL

---

## 🔄 Step 8: Update GitHub OAuth Callback

Now that you have your Railway domains:

1. Go back to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on your OAuth application
3. Update the **Authorization callback URL** to:
   ```
   https://<your-backend-domain>.railway.app/api/auth/github/callback
   ```
4. Update the **Homepage URL** to:
   ```
   https://<your-frontend-domain>.railway.app
   ```
5. Save changes

---

## 🔧 Step 9: Update Environment Variables

Go back to Railway and update these variables with your actual domains:

### Backend Variables to Update:
```env
GITHUB_CALLBACK_URL=https://<your-backend-domain>.railway.app/api/auth/github/callback
FRONTEND_URL=https://<your-frontend-domain>.railway.app
```

### Frontend Variables to Update:
```env
VITE_API_URL=https://<your-backend-domain>.railway.app
```

---

## ✅ Step 10: Verify Deployment

### Test Checklist

- [ ] Frontend loads at `https://<your-frontend-domain>.railway.app`
- [ ] Backend health check: `https://<your-backend-domain>.railway.app/api/health`
- [ ] API docs load: `https://<your-backend-domain>.railway.app/api/docs`
- [ ] GitHub OAuth login works
- [ ] Can connect a repository
- [ ] Can create a code review
- [ ] Review results display correctly

---

## 🔧 Troubleshooting

### Common Issues

#### 1. OAuth Redirect Mismatch

**Error:** `redirect_uri_mismatch`

**Solution:** Ensure the callback URL in GitHub OAuth settings exactly matches:
```
https://<your-backend-domain>.railway.app/api/auth/github/callback
```

#### 2. Database Connection Failed

**Error:** `Connection refused` or `ECONNREFUSED`

**Solution:**
- Verify `DATABASE_URL` is correctly set
- Check PostgreSQL service is running in Railway
- Ensure there are no typos in the connection string

#### 3. CORS Errors

**Error:** `Access-Control-Allow-Origin` errors in console

**Solution:**
- Verify `FRONTEND_URL` in backend matches your frontend domain
- Include the protocol (`https://`)

#### 4. Build Failures

**Solution:**
- Check Railway build logs for specific errors
- Ensure `package.json` scripts are correct
- Verify all dependencies are listed

#### 5. API Not Responding

**Solution:**
- Check backend service logs in Railway
- Verify `PORT` environment variable is set
- Ensure `NODE_ENV=production`

### View Logs

To view service logs in Railway:
1. Click on the service
2. Go to the **"Deployments"** tab
3. Click on a deployment to view logs

---

## 🌐 Custom Domain Setup (Optional)

### Backend Custom Domain

1. Go to backend service **"Settings"**
2. Under **"Domains"**, click **"+ Custom Domain"**
3. Enter your domain (e.g., `api.yourdomain.com`)
4. Add the provided CNAME record to your DNS

### Frontend Custom Domain

1. Go to frontend service **"Settings"**
2. Under **"Domains"**, click **"+ Custom Domain"**
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Add the provided CNAME record to your DNS

### Update Environment Variables

After setting up custom domains, update:

**Backend:**
```env
GITHUB_CALLBACK_URL=https://api.yourdomain.com/api/auth/github/callback
FRONTEND_URL=https://app.yourdomain.com
```

**Frontend:**
```env
VITE_API_URL=https://api.yourdomain.com
```

**GitHub OAuth App:**
- Update callback URL to your custom domain

---

## 📊 Monitoring

### Railway Metrics

Railway provides built-in metrics:
- CPU usage
- Memory usage
- Network traffic

Access via the **"Metrics"** tab in each service.

### Health Checks

The backend exposes health endpoints:
- `/api/health` - Full health check
- `/api/health/ready` - Readiness check
- `/api/health/live` - Liveness check

---

## 🔄 Continuous Deployment

Railway automatically deploys when you push to your connected GitHub branch.

### Manual Deployment

1. Go to your service
2. Click **"Deploy"** → **"Deploy Now"**

### Rollback

1. Go to **"Deployments"** tab
2. Find a previous successful deployment
3. Click **"Redeploy"**

---

## 💰 Cost Considerations

Railway offers:
- **Free tier:** $5 credit per month
- **Developer tier:** $5/month + usage

Estimated costs for this project:
- PostgreSQL: ~$5-10/month
- Redis: ~$3-5/month
- Backend service: ~$5-10/month
- Frontend service: ~$3-5/month

**Total estimated:** ~$16-30/month

---

## 🆘 Getting Help

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Open an Issue](https://github.com/rammallineni/ai-code-review-assistant/issues)

---

<div align="center">

**Happy Deploying! 🚀**

</div>
