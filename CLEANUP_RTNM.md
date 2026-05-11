# RTNM-Group Repository Cleanup Report

**Date:** 2026-05-11
**Status:** Pending Execution

## Objective
Clean the RTNM-Group repository by removing `node_modules/` and `*.node` files from git history to reduce repository size and remove binary dependencies.

## Steps to Execute

### Prerequisites
- Python 3 with pip
- Git installed
- Write access to the GitHub repository

### Execution Steps

1. **Install git-filter-repo**
   ```bash
   pip3 install git-filter-repo
   ```

2. **Clone as bare mirror**
   ```bash
   git clone --mirror https://github.com/imrejaul007/RTNM-Group.git /tmp/RTNM-Group-mirror
   ```

3. **Filter out .node files from history**
   ```bash
   cd /tmp/RTNM-Group-mirror
   git filter-repo --path-glob '*.node' --invert-paths --force
   ```

4. **Filter out node_modules from history**
   ```bash
   git filter-repo --path-glob 'node_modules' --invert-paths --force
   ```

5. **Push cleaned history to remote**
   ```bash
   git push --mirror https://github.com/imrejaul007/RTNM-Group.git
   ```

6. **Recreate local repository**
   ```bash
   cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/RTNM-Group
   rm -rf .git
   git init
   git remote add origin https://github.com/imrejaul007/RTNM-Group.git
   git add -A
   git commit -m "Clean repo"
   git push -u origin main
   ```

## Automated Script
A ready-to-run script has been created at:
`/Users/rejaulkarim/Documents/ReZ Full App/cleanup_rtnm.sh`

Run with:
```bash
chmod +x /Users/rejaulkarim/Documents/ReZ\ Full\ App/cleanup_rtnm.sh
/Users/rejaulkarim/Documents/ReZ\ Full\ App/cleanup_rtnm.sh
```

## Expected Results
- Removal of all `node_modules/` directories from git history
- Removal of all `*.node` files from git history
- Significantly reduced repository size
- Clean history with only source code

## Important Notes
- **This is a destructive operation** - git history will be rewritten
- Ensure you have a backup or the mirror created before proceeding
- All collaborators will need to re-clone the repository after this change
- Consider informing team members before performing this cleanup

## Report Status
- [ ] git-filter-repo installed
- [ ] Mirror created at /tmp/RTNM-Group-mirror
- [ ] .node files filtered
- [ ] node_modules filtered
- [ ] Pushed to remote
- [ ] Local repo recreated
