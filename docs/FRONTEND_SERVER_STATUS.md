# Frontend Server Status

## ✅ Servers Running

### Frontend
- **URL**: http://localhost:3000
- **Status**: ✅ Running (PID: 56523)
- **Command**: `pnpm dev`

### Backend
- **URL**: http://localhost:4000
- **Status**: ✅ Running
- **Health Check**: http://localhost:4000/healthz
- **Command**: `pnpm dev:plane-a`

## Configuration

### Environment Variables
Created `.env.local` in frontend directory:
```bash
API_BASE=http://localhost:4000
PUBLIC_API_BASE=/api
```

This ensures:
- Server-side requests proxy to `http://localhost:4000`
- Client-side requests use `/api` (proxied by Nuxt server)

## Testing the Connection

### 1. Open Frontend
Navigate to: **http://localhost:3000**

### 2. Test Providers Endpoint
Try: **http://localhost:3000/send-money/US-to-PH**

This should:
- Load the comparison page
- Fetch provider data from backend
- Display provider quotes

### 3. Check Browser Console
Open DevTools (F12) and check:
- **Console tab**: Look for any errors
- **Network tab**: Check `/api/providers` request
  - Should show status 200
  - Should have response data

### 4. Test API Directly
```bash
# Test backend directly
curl http://localhost:4000/api/providers?from=US&to=PH&amount=1000&method=bank

# Test through frontend proxy
curl http://localhost:3000/api/providers?from=US&to=PH&amount=1000&method=bank
```

## Troubleshooting

### If Frontend Shows Errors

1. **Check Backend is Running**
   ```bash
   curl http://localhost:4000/healthz
   # Should return: {"status":"ok"}
   ```

2. **Check Environment Variables**
   ```bash
   cd frontend
   cat .env.local
   # Should show API_BASE=http://localhost:4000
   ```

3. **Check Browser Console**
   - Open DevTools (F12)
   - Look for error messages
   - Check Network tab for failed requests

4. **Restart Servers**
   ```bash
   # Kill existing processes
   lsof -ti:3000 | xargs kill
   lsof -ti:4000 | xargs kill
   
   # Restart backend
   cd backend && pnpm dev:plane-a
   
   # Restart frontend (in new terminal)
   cd frontend && pnpm dev
   ```

### Common Issues

**Issue**: "API_BASE is not configured"
- **Fix**: Ensure `.env.local` exists with `API_BASE=http://localhost:4000`

**Issue**: "Failed to fetch providers"
- **Fix**: Check backend is running on port 4000
- **Fix**: Check database connection

**Issue**: CORS errors
- **Fix**: Not needed - frontend uses server-side proxy

## Next Steps

1. ✅ Servers are running
2. ⏳ Test the frontend in browser
3. ⏳ Verify API connections work
4. ⏳ Check all endpoints are connected

## Available Endpoints

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api/providers
- **Backend Health**: http://localhost:4000/healthz
- **Frontend Proxy**: http://localhost:3000/api/providers



