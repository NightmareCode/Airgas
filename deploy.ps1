param(
  [string]$Message = "Auto-deploy update"
)

Set-Location -Path "C:\Intern\Kerja\Website"

try { git rev-parse --is-inside-work-tree | Out-Null } catch { git init }

git add -A

try {
  git diff --cached --quiet
} catch {
  git commit -m $Message | Out-Null
}

git branch -M gh-pages

$remoteUrl = ""
try { $remoteUrl = git remote get-url origin } catch { $remoteUrl = "" }

if ($remoteUrl -ne "") {
  git push -u origin gh-pages
} else {
  Write-Output "No 'origin' remote set. Run: git remote add origin <YOUR_REPO_URL>"
  Write-Output "Then rerun: npm run deploy"
}
