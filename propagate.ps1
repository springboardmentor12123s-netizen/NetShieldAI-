$src = "C:\Users\navee\OneDrive\Desktop\gowtham4201"

Write-Host "Propagating cleaned backend/app to milestone-1-backend..."
robocopy "$src\backend\app" "$src\milestone-1-backend\backend\app" /E /XD venv __pycache__ .pytest_cache /XF "*.pyc" /NJH /NJS /NFL /NDL

Write-Host "Removing temp audit scripts..."
Remove-Item "$src\audit_cleanup.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "$src\audit_imports.py" -Force -ErrorAction SilentlyContinue

Write-Host "Done."
