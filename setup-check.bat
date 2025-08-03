@echo off
echo ============================================
echo  Facebook Contact Extractor Setup Check
echo ============================================
echo.

echo Checking required files...
echo.

if exist manifest.json (
    echo [✓] manifest.json - Extension configuration
) else (
    echo [✗] manifest.json - MISSING!
    goto :error
)

if exist background.js (
    echo [✓] background.js - Background service worker
) else (
    echo [✗] background.js - MISSING!
    goto :error
)

if exist content.js (
    echo [✓] content.js - Main extraction logic
) else (
    echo [✗] content.js - MISSING!
    goto :error
)

if exist popup.html (
    echo [✓] popup.html - Extension popup interface
) else (
    echo [✗] popup.html - MISSING!
    goto :error
)

if exist popup.js (
    echo [✓] popup.js - Popup functionality
) else (
    echo [✗] popup.js - MISSING!
    goto :error
)

if exist styles.css (
    echo [✓] styles.css - UI styling
) else (
    echo [✗] styles.css - MISSING!
    goto :error
)

if exist icons\ (
    echo [✓] icons/ - Icon directory
    if exist icons\icon16.png (
        echo [✓] icons\icon16.png
    ) else (
        echo [!] icons\icon16.png - Missing but optional
    )
    if exist icons\icon48.png (
        echo [✓] icons\icon48.png
    ) else (
        echo [!] icons\icon48.png - Missing but optional
    )
    if exist icons\icon128.png (
        echo [✓] icons\icon128.png
    ) else (
        echo [!] icons\icon128.png - Missing but optional
    )
) else (
    echo [!] icons/ - Directory missing but optional
)

echo.
echo ============================================
echo  ✅ Setup Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Open Chrome and go to chrome://extensions/
echo 2. Enable "Developer mode" (toggle in top right)
echo 3. Click "Load unpacked" and select this folder
echo 4. Go to Facebook and start extracting contacts!
echo.
echo Keyboard shortcuts:
echo - Ctrl+Shift+E: Toggle extraction
echo - Ctrl+Shift+H: Hide/show control panel
echo.
pause
goto :end

:error
echo.
echo ============================================
echo  ❌ Setup Error!
echo ============================================
echo Some required files are missing.
echo Please ensure all files are properly created.
echo.
pause

:end
