# Start Django backend in new PowerShell window
Start-Process powershell -ArgumentList @"
conda activate mini_project
cd backend
python manage.py runserver
"@

# Start frontend in new PowerShell window
Start-Process powershell -ArgumentList @"
cd frontend
npm run dev
"@