@echo off
echo ========================================
echo  Facebook Contact Extractor - Quick Fix
echo ========================================
echo.
echo ISSUE FIXED: TypeError: Cannot read properties of undefined (reading 'download')
echo.
echo SOLUTION: Added "downloads" permission to manifest.json
echo.
echo TO APPLY THE FIX:
echo.
echo 1. Open Chrome and go to: chrome://extensions/
echo.
echo 2. Find "Facebook Contact Extractor" 
echo.
echo 3. Click the "Reload" button (circular arrow icon)
echo.
echo 4. The extension should now work without the download error
echo.
echo ========================================
echo  What was fixed:
echo ========================================
echo.
echo • Added "downloads" permission to manifest.json
echo • Added fallback mechanism for manual download
echo • Improved error handling for download failures
echo.
echo The extension now has proper permissions to use Chrome's
echo download API and will fall back to manual download if needed.
echo.
echo ========================================
echo  Test the fix:
echo ========================================
echo.
echo 1. Go to Facebook buy-and-sell groups
echo 2. Click the extension icon
echo 3. Click "Start Extraction"
echo 4. Let it collect some contacts
echo 5. Click "Export WhatsApp TXT"
echo 6. The download should work without errors
echo.
pause
