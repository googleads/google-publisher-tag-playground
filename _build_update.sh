#!/bin/bash

CITC=$(g4 g4d)
PACKAGE=third_party/gpt_playground
TEMP=$(mktemp -d)

ADDLICENSE=~/go/bin/addlicense

# Exit if the temp directory wasn't created successfully.
if [ ! -e "$TEMP" ]; then
    >&2 echo "Failed to create temp directory"
    exit 1
fi

# Ensure addlicense is installed.
if ! command -v $ADDLICENSE >/dev/null; then
  echo "addlicense not installed! Run: go install github.com/google/addlicense@latest."
  exit 1
fi

cp -r $CITC/$PACKAGE/. $TEMP

pushd $TEMP
# Update dependencies to the latest semver version.
echo 'Updating dependencies to the latest semver version...'
npx npm-check-updates -u -t semver

# Address any fixable vulnerabilities (only update lockfile)
echo 'Addressing any fixable vulnerabilities...'
npm audit fix --package-lock-only

# Install and run tests.
echo 'Installing dependencies and running tests...'
npm install
npm run build && npm run test

# Clean up unneeded files.
echo 'Cleaning up unneeded files...'
rm -r dist/
rm -r node_modules/
find . ! -name "rollup.config.js" -name "*.js" -type f -delete

# Add license headers
echo 'Adding license headers...'
$ADDLICENSE -l apache -ignore *.sh -ignore BUILD .

# Copy changes back to google3.
echo 'Build and update complete, copying changes back to google3...'
cp -r . $CITC/$PACKAGE
popd