# Deployment Guide

This guide explains how to set up and manage automated deployments for the Roo Code Memory Bank MCP Server.

## Overview

The project uses GitHub Actions for continuous integration and automated deployments to both GitHub Releases and NPM. The deployment process is triggered when you create a new git tag or manually trigger the workflow.

## Prerequisites

Before setting up automated deployments, ensure you have:

1. **GitHub Repository**: Your code should be hosted on GitHub
2. **NPM Account**: You need an NPM account to publish packages
3. **Required Secrets**: GitHub repository secrets must be configured

## Setting Up Deployment

### 1. Configure GitHub Secrets

You need to add the following secrets to your GitHub repository:

#### NPM_TOKEN
1. Go to [npmjs.com](https://www.npmjs.com/) and log in
2. Click on your profile → "Access Tokens"
3. Click "Generate New Token" → "Classic Token"
4. Select "Automation" level access
5. Copy the generated token
6. In your GitHub repository, go to Settings → Secrets and variables → Actions
7. Click "New repository secret"
8. Name: `NPM_TOKEN`
9. Value: Paste your NPM token

#### GITHUB_TOKEN
This is automatically provided by GitHub Actions, no setup required.

### 2. Verify Package Configuration

Ensure your `package.json` has the correct settings:

```json
{
  "name": "roo-mcp-server",
  "version": "0.1.0",
  "main": "dist/index.js",
  "bin": {
    "roo-mcp-server": "dist/index.js"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc && shx chmod +x dist/*.js",
    "prepare": "npm run build"
  }
}
```

## Deployment Workflows

### Automatic Deployment (Recommended)

1. **Create a new release tag**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **The workflow will automatically**:
   - Run tests and build the project
   - Create a GitHub release
   - Publish to NPM
   - Upload build artifacts

### Manual Deployment

You can also trigger deployments manually:

1. Go to your GitHub repository
2. Click "Actions" tab
3. Select "Release and Publish" workflow
4. Click "Run workflow"
5. Enter the version (e.g., v1.0.1)
6. Click "Run workflow"

## Version Management

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/) for version numbers:

- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, backward compatible

### Version Workflow

1. **Update version in development**:
   ```bash
   npm version patch  # or minor, major
   ```

2. **Create and push tag**:
   ```bash
   git push origin main
   git push origin --tags
   ```

3. **GitHub Actions will handle the rest**

## Troubleshooting

### Common Issues

#### NPM Publish Fails
- **Cause**: Invalid NPM_TOKEN or package name already exists
- **Solution**: Check NPM token permissions and package name uniqueness

#### GitHub Release Fails
- **Cause**: Tag already exists or insufficient permissions
- **Solution**: Use a new tag version or check repository permissions

#### Build Fails
- **Cause**: TypeScript compilation errors
- **Solution**: Fix compilation errors locally first

### Debugging

1. **Check GitHub Actions logs**:
   - Go to Actions tab in your repository
   - Click on the failed workflow run
   - Review the logs for error details

2. **Test locally**:
   ```bash
   npm run build
   npm pack --dry-run
   ```

## Monitoring

### Success Indicators

- ✅ GitHub Release created
- ✅ NPM package published
- ✅ All tests pass
- ✅ Build artifacts uploaded

### Verification

After deployment:

1. **Check GitHub Releases**: Your release should appear in the releases section
2. **Verify NPM**: Visit `https://www.npmjs.com/package/roo-mcp-server`
3. **Test Installation**: Try installing your package in a fresh environment

```bash
npm install -g roo-mcp-server
roo-mcp-server --help
```

## Best Practices

1. **Always test locally** before pushing tags
2. **Use meaningful commit messages** for releases
3. **Update CHANGELOG.md** before releasing
4. **Test in staging environment** when possible
5. **Monitor deployment results** in GitHub Actions
6. **Keep dependencies up to date** for security

## Security Considerations

- Never commit NPM tokens to code
- Use minimal required permissions for tokens
- Regularly rotate access tokens
- Monitor package downloads for suspicious activity
- Keep GitHub Actions workflows up to date