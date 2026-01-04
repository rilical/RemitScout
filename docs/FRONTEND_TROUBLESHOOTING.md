# Frontend Troubleshooting Guide

## Current Issue: Server Not Responding

### Problem
Frontend server shows error:
```
ERROR  Error: Could not load .../.nuxt//dist/server/client.precomputed.mjs
```

### Root Cause
- Missing build file `client.precomputed.mjs`
- Version mismatch: `@nuxt/kit` was 3.19.3, expected 3.20.2
- Double slash in path (`//dist`)

### Solutions Applied

1. ✅ **Updated Dependencies**
   ```bash
   cd frontend
   pnpm update nuxt @nuxt/kit
   ```

2. ✅ **Cleaned Build Directories**
   ```bash
   rm -rf .nuxt .output node_modules/.vite
   ```

3. ✅ **Regenerated Types**
   ```bash
   pnpm nuxt prepare
   ```

4. ✅ **Fixed Nitro Config**
   Added experimental wasm support to nitro config

### Next Steps

If server still doesn't work:

1. **Check Server Logs**
   ```bash
   cd frontend
   pnpm dev
   # Look for errors in output
   ```

2. **Verify Backend is Running**
   ```bash
   curl http://localhost:4000/healthz
   # Should return: {"status":"ok"}
   ```

3. **Check Environment Variables**
   ```bash
   cd frontend
   cat .env.local
   # Should show: API_BASE=http://localhost:4000
   ```

4. **Try Alternative Port**
   ```bash
   cd frontend
   pnpm dev --port 3001
   ```

5. **Check Browser Console**
   - Open http://localhost:3000
   - Press F12 to open DevTools
   - Check Console and Network tabs for errors

### Manual Server Start

If automatic start fails:

```bash
# Terminal 1: Backend
cd backend
pnpm dev:plane-a

# Terminal 2: Frontend  
cd frontend
pnpm dev
```

### Expected Output

When server starts successfully, you should see:
```
➜ Local:    http://localhost:3000/
✔ Vite client built
✔ Vite server built
```

Then open http://localhost:3000 in your browser.



