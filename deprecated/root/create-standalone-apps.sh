#!/bin/bash

echo "Creating standalone package.json files for each app..."
echo "====================================================="

# For each app, create a standalone package.json without workspace dependencies
for app_dir in apps/*/; do
  if [ -d "$app_dir" ]; then
    app_name=$(basename "$app_dir")
    pkg_file="$app_dir/package.json"
    
    if [ -f "$pkg_file" ]; then
      echo "Processing $app_name..."
      
      # Read the current package.json
      cat "$pkg_file" | python3 -c "
import sys, json

data = json.load(sys.stdin)

# Remove workspace and file dependencies
deps = data.get('dependencies', {})
new_deps = {}

for dep, version in deps.items():
    if 'workspace:' not in version and 'file:' not in version:
        new_deps[dep] = version
    elif dep == '@ganger/ui':
        # Add essential UI dependencies directly
        new_deps['@headlessui/react'] = '^2.2.0'
        new_deps['@heroicons/react'] = '^2.2.0'
        new_deps['clsx'] = '^2.1.1'
        new_deps['lucide-react'] = '^0.516.0'
    elif dep == '@ganger/utils':
        # Add essential utils dependencies
        new_deps['zod'] = '^3.25.51'
        new_deps['date-fns'] = '^4.1.0'
    elif dep == '@ganger/auth':
        # Add auth dependencies
        new_deps['@supabase/supabase-js'] = '^2.49.10'
        new_deps['jsonwebtoken'] = '^9.0.2'
        new_deps['bcryptjs'] = '^3.0.2'

data['dependencies'] = new_deps

# Ensure all Next.js apps have required dependencies
if 'next' in new_deps:
    new_deps['react'] = '^18.3.1'
    new_deps['react-dom'] = '^18.3.1'

print(json.dumps(data, indent=2))
" > "$pkg_file.standalone"
      
      # Replace the original with standalone version
      mv "$pkg_file.standalone" "$pkg_file"
      
      echo "  ✅ Created standalone package.json"
    fi
  fi
done

echo ""
echo "Done! All apps now have standalone package.json files."
echo "This removes workspace dependencies and adds direct dependencies instead."