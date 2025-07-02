# Deployment Instructions for ganger-staff

## 1. Deploy to Vercel

```bash
cd apps/ganger-staff
vercel deploy --prod --token=$VERCEL_TOKEN --scope=$VERCEL_SCOPE
```

## 2. Connect Edge Config

After deployment, I'll connect the Edge Config using the Vercel API:

```bash
# Get the project ID from the deployment
PROJECT_ID=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/ganger-staff?teamId=$VERCEL_TEAM_ID" \
  | jq -r '.id')

# Connect Edge Config to the project
curl -X POST "https://api.vercel.com/v1/edge-config/ecfg_a1cpzdoogkmshw6hed5qhxcgd5m8/connections?teamId=$VERCEL_TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"projectId\": \"$PROJECT_ID\"}"
```

## 3. Environment Variable

The Edge Config connection will automatically create the `EDGE_CONFIG_202507_1` environment variable in the project.

## 4. Test the Deployment

Once deployed and connected:
- Visit `https://ganger-staff.vercel.app` (or your custom domain)
- The middleware should route requests to the configured apps
- `/inventory` → ganger-inventory app
- `/actions` → ganger-actions app
- etc.

## Important Notes

- The Edge Config ID is: `ecfg_a1cpzdoogkmshw6hed5qhxcgd5m8`
- The middleware expects the env var: `EDGE_CONFIG_202507_1`
- Make sure all target apps are deployed and accessible