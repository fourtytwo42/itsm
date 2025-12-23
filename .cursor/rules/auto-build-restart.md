---
description: Build and restart PM2 after code changes to make changes immediately accessible
alwaysApply: true
---

# Auto Build and Restart

**CRITICAL:** After making any code changes to the application, you MUST run `npm run build && pm2 restart all` to ensure the application is immediately accessible on the client.

## Purpose

After making any code changes to the application, you must:
1. Run `npm run build` to compile the application
2. Run `pm2 restart all` to restart all PM2 processes with the new build

This ensures that changes are immediately available for testing on the client.

## Execution Trigger

**When to Execute:**
- After any file changes in the codebase (`.ts`, `.tsx`, `.js`, `.jsx`, `.prisma`, etc.)
- After schema changes (`prisma/schema.prisma`)
- After API route changes
- After component changes
- After service/utility changes
- After configuration changes

**When NOT to Execute:**
- When only documentation files are changed (`.md` files in docs/)
- When only test files are changed (unless tests are part of the build)
- When only `.gitignore` or similar config files are changed

## Execution Process

**MANDATORY:** After completing any code changes, you MUST execute these commands:

### Step 1: Build the Application

```bash
cd /home/hendo420/itsm && npm run build
```

**Expected Behavior:**
- Build should complete successfully
- If build fails, fix errors before proceeding
- Wait for build to complete before restarting PM2
- If lock file exists, remove it: `rm -f .next/lock`

### Step 2: Restart PM2

```bash
cd /home/hendo420/itsm && pm2 restart all
```

**Expected Behavior:**
- Restart all PM2 processes
- Verify restart was successful
- Show PM2 status after restart

**Combined Command:**
```bash
cd /home/hendo420/itsm && npm run build && pm2 restart all
```

## Error Handling

**If Build Fails:**
- Display build errors clearly
- Do NOT restart PM2 (would restart with broken build)
- Allow user to fix errors and retry

**If PM2 Restart Fails:**
- Display PM2 error
- Show current PM2 status
- Allow user to manually restart if needed

## Integration

**Referenced By:**
- All code modification workflows
- File editing operations
- Schema changes
- Configuration updates

**References:**
- Project root: `/home/hendo420/itsm`
- Build command: `npm run build`
- PM2 restart: `pm2 restart all`

## Example Execution

```
User: "Update the login page to add a new field"

AI Process:
1. Make code changes to login page
2. [MANDATORY] Run: npm run build && pm2 restart all
3. Confirm: "Changes applied and application restarted. Build completed successfully."
```

## Important Notes

- **Always run after changes:** Don't skip this step - the user needs to access changes immediately
- **Handle build locks:** If build fails due to lock file, remove it: `rm -f .next/lock`
- **Wait for completion:** Don't proceed until build completes successfully
- **Verify PM2 status:** Show PM2 status after restart to confirm it's running

## Notes

- **Always use absolute paths:** `/home/hendo420/itsm`
- **Wait for build completion:** Don't restart PM2 until build succeeds
- **Show status:** Display build output and PM2 status after restart
- **Handle errors gracefully:** Don't proceed if build fails

