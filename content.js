// Content script for Facebook Contact Extractor
class FacebookContactExtractor {
  constructor() {
    this.isActive = false;
    this.isScrolling = false;
    this.extractedNumbers = new Set();
    this.scrollInterval = null;
    this.extractInterval = null;
    this.navigationInterval = null;
    this.healthCheckInterval = null;
    this.reconnectionInterval = null;
    this.statusElement = null;
    this.lastScrollPosition = 0;
    this.scrollTimeout = null;
    this.originalUrl = '';
    this.groupUrl = '';
    this.fallbackMode = false;
    this.humanBehavior = {
      lastActivity: Date.now(),
      mouseMovements: 0,
      clickEvents: 0,
      scrollEvents: 0,
      sessionStartTime: Date.now()
    };
    
    // Comprehensive international phone number patterns
    this.phonePatterns = [
      // International format with country code
      /\+[1-9]\d{0,3}[-.\s]?\(?[0-9]{1,4}\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}/g,
      
      // WhatsApp and messaging app formats
      /(?:wa\.me\/|whatsapp\.com\/send\?phone=|telegram\.me\/)(\+?[0-9]{7,15})/gi,
      /(?:viber|line|wechat)[:\s]*(\+?[0-9]{7,15})/gi,
      
      // Contact patterns with context (multilingual)
      /(?:📞|📱|☎️|contact|call|phone|mobile|whatsapp|wa|tel|telefon|telefono|téléphone|электронный|联系|連絡)[:\s]*(\+?[0-9]{7,15})/gi,
      /(?:number|numero|nummer|numéro|номер|번호|号码)[:\s]*(\+?[0-9]{7,15})/gi,
      
      // Country-specific patterns
      
      // Pakistan
      /\b0?3[0-9]{2}[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,    // 0302-8185226, 03028185226
      /\b\+?92[-.\s]?3[0-9]{2}[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, // +92-302-818-5226
      
      // India
      /\b\+?91[-.\s]?[6-9][0-9]{9}\b/g,                    // +91-9876543210
      /\b[6-9][0-9]{9}\b/g,                                 // 9876543210
      
      // USA/Canada
      /\b\+?1[-.\s]?\(?[2-9][0-9]{2}\)?[-.\s]?[2-9][0-9]{2}[-.\s]?[0-9]{4}\b/g, // +1-555-123-4567
      /\b\(?[2-9][0-9]{2}\)?[-.\s]?[2-9][0-9]{2}[-.\s]?[0-9]{4}\b/g, // (555) 123-4567
      
      // UK
      /\b\+?44[-.\s]?[1-9][0-9]{8,9}\b/g,                  // +44-7700-900123
      /\b0[1-9][0-9]{8,9}\b/g,                             // 07700-900123
      
      // Germany
      /\b\+?49[-.\s]?[1-9][0-9]{10,11}\b/g,                // +49-30-12345678
      /\b0[1-9][0-9]{10,11}\b/g,                           // 030-12345678
      
      // France
      /\b\+?33[-.\s]?[1-9][0-9]{8}\b/g,                    // +33-1-23-45-67-89
      /\b0[1-9][-.\s]?[0-9]{2}[-.\s]?[0-9]{2}[-.\s]?[0-9]{2}[-.\s]?[0-9]{2}\b/g, // 01-23-45-67-89
      
      // Australia
      /\b\+?61[-.\s]?[2-478][0-9]{8}\b/g,                  // +61-2-1234-5678
      /\b0[2-478][0-9]{8}\b/g,                             // 02-1234-5678
      
      // Japan
      /\b\+?81[-.\s]?[1-9][0-9]{8,9}\b/g,                  // +81-90-1234-5678
      /\b0[1-9][0-9]{8,9}\b/g,                             // 090-1234-5678
      
      // China
      /\b\+?86[-.\s]?1[3-9][0-9]{9}\b/g,                   // +86-138-0013-8000
      /\b1[3-9][0-9]{9}\b/g,                               // 13800138000
      
      // South Korea
      /\b\+?82[-.\s]?[1-9][0-9]{7,8}\b/g,                  // +82-10-1234-5678
      /\b0[1-9][0-9]{7,8}\b/g,                             // 010-1234-5678
      
      // Brazil
      /\b\+?55[-.\s]?[1-9][0-9]{10}\b/g,                   // +55-11-99999-9999
      /\b\(?[1-9][0-9]\)?[-.\s]?9?[0-9]{4}[-.\s]?[0-9]{4}\b/g, // (11) 99999-9999
      
      // Mexico
      /\b\+?52[-.\s]?[1-9][0-9]{9}\b/g,                    // +52-55-1234-5678
      /\b[1-9][0-9]{9}\b/g,                                // 5512345678
      
      // Russia
      /\b\+?7[-.\s]?[1-9][0-9]{9}\b/g,                     // +7-921-123-45-67
      /\b8[-.\s]?[1-9][0-9]{9}\b/g,                        // 8-921-123-45-67
      
      // Turkey
      /\b\+?90[-.\s]?[1-9][0-9]{9}\b/g,                    // +90-532-123-4567
      /\b0[1-9][0-9]{9}\b/g,                               // 0532-123-4567
      
      // ==================== ENHANCED UAE PATTERNS ====================
      // UAE - All possible formats for mobile networks (50, 55, 56, 58)
      
      // International formats with +971
      /\b\+971[-.\s]?[5][0568][-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,    // +971-50-123-4567
      /\b\+971[-.\s]?\(?[5][0568]\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, // +971(50)123-4567
      /\b\+971[5][0568][0-9]{7}\b/g,                                  // +971501234567
      /\(\+971\)[-.\s]?[5][0568][-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,  // (+971)50-123-4567
      /\(\+971\)[-.\s]?[5][0568][0-9]{7}\b/g,                        // (+971)501234567
      
      // Without + but with 971 prefix
      /\b971[-.\s]?[5][0568][-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,      // 971-50-123-4567
      /\b971[5][0568][0-9]{7}\b/g,                                    // 971501234567
      /\b0*971[-.\s]?[5][0568][-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,    // 00971-50-123-4567
      
      // Local UAE formats (starting with 0)
      /\b0[5][0568][-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,               // 050-123-4567
      /\b0[5][0568][0-9]{7}\b/g,                                      // 0501234567
      
      // UAE with various spacing patterns
      /\b\+971[-.\s][5][0568][-.\s][0-9]{3}[-.\s][0-9]{4}\b/g,       // +971 50 123 4567
      /\b\+971[-.\s][5][0568][-.\s][0-9]{7}\b/g,                     // +971 50 1234567
      /\b971[-.\s][5][0568][-.\s][0-9]{3}[-.\s][0-9]{4}\b/g,         // 971 50 123 4567
      
      // ==================== ENHANCED MALAYSIAN PATTERNS ====================
      // Malaysia - Mobile networks (01X series: 010-019)
      
      // International formats with +60
      /\b\+60[-.\s]?1[0-9][-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,        // +60-12-345-6789
      /\b\+60[-.\s]?1[0-9][-.\s]?[0-9]{7}\b/g,                       // +60-12-3456789
      /\b\+601[0-9][0-9]{7}\b/g,                                      // +60123456789
      /\b\+60[-.\s]1[0-9][-.\s][0-9]{3}[-.\s][0-9]{4}\b/g,          // +60 12 345 6789
      
      // Without + but with 60 prefix
      /\b0*60[-.\s]?1[0-9][-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,        // 0060-12-345-6789
      /\b601[0-9][0-9]{7}\b/g,                                        // 60123456789
      
      // Local Malaysian formats (starting with 01)
      /\b01[0-9][-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,                  // 012-345-6789
      /\b01[0-9][-.\s]?[0-9]{7}\b/g,                                  // 012-3456789
      /\b01[0-9][0-9]{7}\b/g,                                         // 0123456789
      /\b01[0-9][-.\s][0-9]{3}[-.\s][0-9]{4}\b/g,                    // 012 345 6789
      
      // Malaysian with various spacing
      /\b\+6012[-.\s][0-9]{3}[-.\s][0-9]{4}\b/g,                     // +6012 345 6789
      /\b\+6012[-.\s][0-9]{7}\b/g,                                    // +6012-3456789
      
      // ==================== ENHANCED SAUDI PATTERNS ====================
      // Saudi Arabia - Mobile networks (05X series: 050-059)
      
      // International formats with +966
      /\b\+966[-.\s]?[5][0-9][-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,     // +966-50-123-4567
      /\b\+966[-.\s]?[5][0-9][0-9]{7}\b/g,                           // +966-501234567
      /\b\+966[5][0-9][0-9]{7}\b/g,                                   // +966501234567
      /\b\+966[-.\s][5][0-9][-.\s][0-9]{3}[-.\s][0-9]{4}\b/g,       // +966 50 123 4567
      
      // Without + but with 966 prefix
      /\b0*966[-.\s]?[5][0-9][-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,     // 00966-50-123-4567
      /\b966[5][0-9][0-9]{7}\b/g,                                     // 966501234567
      
      // Local Saudi formats (starting with 05)
      /\b0[5][0-9][-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,                // 050-123-4567
      /\b0[5][0-9][0-9]{7}\b/g,                                       // 0501234567
      /\b0[5][0-9][-.\s][0-9]{3}[-.\s][0-9]{4}\b/g,                  // 050 123 4567
      
      // Generic patterns for other countries
      /\b\+[1-9]\d{6,14}\b/g,                              // Any international format +country-code
      
      // Common formats with separators
      /\b[0-9]{3}[-.\s][0-9]{3}[-.\s][0-9]{4,6}\b/g,       // 123-456-7890
      /\b[0-9]{4}[-.\s][0-9]{3}[-.\s][0-9]{3,4}\b/g,       // 1234-567-890
      /\b\([0-9]{3}\)[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,   // (123) 456-7890
      
      // Parentheses formats for international numbers
      /\(\+?[0-9]{7,15}\)/g,                               // (+1234567890)
      /\(\+?[0-9]{2,4}\)[-.\s]?[0-9]{7,12}/g,              // (+971)501234567
      
      // Multi-line contact detection
      /(?:📞|contact|call)[^\n]*\n.*?(\+?[0-9]{7,15})/gi,
      /(?:phone|mobile|whatsapp)[^:]*:[^\n]*(\+?[0-9]{7,15})/gi,
      
      // Email signatures and contact info
      /(?:tel|phone|mobile|cell)[:\s]*(\+?[0-9]{7,15})/gi,
      /(?:M|P|T)[:\s]*(\+?[0-9]{7,15})/gi,                 // M: mobile, P: phone, T: telephone
      
      // Fallback patterns for any reasonable phone number
      /\b[0-9]{8,15}\b/g                                    // 8-15 digit numbers as fallback (increased from 7)
    ];
    
    this.init();
  }
  
  init() {
    this.createStatusUI();
    this.setupKeyboardShortcuts();
    this.setupHumanBehaviorTracking();
    this.setupStealthMode();
    this.setupExtensionHealthCheck();
    this.setupGlobalErrorHandler();
    this.restoreBackupContacts();
    console.log('Facebook Contact Extractor initialized with stealth mode and enhanced error handling');
  }

  restoreBackupContacts() {
    try {
      const backupContacts = localStorage.getItem('fb-extractor-backup-contacts');
      const backupTimestamp = localStorage.getItem('fb-extractor-backup-timestamp');
      
      if (backupContacts) {
        const contacts = JSON.parse(backupContacts);
        const timestamp = new Date(backupTimestamp);
        const hoursSinceBackup = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
        
        // Only restore if backup is less than 24 hours old
        if (hoursSinceBackup < 24) {
          console.log(`[FB Extractor] Found ${contacts.length} backup contacts from ${timestamp.toLocaleString()}`);
          
          // Add backup contacts to current session
          contacts.forEach(contact => {
            if (contact.number) {
              this.extractedNumbers.add(contact.number);
            }
          });
          
          // Try to save to extension storage if context is available
          if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
            this.safeSaveContacts(contacts);
          }
          
          // Clear local storage backup after successful restore
          localStorage.removeItem('fb-extractor-backup-contacts');
          localStorage.removeItem('fb-extractor-backup-timestamp');
          
          console.log(`[FB Extractor] Restored ${contacts.length} contacts from backup`);
        } else {
          console.log(`[FB Extractor] Backup contacts are too old (${Math.round(hoursSinceBackup)} hours), skipping restore`);
          // Clear old backup
          localStorage.removeItem('fb-extractor-backup-contacts');
          localStorage.removeItem('fb-extractor-backup-timestamp');
        }
      }
    } catch (error) {
      console.warn('[FB Extractor] Error restoring backup contacts:', error);
    }
  }

  setupExtensionHealthCheck() {
    // Periodic check to detect extension context invalidation
    this.healthCheckInterval = setInterval(() => {
      try {
        // Test if extension context is still valid
        if (!chrome || !chrome.runtime || !chrome.runtime.id) {
          throw new Error('Extension context invalidated');
        }
        
        // Additional test - try to access runtime API
        const extensionId = chrome.runtime.id;
        if (!extensionId) {
          throw new Error('Extension ID not accessible');
        }
      } catch (error) {
        console.warn('[FB Extractor] Extension health check failed:', error.message);
        clearInterval(this.healthCheckInterval);
        this.handleExtensionInvalidation();
        this.showExtensionReloadNotification();
      }
    }, 10000); // Check every 10 seconds
  }

  // Global error handler for extension context issues
  setupGlobalErrorHandler() {
    // Catch any unhandled extension context errors
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message && 
          (event.error.message.includes('Extension context invalidated') ||
           event.error.message.includes('message port closed') ||
           event.error.message.includes('receiving end does not exist'))) {
        
        console.warn('[FB Extractor] Global error handler caught extension context invalidation');
        event.preventDefault(); // Prevent error from propagating
        this.handleExtensionInvalidation();
        this.showExtensionReloadNotification();
        return false;
      }
    });

    // Also catch unhandled promise rejections related to extension context
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message &&
          (event.reason.message.includes('Extension context invalidated') ||
           event.reason.message.includes('message port closed') ||
           event.reason.message.includes('receiving end does not exist'))) {
        
        console.warn('[FB Extractor] Global promise rejection handler caught extension context invalidation');
        event.preventDefault(); // Prevent unhandled rejection
        this.handleExtensionInvalidation();
        this.showExtensionReloadNotification();
      }
    });
  }
  
  setupHumanBehaviorTracking() {
    // Track real user interactions to blend in
    document.addEventListener('mousemove', () => {
      this.humanBehavior.mouseMovements++;
      this.humanBehavior.lastActivity = Date.now();
    });
    
    document.addEventListener('click', () => {
      this.humanBehavior.clickEvents++;
      this.humanBehavior.lastActivity = Date.now();
    });
    
    document.addEventListener('scroll', () => {
      this.humanBehavior.scrollEvents++;
      this.humanBehavior.lastActivity = Date.now();
    });
  }
  
  setupStealthMode() {
    // Hide from Facebook's automation detection
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    
    // Prevent automation detection through timing analysis
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(callback, delay, ...args) {
      // Add slight random variation to timeouts
      const variation = Math.floor(Math.random() * 100) - 50;
      return originalSetTimeout(callback, delay + variation, ...args);
    };
  }
  
  createStatusUI() {
    // Create floating status panel
    this.statusElement = document.createElement('div');
    this.statusElement.id = 'fb-contact-extractor-status';
    this.statusElement.innerHTML = `
      <div class="extractor-header">
        <h3>Contact Extractor</h3>
        <button id="extractor-toggle">Start</button>
        <button id="extractor-close">×</button>
      </div>
      <div class="extractor-stats">
        <div>Status: <span id="extractor-status">Inactive</span></div>
        <div>Found: <span id="extractor-count">0</span> contacts</div>
        <div>Scrolling: <span id="extractor-scroll">No</span></div>
        <div>Expanding: <span id="extractor-expanding">No</span></div>
        <div>Mode: <span id="extractor-mode">Continuous</span></div>
        <div>Interactions: <span id="extractor-interactions">0</span></div>
      </div>
      <div class="extractor-controls">
        <button id="extractor-export">Export TXT</button>
        <button id="extractor-clear">Clear All</button>
        <button id="extractor-view">View Contacts</button>
      </div>
    `;
    
    document.body.appendChild(this.statusElement);
    
    // Add event listeners
    document.getElementById('extractor-toggle').addEventListener('click', () => this.toggle());
    document.getElementById('extractor-close').addEventListener('click', () => this.hide());
    document.getElementById('extractor-export').addEventListener('click', () => this.exportCSV());
    document.getElementById('extractor-clear').addEventListener('click', () => this.clearContacts());
    document.getElementById('extractor-view').addEventListener('click', () => this.viewContacts());
  }
  
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+E to toggle extraction
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        this.toggle();
      }
      // Ctrl+Shift+H to hide/show UI
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        this.toggleUI();
      }
    });
  }
  
  toggle() {
    if (this.isActive) {
      this.stop();
    } else {
      this.start();
    }
  }
  
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.updateStatus('Active - Extracting', 'green');
    document.getElementById('extractor-toggle').textContent = 'Stop';
    
    // Store the original URL to detect navigation
    this.originalUrl = window.location.href;
    this.groupUrl = this.originalUrl; // Store group URL for returning
    
    // Set up navigation monitoring
    this.monitorNavigation();
    
    // Start with a human-like delay
    const startDelay = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
    
    setTimeout(() => {
      // Start infinite scrolling
      this.startInfiniteScroll();
      
      // Start contact extraction
      this.startExtraction();
      
      // Start subtle mouse movement simulation
      this.startSubtleMouseMovements();
    }, startDelay);
    
    console.log('[Stealth] Contact extraction started with human-like behavior');
  }
  
  monitorNavigation() {
    // Monitor URL changes to detect reel navigation
    this.navigationInterval = setInterval(() => {
      const currentUrl = window.location.href;
      
      // Check if we've navigated to a reel
      if (currentUrl.includes('/reel/') && !this.originalUrl.includes('/reel/')) {
        console.log('[FB Extractor] 🚨 Detected reel navigation, attempting to return to group...');
        this.handleReelNavigation();
      }
      
      // Check if we've navigated away from the group
      else if (!currentUrl.includes('groups/') && this.originalUrl.includes('groups/')) {
        console.log('[FB Extractor] 🚨 Navigated away from group, attempting to return...');
        this.returnToGroup();
      }
      
      // Update current URL
      this.originalUrl = currentUrl;
      
    }, 2000); // Check every 2 seconds
  }
  
  handleReelNavigation() {
    console.log('[FB Extractor] Handling reel navigation...');
    
    // Try to close the reel and return to group
    this.closeReel();
    
    // If that doesn't work, navigate back
    setTimeout(() => {
      if (window.location.href.includes('/reel/')) {
        console.log('[FB Extractor] Reel still open, navigating back to group...');
        this.returnToGroup();
      }
    }, 3000);
  }
  
  closeReel() {
    // Look for close buttons on reel
    const closeSelectors = [
      '[aria-label="Close"]',
      '[aria-label="Back"]', 
      '[role="button"][aria-label*="Close"]',
      'div[role="button"] svg[aria-label="Close"]',
      '.x1i10hfl[role="button"]', // Generic close button
      '[data-testid="close-button"]'
    ];
    
    closeSelectors.forEach(selector => {
      try {
        const closeButton = document.querySelector(selector);
        if (closeButton && closeButton.offsetParent !== null) {
          console.log('[FB Extractor] Found close button, clicking...');
          this.humanLikeClick(closeButton);
          return;
        }
      } catch (error) {
        console.log('[FB Extractor] Error finding close button:', error);
      }
    });
    
    // Try pressing Escape key
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 }));
  }
  
  returnToGroup() {
    if (this.groupUrl && this.groupUrl !== window.location.href) {
      console.log('[FB Extractor] Returning to group URL:', this.groupUrl);
      
      // Use history.back() first (more natural)
      if (window.history.length > 1) {
        window.history.back();
        
        // If still not back after 3 seconds, force navigate
        setTimeout(() => {
          if (window.location.href !== this.groupUrl) {
            window.location.href = this.groupUrl;
          }
        }, 3000);
      } else {
        // Direct navigation if no history
        window.location.href = this.groupUrl;
      }
    }
  }
  
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.isScrolling = false;
    this.updateStatus('Inactive', 'red');
    document.getElementById('extractor-toggle').textContent = 'Start';
    document.getElementById('extractor-scroll').textContent = 'No';
    
    // Clear intervals
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }

    if (this.extractInterval) {
      clearInterval(this.extractInterval);
      this.extractInterval = null;
    }

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
    
    if (this.navigationInterval) {
      clearInterval(this.navigationInterval);
      this.navigationInterval = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.reconnectionInterval) {
      clearInterval(this.reconnectionInterval);
      this.reconnectionInterval = null;
    }
    
    console.log('Contact extraction stopped');
  }
  
  startInfiniteScroll() {
    if (this.scrollInterval) return;
    
    this.isScrolling = true;
    document.getElementById('extractor-scroll').textContent = 'Yes';
    
    this.scrollInterval = setInterval(() => {
      if (!this.isActive) return;
      
      this.performHumanLikeScroll();
    }, this.getRandomScrollInterval()); // Random intervals between scrolls
  }
  
  performHumanLikeScroll() {
    const currentPosition = window.pageYOffset;
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    
    // Random scroll amount (like a human would do)
    const scrollAmount = this.getRandomScrollAmount();
    
    // Sometimes pause before scrolling (simulate reading)
    const pauseTime = this.getRandomPauseTime();
    
    setTimeout(() => {
      // Check if we're near the bottom
      if (currentPosition + windowHeight >= documentHeight - 1000) {
        // Scroll down but with variation
        window.scrollBy({
          top: scrollAmount,
          behavior: 'smooth' // Smooth scrolling like humans
        });
        
        // Wait longer for new content to load (simulate human reading time)
        this.scrollTimeout = setTimeout(() => {
          this.checkForNewContent();
        }, this.getRandomLoadWaitTime());
      } else {
        // Continue scrolling with human-like behavior
        window.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        });
        
        // Occasionally scroll back up slightly (like humans do)
        if (Math.random() < 0.1) { // 10% chance
          setTimeout(() => {
            window.scrollBy({
              top: -Math.floor(scrollAmount * 0.3),
              behavior: 'smooth'
            });
          }, 500);
        }
        
        // Sometimes pause for longer (simulate reading interesting content)
        if (Math.random() < 0.15) { // 15% chance
          const extraPause = Math.floor(Math.random() * 5000) + 2000; // 2-7 seconds
          this.scrollTimeout = setTimeout(() => {
            // Resume normal scrolling
          }, extraPause);
        }
      }
      
      this.lastScrollPosition = currentPosition;
      
      // Update interval for next scroll
      clearInterval(this.scrollInterval);
      this.scrollInterval = setInterval(() => {
        if (this.isActive) this.performHumanLikeScroll();
      }, this.getRandomScrollInterval());
      
    }, pauseTime);
  }
  
  startSubtleMouseMovements() {
    // Occasionally simulate very subtle mouse movements
    setInterval(() => {
      if (!this.isActive) return;
      
      // Only do this occasionally and subtly
      if (Math.random() < 0.05) { // 5% chance every interval
        const event = new MouseEvent('mousemove', {
          clientX: Math.random() * window.innerWidth,
          clientY: Math.random() * window.innerHeight,
          bubbles: true
        });
        
        // Don't actually move the cursor, just trigger the event for tracking
        // This helps maintain the appearance of user activity
        this.humanBehavior.mouseMovements++;
        this.humanBehavior.lastActivity = Date.now();
      }
    }, 30000); // Check every 30 seconds
  }  getRandomScrollInterval() {
    // Random interval between 3-12 seconds (more human reading speed)
    // Longer intervals during business hours to seem more natural
    const hour = new Date().getHours();
    const isBusinessHour = hour >= 9 && hour <= 17;
    
    const baseMin = isBusinessHour ? 4000 : 2000; // Slower during work hours
    const baseMax = isBusinessHour ? 15000 : 8000;
    
    return Math.floor(Math.random() * (baseMax - baseMin)) + baseMin;
  }
  
  getRandomScrollAmount() {
    // Vary scroll amount based on time of day and content
    const baseAmount = Math.floor(Math.random() * 400) + 200; // 200-600 pixels
    
    // Sometimes do very small scrolls (like checking something)
    if (Math.random() < 0.2) { // 20% chance
      return Math.floor(Math.random() * 100) + 50; // 50-150 pixels
    }
    
    return baseAmount;
  }
  
  getRandomPauseTime() {
    // Longer pauses occasionally (simulate reading interesting content)
    if (Math.random() < 0.1) { // 10% chance
      return Math.floor(Math.random() * 5000) + 3000; // 3-8 seconds
    }
    
    // Normal pause (0-2 seconds)
    return Math.floor(Math.random() * 2000);
  }
  
  getRandomLoadWaitTime() {
    // Random wait time for content loading (4-10 seconds)
    // Longer waits during peak hours
    const hour = new Date().getHours();
    const isPeakHour = (hour >= 19 && hour <= 23) || (hour >= 12 && hour <= 14);
    
    const baseMin = isPeakHour ? 5000 : 3000;
    const baseMax = isPeakHour ? 12000 : 8000;
    
    return Math.floor(Math.random() * (baseMax - baseMin)) + baseMin;
  }
  
  checkForNewContent() {
    // Look for loading indicators or new posts
    const loadingIndicators = document.querySelectorAll('[aria-label*="Loading"]');
    if (loadingIndicators.length === 0) {
      // No loading, continue scrolling
      return;
    }
    
    // Wait a bit more for content to load
    setTimeout(() => {
      this.extractFromNewContent();
    }, 1000);
  }
  
  startExtraction() {
    if (this.extractInterval) return;
    
    // Start with a random delay to seem more natural
    setTimeout(() => {
      this.extractContacts();
    }, this.getRandomExtractionDelay());
    
    // Then extract at random intervals (like human reading patterns)
    this.extractInterval = setInterval(() => {
      if (this.isActive) {
        // Add random delay before extraction
        setTimeout(() => {
          this.extractContacts();
          
          // Also check for expanded content every few cycles
          if (Math.random() < 0.3) { // 30% chance
            setTimeout(() => {
              this.extractFromExpandedPosts();
            }, 3000);
          }
        }, this.getRandomExtractionDelay());
      }
    }, this.getRandomExtractionInterval());
  }
  
  getRandomExtractionDelay() {
    // Random delay between 1-3 seconds before extraction
    return Math.floor(Math.random() * 2000) + 1000;
  }
  
  getRandomExtractionInterval() {
    // Random interval between 8-15 seconds for extraction cycles
    // Longer intervals to allow for "See More" expansions
    return Math.floor(Math.random() * 7000) + 8000;
  }
  
  // Special extraction for posts that have been expanded
  extractFromExpandedPosts() {
    console.log('[FB Extractor] Re-scanning posts for newly expanded content...');
    
    // Look for posts that have expanded content indicators
    const potentialPosts = [];
    
    // Method 1: Find posts with aria-expanded="true" elements
    const expandedElements = document.querySelectorAll('[aria-expanded="true"]');
    expandedElements.forEach(element => {
      // Find the parent post container
      let post = element.closest('[role="article"], [data-testid*="story"], [data-testid*="post"]');
      if (post && !potentialPosts.includes(post)) {
        potentialPosts.push(post);
      }
    });
    
    // Method 2: Find posts without "See more" buttons (likely already expanded)
    const allPosts = document.querySelectorAll('div[role="article"], [data-testid*="story"], [data-testid*="post"]');
    allPosts.forEach(post => {
      // Check if post has "See more" button
      const seeMoreButtons = post.querySelectorAll('div[role="button"], span[role="button"]');
      let hasSeeMore = false;
      
      seeMoreButtons.forEach(button => {
        const text = button.textContent.toLowerCase();
        if (text.includes('see more') || text.includes('show more')) {
          hasSeeMore = true;
        }
      });
      
      // If no "See more" button found and post has substantial content, likely expanded
      if (!hasSeeMore && post.textContent.length > 200 && !potentialPosts.includes(post)) {
        potentialPosts.push(post);
      }
    });
    
    const expandedPosts = potentialPosts;
    const newContacts = [];
    
    expandedPosts.forEach((post, index) => {
      const text = this.getPostText(post);
      
      // Look for phone numbers in the expanded content
      const numbers = this.extractPhoneNumbers(text);
      
      numbers.forEach(number => {
        const cleanNumber = this.cleanPhoneNumber(number);
        
        if (cleanNumber && !this.extractedNumbers.has(cleanNumber)) {
          this.extractedNumbers.add(cleanNumber);
          newContacts.push({
            number: cleanNumber,
            originalText: number,
            context: text.substring(0, 150) + '...',
            timestamp: new Date().toISOString(),
            url: window.location.href,
            source: 'expanded_post'
          });
          console.log(`[FB Extractor] Found number in expanded post: ${cleanNumber}`);
        }
      });
    });
    
    if (newContacts.length > 0) {
      this.safeSaveContacts(newContacts);
      console.log(`[FB Extractor] Saved ${newContacts.length} contacts from expanded posts`);
    }
    
    this.updateContactCount();
  }
  
  extractContacts() {
    const posts = this.getPosts();
    const newContacts = [];
    
    console.log(`[FB Extractor] Checking ${posts.length} posts for phone numbers`);
    
    // First, expand any "See More" links
    this.expandSeeMoreLinks(posts);
    
    // Wait a bit for expansions to complete, then extract
    setTimeout(() => {
      posts.forEach((post, index) => {
        const text = this.getPostText(post);
        if (text.length > 10) { // Only process posts with substantial text
          console.log(`[FB Extractor] Post ${index + 1} text (first 100 chars):`, text.substring(0, 100));
          
          const numbers = this.extractPhoneNumbers(text);
          console.log(`[FB Extractor] Found raw numbers in post ${index + 1}:`, numbers);
          
          numbers.forEach(number => {
            const cleanNumber = this.cleanPhoneNumber(number);
            console.log(`[FB Extractor] Raw: "${number}" -> Clean: "${cleanNumber}"`);
            
            if (cleanNumber && !this.extractedNumbers.has(cleanNumber)) {
              this.extractedNumbers.add(cleanNumber);
              newContacts.push({
                number: cleanNumber,
                originalText: number,
                context: text.substring(0, 100) + '...',
                timestamp: new Date().toISOString(),
                url: window.location.href
              });
              console.log(`[FB Extractor] Added new contact: ${cleanNumber}`);
            }
          });
        }
      });
      
      if (newContacts.length > 0) {
        this.safeSaveContacts(newContacts);
        console.log(`[FB Extractor] Saved ${newContacts.length} new contacts`);
      } else {
        console.log('[FB Extractor] No new contacts found in this extraction cycle');
      }
      
      this.updateContactCount();
    }, 2000); // Wait 2 seconds for "See More" clicks to expand content
  }
  
  expandSeeMoreLinks(posts) {
    console.log('[FB Extractor] Looking for "See More" links to expand...');
    
    let expandedCount = 0;
    document.getElementById('extractor-expanding').textContent = 'Yes';
    document.getElementById('extractor-expanding').style.color = 'blue';
    
    posts.forEach((post, index) => {
      // Look for various "See More" button patterns
      const seeMoreButtons = this.findSeeMoreButtons(post);
      const unclickedButtons = seeMoreButtons.filter(btn => 
        !btn.classList.contains('fb-extractor-clicked')
      );
      
      unclickedButtons.forEach((button, btnIndex) => {
        console.log(`[FB Extractor] Found unclicked "See More" button ${btnIndex + 1} in post ${index + 1}:`, button.textContent.trim());
        
        // FINAL SAFETY CHECK - Ensure we're not about to click anything that could navigate away
        const isSafeToClick = (
          button.tagName === 'DIV' &&                                    // Must be a div
          /^(See more|مزید دیکھیں)$/i.test(button.textContent.trim()) &&  // Must be exact text
          !button.closest('a') &&                                        // Not inside a link
          !button.closest('[role="link"]') &&                           // Not inside link role
          !button.closest('nav') &&                                     // Not inside navigation
          !button.closest('header') &&                                  // Not inside header
          !button.closest('[data-testid*="nav"]') &&                    // Not in nav element
          !button.closest('[data-testid*="menu"]') &&                   // Not in menu
          !button.getAttribute('onclick') &&                            // No onclick handler
          !button.querySelector('a') &&                                 // Doesn't contain links
          window.location.href.includes('facebook.com/groups')          // We're still in a group
        );
        
        if (isSafeToClick) {
          expandedCount++;
          console.log(`[FB Extractor] ✅ SAFE TO CLICK: Approved "See More" div`);
          
          // Add human-like delay before clicking
          setTimeout(() => {
            this.humanLikeClick(button);
          }, (expandedCount * 300) + Math.random() * 1000 + 200); // Stagger clicks
        } else {
          console.log(`[FB Extractor] ❌ UNSAFE TO CLICK: Rejecting button to prevent navigation`);
          console.log(`[FB Extractor] ❌ Button details:`, {
            tagName: button.tagName,
            text: button.textContent.trim(),
            hasOnclick: !!button.getAttribute('onclick'),
            insideLink: !!button.closest('a'),
            containsLink: !!button.querySelector('a'),
            currentUrl: window.location.href
          });
        }
      });
    });
    
    // Update UI after processing
    setTimeout(() => {
      document.getElementById('extractor-expanding').textContent = `${expandedCount} expanded`;
      document.getElementById('extractor-expanding').style.color = 'green';
      
      // Reset after a while
      setTimeout(() => {
        document.getElementById('extractor-expanding').textContent = 'No';
        document.getElementById('extractor-expanding').style.color = 'black';
      }, 5000);
    }, 3000);
  }
  
  findSeeMoreButtons(post) {
    const buttons = [];
    
    console.log('[FB Extractor] 🎯 STRICT MODE: Only looking for exact "See more" divs');
    
    // ONLY METHOD: Find divs containing EXACTLY "See more" text - NO OTHER ELEMENTS
    const allDivs = post.querySelectorAll('div');
    allDivs.forEach(div => {
      const text = div.textContent.trim();
      
      // Check if div contains ONLY "See more" text (case insensitive)
      const exactSeeMorePatterns = [
        /^See more$/i,           // Exact "See more"
        /^مزید دیکھیں$/,          // Exact Urdu "See more"
        /^See\s+more$/i,         // "See more" with space
        /^مزید\s+دیکھیں$/        // Urdu with space
      ];
      
      const isExactSeeMore = exactSeeMorePatterns.some(pattern => pattern.test(text));
      
      if (isExactSeeMore) {
        console.log('[FB Extractor] 🔍 Found EXACT "See more" div:', text);
        
        // ULTRA STRICT SAFETY CHECKS - Reject ANY potential navigation elements
        const isNavigationElement = (
          // Link elements - ABSOLUTE NO
          div.tagName === 'A' ||
          div.closest('a') ||
          div.href ||
          div.getAttribute('href') ||
          div.querySelector('a') ||
          
          // URL indicators - ABSOLUTE NO
          text.includes('http') ||
          text.includes('www.') ||
          text.includes('.com') ||
          text.includes('.org') ||
          text.includes('.net') ||
          text.includes('://') ||
          
          // Data attributes that might navigate - ABSOLUTE NO
          div.getAttribute('data-href') ||
          div.getAttribute('data-url') ||
          div.getAttribute('data-link') ||
          div.getAttribute('data-navigate') ||
          div.getAttribute('data-destination') ||
          
          // Profile/page indicators - ABSOLUTE NO
          div.getAttribute('data-testid')?.includes('profile') ||
          div.getAttribute('data-testid')?.includes('page') ||
          div.getAttribute('data-testid')?.includes('user') ||
          div.getAttribute('data-testid')?.includes('group') ||
          div.getAttribute('data-testid')?.includes('marketplace') ||
          
          // Video/media indicators - ABSOLUTE NO
          div.getAttribute('data-testid')?.includes('video') ||
          div.getAttribute('data-testid')?.includes('reel') ||
          div.getAttribute('data-testid')?.includes('media') ||
          div.getAttribute('data-testid')?.includes('watch') ||
          div.getAttribute('data-testid')?.includes('play') ||
          
          // Navigation role indicators - ABSOLUTE NO
          div.getAttribute('role') === 'link' ||
          div.getAttribute('role') === 'navigation' ||
          div.getAttribute('role') === 'menuitem' ||
          div.getAttribute('role') === 'tab' ||
          
          // Parent element safety checks - ABSOLUTE NO
          div.closest('[role="link"]') ||
          div.closest('[href]') ||
          div.closest('[data-testid*="nav"]') ||
          div.closest('[data-testid*="menu"]') ||
          div.closest('[data-testid*="header"]') ||
          div.closest('nav') ||
          div.closest('header') ||
          
          // Child element check for navigation - ABSOLUTE NO
          div.querySelector('[role="link"]') ||
          div.querySelector('[href]') ||
          div.querySelector('a') ||
          div.querySelector('button[data-testid*="nav"]') ||
          
          // Button role that might navigate - ABSOLUTE NO 
          (div.getAttribute('role') === 'button' && (
            div.getAttribute('data-testid')?.includes('nav') ||
            div.getAttribute('data-testid')?.includes('close') ||
            div.getAttribute('data-testid')?.includes('back') ||
            div.getAttribute('data-testid')?.includes('exit') ||
            div.getAttribute('data-testid')?.includes('leave')
          )) ||
          
          // Class names that indicate navigation - ABSOLUTE NO
          div.className.toLowerCase().includes('link') ||
          div.className.toLowerCase().includes('nav') ||
          div.className.toLowerCase().includes('url') ||
          div.className.toLowerCase().includes('redirect') ||
          div.className.toLowerCase().includes('external') ||
          div.className.toLowerCase().includes('menu') ||
          div.className.toLowerCase().includes('header') ||
          
          // Text content safety - ABSOLUTE NO if contains navigation words
          (text.toLowerCase() !== 'see more' && 
           text.toLowerCase() !== 'مزید دیکھیں' && (
            text.toLowerCase().includes('leave') ||
            text.toLowerCase().includes('exit') ||
            text.toLowerCase().includes('close') ||
            text.toLowerCase().includes('back') ||
            text.toLowerCase().includes('home') ||
            text.toLowerCase().includes('profile') ||
            text.toLowerCase().includes('groups') ||
            text.toLowerCase().includes('marketplace')
          ))
        );
        
        if (!isNavigationElement && 
            div.offsetParent !== null && // Must be visible
            !div.classList.contains('fb-extractor-clicked')) { // Not already clicked
          
          buttons.push(div);
          console.log('[FB Extractor] ✅ APPROVED: EXACT "See more" div added as target');
        } else {
          console.log('[FB Extractor] ❌ REJECTED: "See more" div failed safety checks');
          if (isNavigationElement) {
            console.log('[FB Extractor] ❌ Reason: Detected as navigation element');
          }
          if (div.offsetParent === null) {
            console.log('[FB Extractor] ❌ Reason: Element not visible');
          }
          if (div.classList.contains('fb-extractor-clicked')) {
            console.log('[FB Extractor] ❌ Reason: Already clicked');
          }
        }
      }
    });
    
    console.log(`[FB Extractor] 🎯 STRICT RESULT: Found ${buttons.length} approved "See more" div(s)`);
    
    // IMPORTANT: Return ONLY the exact "See more" divs - NO fallback methods
    return buttons;
  }

  // Debug function to test See More detection
  testSeeMoreDetection() {
    console.log('[FB Extractor] === ULTRA STRICT "See More" Detection Test ===');
    console.log('[FB Extractor] 🚨 ONLY exact "See more" divs will be clicked - NO OTHER ELEMENTS');
    
    const posts = this.getPosts();
    console.log(`[FB Extractor] Found ${posts.length} posts to analyze`);
    
    posts.forEach((post, index) => {
      console.log(`[FB Extractor] --- Analyzing Post ${index + 1} ---`);
      
      // ONLY TEST: Look for EXACT "See more" divs
      const allDivs = post.querySelectorAll('div');
      let exactSeeMoreFound = 0;
      let approvedTargets = 0;
      
      allDivs.forEach(div => {
        const text = div.textContent.trim();
        const exactSeeMorePatterns = [
          /^See more$/i,           // Exact "See more"
          /^مزید دیکھیں$/,          // Exact Urdu "See more"
          /^See\s+more$/i,         // "See more" with space
          /^مزید\s+دیکھیں$/        // Urdu with space
        ];
        
        const isExactSeeMore = exactSeeMorePatterns.some(pattern => pattern.test(text));
        if (isExactSeeMore) {
          exactSeeMoreFound++;
          console.log(`[FB Extractor] 🎯 EXACT "See more" div found: "${text}"`);
          console.log(`[FB Extractor] Tag: ${div.tagName}, Visible: ${div.offsetParent !== null}`);
          
          // Apply strict safety checks
          const isNavigationElement = (
            div.tagName === 'A' ||
            div.closest('a') ||
            div.href ||
            div.getAttribute('href') ||
            div.querySelector('a') ||
            text.includes('http') ||
            text.includes('www.') ||
            text.includes('.com') ||
            div.getAttribute('data-href') ||
            div.getAttribute('data-url') ||
            div.getAttribute('data-link') ||
            div.getAttribute('data-testid')?.includes('profile') ||
            div.getAttribute('data-testid')?.includes('video') ||
            div.getAttribute('role') === 'link'
          );
          
          if (!isNavigationElement && div.offsetParent !== null && !div.classList.contains('fb-extractor-clicked')) {
            approvedTargets++;
            console.log(`[FB Extractor] ✅ APPROVED: This div will be clicked`);
          } else {
            console.log(`[FB Extractor] ❌ REJECTED: Failed safety checks`);
            if (isNavigationElement) console.log(`[FB Extractor] ❌ Reason: Navigation element`);
            if (div.offsetParent === null) console.log(`[FB Extractor] ❌ Reason: Not visible`);
            if (div.classList.contains('fb-extractor-clicked')) console.log(`[FB Extractor] ❌ Reason: Already clicked`);
          }
        }
      });
      
      console.log(`[FB Extractor] 📊 Found ${exactSeeMoreFound} EXACT "See more" div(s)`);
      console.log(`[FB Extractor] ✅ Approved ${approvedTargets} div(s) for clicking`);
      
      const buttons = this.findSeeMoreButtons(post);
      console.log(`[FB Extractor] 🎯 Final result: ${buttons.length} target(s) will be clicked`);
    });
    
    console.log('[FB Extractor] === ULTRA STRICT TEST COMPLETE ===');
    console.log('[FB Extractor] 🚨 Remember: Only exact "See more" divs will be clicked!');
  }

  humanLikeClick(element) {
    try {
      // Check if this element might navigate away from the group
      if (this.shouldAvoidClick(element)) {
        console.log('[FB Extractor] ❌ REJECTED: Element failed ultra strict checks');
        return;
      }
      
      // Mark as clicked to avoid re-clicking
      element.classList.add('fb-extractor-clicked');
      
      // Simulate human-like click with proper events
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      // Scroll element into view first (like humans do)
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(() => {
        // Create mouse events
        const mouseOver = new MouseEvent('mouseover', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y
        });
        
        const mouseDown = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y
        });
        
        const mouseUp = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y
        });
        
        const click = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y
        });
        
        // Simulate natural mouse interaction sequence
        element.dispatchEvent(mouseOver);
        setTimeout(() => {
          element.dispatchEvent(mouseDown);
          setTimeout(() => {
            element.dispatchEvent(mouseUp);
            setTimeout(() => {
              element.dispatchEvent(click);
              
              // Also try direct click if available
              if (typeof element.click === 'function') {
                element.click();
              }
              
              console.log('[FB Extractor] Clicked "See More" button successfully');
              
              // Update human behavior tracking
              this.humanBehavior.clickEvents++;
              this.humanBehavior.lastActivity = Date.now();
              
              // Wait and check if content expanded
              setTimeout(() => {
                this.checkExpansionSuccess(element);
              }, 1500);
              
            }, 50);
          }, 100);
        }, 50);
        
      }, 300); // Wait for scroll to complete
      
    } catch (error) {
      console.log('[FB Extractor] Error clicking See More button:', error);
    }
  }
  
  shouldAvoidClick(element) {
    // ULTRA STRICT MODE: ONLY allow exact "See more" divs - REJECT EVERYTHING ELSE
    const text = element.textContent.trim();
    const exactSeeMorePatterns = [
      /^See more$/i,           // Exact "See more"
      /^مزید دیکھیں$/,          // Exact Urdu "See more"
      /^See\s+more$/i,         // "See more" with space
      /^مزید\s+دیکھیں$/        // Urdu with space
    ];
    
    const isExactSeeMore = exactSeeMorePatterns.some(pattern => pattern.test(text));
    
    // ONLY allow if it's EXACTLY "See more" AND it's a DIV AND has no navigation indicators
    if (isExactSeeMore && element.tagName === 'DIV') {
      // Additional ultra-strict safety check even for "See more" divs
      const hasNavigationIndicators = (
        element.closest('a') ||                           // Inside a link
        element.closest('[role="link"]') ||              // Inside link role
        element.closest('nav') ||                        // Inside navigation
        element.closest('header') ||                     // Inside header
        element.closest('[data-testid*="nav"]') ||       // Inside nav element
        element.closest('[data-testid*="menu"]') ||      // Inside menu
        element.closest('[data-testid*="close"]') ||     // Inside close button
        element.closest('[data-testid*="back"]') ||      // Inside back button
        element.getAttribute('onclick') ||               // Has onclick handler
        element.getAttribute('data-href') ||             // Has data-href
        element.getAttribute('data-url') ||              // Has data-url
        element.querySelector('a') ||                    // Contains link
        element.querySelector('[role="link"]') ||        // Contains link role
        // Check if parent has navigation text
        (element.parentElement && (
          element.parentElement.textContent.toLowerCase().includes('leave group') ||
          element.parentElement.textContent.toLowerCase().includes('exit group') ||
          element.parentElement.textContent.toLowerCase().includes('close') ||
          element.parentElement.textContent.toLowerCase().includes('back to')
        ))
      );
      
      if (!hasNavigationIndicators) {
        console.log('[FB Extractor] ✅ APPROVED: Safe "See more" div with no navigation indicators');
        return false; // Allow the click ONLY for safe exact "See more" divs
      } else {
        console.log('[FB Extractor] ❌ REJECTED: "See more" div has navigation indicators - unsafe');
        return true;
      }
    }
    
    // REJECT EVERYTHING ELSE - Absolute no exceptions
    console.log('[FB Extractor] ❌ REJECTED: Not a safe exact "See more" div');
    console.log('[FB Extractor] ❌ Element type:', element.tagName);
    console.log('[FB Extractor] ❌ Element text:', text.substring(0, 50));
    
    return true; // Reject all other elements - MAXIMUM SAFETY
  }
  
  isVideoOrReel(element) {
    // Check for video/reel related attributes and content
    const videoIndicators = [
      '[data-testid*="video"]',
      '[data-testid*="reel"]', 
      '[aria-label*="video" i]',
      '[aria-label*="reel" i]',
      'video',
      '[role="button"] svg[aria-label*="play" i]',
      '.video-player',
      '[data-pagelet*="video"]'
    ];
    
    return videoIndicators.some(selector => {
      try {
        return element.matches && element.matches(selector);
      } catch (e) {
        return false;
      }
    }) || element.textContent.toLowerCase().includes('watch') ||
       element.textContent.toLowerCase().includes('play');
  }
  
  isExternalLink(element) {
    // Check for external links that might navigate away
    if (element.tagName === 'A') {
      const href = element.getAttribute('href');
      if (href && (href.startsWith('http') || href.includes('facebook.com/') === false)) {
        return true;
      }
    }
    
    // Check for share buttons or external navigation
    const externalIndicators = [
      '[aria-label*="share" i]',
      '[aria-label*="link" i]',
      '[data-testid*="share"]',
      '[href*="facebook.com/sharer"]'
    ];
    
    return externalIndicators.some(selector => {
      try {
        return element.matches && element.matches(selector);
      } catch (e) {
        return false;
      }
    });
  }
  
  isProfileLink(element) {
    // Check for profile navigation links
    const profileIndicators = [
      'a[href*="/profile.php"]',
      'a[href*="/people/"]',
      '[aria-label*="profile" i]',
      '[data-testid*="profile"]'
    ];
    
    return profileIndicators.some(selector => {
      try {
        return element.matches && element.matches(selector);
      } catch (e) {
        return false;
      }
    });
  }
  
  checkExpansionSuccess(clickedElement) {
    // Check if the post content has expanded
    const post = clickedElement.closest('[role="article"], [data-testid*="story"], [data-pagelet*="FeedUnit"]');
    if (post) {
      const currentText = this.getPostText(post);
      
      // If text is significantly longer now, expansion was successful
      if (currentText.length > 200) {
        console.log('[FB Extractor] Post expansion successful, new content length:', currentText.length);
        
        // Wait longer for content to fully load and then extract
        setTimeout(() => {
          console.log('[FB Extractor] Starting extraction from expanded post after delay...');
          this.extractFromSinglePost(post);
        }, 2000); // Increased wait time for full content loading
      } else {
        console.log('[FB Extractor] Post expansion may have failed or no additional content');
        
        // Try again with a longer wait - sometimes content loads slowly
        setTimeout(() => {
          const retryText = this.getPostText(post);
          if (retryText.length > currentText.length) {
            console.log('[FB Extractor] Delayed content detected, extracting...');
            this.extractFromSinglePost(post);
          }
        }, 3000); // Retry after 3 seconds
      }
    }
  }
  
  extractFromSinglePost(post) {
    const text = this.getPostText(post);
    const numbers = this.extractPhoneNumbers(text);
    const newContacts = [];
    
    numbers.forEach(number => {
      const cleanNumber = this.cleanPhoneNumber(number);
      
      if (cleanNumber && !this.extractedNumbers.has(cleanNumber)) {
        this.extractedNumbers.add(cleanNumber);
        newContacts.push({
          number: cleanNumber,
          originalText: number,
          context: text.substring(0, 200) + '...',
          timestamp: new Date().toISOString(),
          url: window.location.href,
          source: 'expanded_single_post'
        });
        console.log(`[FB Extractor] Found number in newly expanded post: ${cleanNumber}`);
      }
    });
    
    if (newContacts.length > 0) {
      this.safeSaveContacts(newContacts);
      this.updateContactCount();
      console.log(`[FB Extractor] Saved ${newContacts.length} contacts from newly expanded post`);
    }
  }
  
  extractFromNewContent() {
    // Extract from recently loaded content
    this.extractContacts();
  }
  
  getPosts() {
    // Facebook post selectors (updated for current Facebook layout)
    const selectors = [
      '[data-pagelet*="FeedUnit"]',
      '[role="article"]',
      '[data-testid="fbfeed_story"]',
      '.userContentWrapper',
      '[data-ft]',
      'div[data-pagelet*="GroupFeed"]',
      'div[aria-posinset]',
      'div[data-testid*="story"]'
    ];
    
    let posts = [];
    
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          // Only add if it contains substantial content
          if (element.textContent && element.textContent.length > 20) {
            posts.push(element);
          }
        });
      } catch (error) {
        console.log(`[FB Extractor] Invalid selector skipped: ${selector}`, error.message);
      }
    });
    
    // Remove duplicates by checking if posts are nested within each other
    const uniquePosts = [];
    posts.forEach(post => {
      const isNested = posts.some(otherPost => 
        otherPost !== post && otherPost.contains(post)
      );
      if (!isNested) {
        uniquePosts.push(post);
      }
    });
    
    console.log(`[FB Extractor] Found ${uniquePosts.length} unique posts`);
    return uniquePosts;
  }
  
  getPostText(post) {
    // Extract text content from post using multiple selectors
    const textSelectors = [
      '[data-testid="post_message"]',
      '.userContent',
      '[dir="auto"]',
      'div[data-ad-preview="message"]',
      'span[lang]',
      'div[role="button"] span',
      'div[data-testid*="text"]',
      // Additional selectors for expanded content
      '[data-testid*="story-subtitle"]',
      '[data-testid*="story-text"]',
      'div[data-testid*="expandable"]',
      // Selectors for post descriptions and comments
      'div[data-pagelet*="story"] div[dir="auto"]',
      'div[role="article"] div[dir="auto"]'
    ];
    
    let text = '';
    const seenTexts = new Set(); // Prevent duplicates
    
    textSelectors.forEach(selector => {
      const elements = post.querySelectorAll(selector);
      elements.forEach(element => {
        const elementText = element.textContent.trim();
        // Only add if it's substantial, new, and doesn't contain just navigation text
        if (elementText && 
            elementText.length > 10 && 
            !seenTexts.has(elementText) &&
            !this.isNavigationText(elementText)) {
          text += elementText + ' ';
          seenTexts.add(elementText);
        }
      });
    });
    
    // Fallback: get all text from the post, but clean it
    if (text.length < 20) {
      const allText = post.textContent || '';
      const cleanedText = this.cleanPostText(allText);
      if (cleanedText.length > text.length) {
        text = cleanedText;
      }
    }
    
    // Final cleanup
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }
  
  isNavigationText(text) {
    // Filter out Facebook navigation and UI text that's not part of post content
    const navigationKeywords = [
      'like', 'comment', 'share', 'react', 'love', 'haha', 'wow', 'sad', 'angry',
      'see more', 'see less', 'hide', 'report', 'save', 'copy link',
      'follow', 'unfollow', 'notification', 'settings', 'privacy',
      'facebook', 'meta', 'instagram', 'whatsapp', 'messenger',
      'photos', 'videos', 'events', 'groups', 'pages', 'marketplace',
      'minutes ago', 'hours ago', 'yesterday', 'last week',
      'sponsored', 'suggested', 'recommended'
    ];
    
    const lowerText = text.toLowerCase();
    return navigationKeywords.some(keyword => 
      lowerText === keyword || 
      (lowerText.length < 50 && lowerText.includes(keyword))
    );
  }
  
  cleanPostText(text) {
    // Remove common Facebook UI elements and clean the text
    return text
      .replace(/Facebook\s+[\w\d\s]+\.com/g, '') // Remove Facebook tracking URLs
      .replace(/\.\.\.\s*See more/gi, '') // Remove "See more" fragments
      .replace(/Hide translation/gi, '') // Remove translation UI
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  extractPhoneNumbers(text) {
    const numbers = [];
    
    this.phonePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        numbers.push(...matches);
      }
    });
    
    return numbers;
  }
  
  cleanPhoneNumber(number) {
    // Extract phone number as-is without format changes
    // Only remove non-digit characters except + and preserve original format
    let cleaned = number.replace(/[^\d+]/g, '');
    
    // Enhanced validation to filter out non-phone numbers
    
    // Must be reasonable phone number length (minimum 8 digits for international)
    if (cleaned.length < 8 || cleaned.length > 15) {
      return null;
    }
    
    // Remove leading zeros for analysis (but preserve in final result)
    const digitsOnly = cleaned.replace(/^\+/, '').replace(/^0+/, '');
    
    // Reject obvious non-phone number patterns
    
    // 1. Reject numbers that are too short even without leading zeros
    if (digitsOnly.length < 7) {
      return null;
    }
    
    // 2. Reject numbers with repeating patterns (like 1111111, 123123123)
    if (this.isRepeatingPattern(digitsOnly)) {
      return null;
    }
    
    // 3. Reject sequential numbers (like 1234567, 9876543)
    if (this.isSequentialPattern(digitsOnly)) {
      return null;
    }
    
    // 4. Reject numbers that look like prices or quantities (all same digit, too uniform)
    if (this.looksLikePrice(digitsOnly)) {
      return null;
    }
    
    // 5. Reject numbers that don't follow basic international phone number structure
    if (!this.hasValidPhoneStructure(digitsOnly)) {
      return null;
    }
    
    // If it already starts with +, keep it as-is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // For numbers without +, keep them exactly as found
    // Don't add country codes or modify format
    return cleaned;
  }
  
  isRepeatingPattern(number) {
    // Check for repeating patterns like 1111111, 123123123
    if (number.length < 6) return false;
    
    // Check for all same digits
    if (new Set(number).size === 1) {
      return true;
    }
    
    // Check for repeating short sequences
    for (let patternLength = 2; patternLength <= 4; patternLength++) {
      const pattern = number.substring(0, patternLength);
      let isRepeating = true;
      
      for (let i = 0; i < number.length; i += patternLength) {
        const segment = number.substring(i, i + patternLength);
        if (segment !== pattern && segment !== pattern.substring(0, segment.length)) {
          isRepeating = false;
          break;
        }
      }
      
      if (isRepeating && number.length >= patternLength * 3) {
        return true;
      }
    }
    
    return false;
  }
  
  isSequentialPattern(number) {
    // Check for sequential patterns like 1234567, 9876543
    if (number.length < 6) return false;
    
    let ascending = 0;
    let descending = 0;
    
    for (let i = 1; i < number.length; i++) {
      const curr = parseInt(number[i]);
      const prev = parseInt(number[i-1]);
      
      if (curr === prev + 1) ascending++;
      if (curr === prev - 1) descending++;
    }
    
    // If more than 60% of digits are in sequence, likely not a phone number
    const threshold = Math.floor(number.length * 0.6);
    return ascending >= threshold || descending >= threshold;
  }
  
  looksLikePrice(number) {
    // Check if number looks like a price or quantity
    
    // Very short numbers (like 5988914 -> 7 digits) that don't match phone patterns
    if (number.length === 7 && !number.startsWith('0') && !number.startsWith('1')) {
      // Check if it could be a Pakistani local number (should start with 3, 4, or 5 for mobile)
      const firstDigit = parseInt(number[0]);
      if (firstDigit < 3 || firstDigit > 5) {
        return true; // Likely not a Pakistani mobile number
      }
    }
    
    // Numbers starting with very low digits (like 0909858) that are too short
    if (number.length < 10 && number.startsWith('0') && number.length < 11) {
      // Could be local format, but verify it's not just a random number
      const withoutZero = number.substring(1);
      if (withoutZero.length < 8) {
        return true; // Too short to be a complete phone number
      }
    }
    
    // Check for uniform digit distribution (common in non-phone numbers)
    const digitCounts = {};
    for (let digit of number) {
      digitCounts[digit] = (digitCounts[digit] || 0) + 1;
    }
    
    // If one digit appears more than 60% of the time, suspicious
    const maxCount = Math.max(...Object.values(digitCounts));
    if (maxCount / number.length > 0.6) {
      return true;
    }
    
    return false;
  }
  
  hasValidPhoneStructure(number) {
    // Check if number follows basic phone number structure
    
    // International format checks
    if (number.length >= 10) {
      // Common country code patterns (enhanced with UAE, Malaysia, Saudi)
      const commonCountryCodes = [
        '1', '7', '20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45', '46', '47', '48', '49',
        '51', '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86',
        '90', '91', '92', '93', '94', '95', '98', '212', '213', '216', '218', '220', '221', '222', '223', '224', '225',
        '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241',
        '242', '243', '244', '245', '246', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258',
        '260', '261', '262', '263', '264', '265', '266', '267', '268', '269', '290', '291', '297', '298', '299', '350',
        '351', '352', '353', '354', '355', '356', '357', '358', '359', '370', '371', '372', '373', '374', '375', '376',
        '377', '378', '380', '381', '382', '383', '385', '386', '387', '389', '420', '421', '423', '500', '501', '502',
        '503', '504', '505', '506', '507', '508', '509', '590', '591', '592', '593', '594', '595', '596', '597', '598',
        '599', '670', '672', '673', '674', '675', '676', '677', '678', '679', '680', '681', '682', '683', '684', '685',
        '686', '687', '688', '689', '690', '691', '692', '850', '852', '853', '855', '856', '880', '886', '960', '961',
        '962', '963', '964', '965', '966', '967', '968', '970', '971', '972', '973', '974', '975', '976', '977', '992',
        '993', '994', '995', '996', '998'
      ];
      
      // Check if starts with a valid country code
      for (let code of commonCountryCodes) {
        if (number.startsWith(code)) {
          const remaining = number.substring(code.length);
          // After country code, should have at least 6 more digits
          if (remaining.length >= 6 && remaining.length <= 12) {
            return true;
          }
        }
      }
    }
    
    // Enhanced local format checks for specific countries
    if (number.length >= 8 && number.length <= 12) {
      
      // Pakistani mobile pattern (starts with 3, 4, or 5 after any leading zeros)
      const cleanNum = number.replace(/^0+/, '');
      if (cleanNum.length >= 9 && cleanNum.length <= 10) {
        const firstDigit = parseInt(cleanNum[0]);
        if (firstDigit >= 3 && firstDigit <= 5) {
          return true; // Valid Pakistani mobile pattern
        }
      }
      
      // UAE mobile patterns (050, 055, 056, 058 after removing leading zeros)
      if (number.startsWith('0') && number.length === 10) {
        const prefix = number.substring(0, 3);
        if (prefix === '050' || prefix === '055' || prefix === '056' || prefix === '058') {
          return true; // Valid UAE mobile pattern
        }
      }
      
      // Malaysian mobile patterns (01X where X is 0-9)
      if (number.startsWith('01') && number.length === 10) {
        const thirdDigit = parseInt(number[2]);
        if (thirdDigit >= 0 && thirdDigit <= 9) {
          return true; // Valid Malaysian mobile pattern
        }
      }
      
      // Saudi mobile patterns (05X where X is 0-9)
      if (number.startsWith('05') && number.length === 10) {
        const thirdDigit = parseInt(number[2]);
        if (thirdDigit >= 0 && thirdDigit <= 9) {
          return true; // Valid Saudi mobile pattern
        }
      }
      
      // Other common mobile/landline patterns
      if (number.length >= 9) {
        return true; // Likely valid for most countries
      }
    }
    
    // Additional checks for international formats without country code detection
    if (number.length >= 10 && number.length <= 15) {
      
      // UAE international format check (971 prefix)
      if (number.startsWith('971') && number.length >= 12 && number.length <= 13) {
        const mobilePrefix = number.substring(3, 5);
        if (mobilePrefix === '50' || mobilePrefix === '55' || mobilePrefix === '56' || mobilePrefix === '58') {
          return true; // Valid UAE international format
        }
      }
      
      // Malaysia international format check (60 prefix)
      if (number.startsWith('60') && number.length >= 11 && number.length <= 12) {
        const mobilePrefix = number.substring(2, 4);
        if (mobilePrefix.startsWith('1') && parseInt(mobilePrefix[1]) >= 0 && parseInt(mobilePrefix[1]) <= 9) {
          return true; // Valid Malaysian international format
        }
      }
      
      // Saudi international format check (966 prefix)
      if (number.startsWith('966') && number.length >= 12 && number.length <= 13) {
        const mobilePrefix = number.substring(3, 5);
        if (mobilePrefix.startsWith('5') && parseInt(mobilePrefix[1]) >= 0 && parseInt(mobilePrefix[1]) <= 9) {
          return true; // Valid Saudi international format
        }
      }
    }
    
    return false;
  }
  
  // Safe wrapper for chrome.runtime.sendMessage calls
  // Safe wrapper for chrome.runtime.sendMessage calls
  safeSendMessage(message, callback) {
    try {
      // Enhanced validation
      if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        throw new Error('Chrome runtime not available');
      }

      // Test extension context
      const extensionId = chrome.runtime.id;
      if (!extensionId) {
        throw new Error('Extension context invalidated');
      }

      // Send the message with enhanced error handling
      chrome.runtime.sendMessage(message, (response) => {
        // Check for runtime errors with comprehensive error detection
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message || chrome.runtime.lastError.toString();
          console.warn('[FB Extractor] Runtime error in safeSendMessage:', errorMsg);
          
          // Check for all known connection/context errors
          if (errorMsg.includes('Extension context invalidated') || 
              errorMsg.includes('message port closed') ||
              errorMsg.includes('receiving end does not exist') ||
              errorMsg.includes('Could not establish connection') ||
              errorMsg.includes('Extension context invalidated') ||
              errorMsg.includes('The message port closed before') ||
              errorMsg.includes('Extension has been reloaded')) {
            
            console.log('[FB Extractor] Connection error detected, switching to local storage backup');
            this.handleExtensionInvalidation();
            this.showExtensionReloadNotification();
            
            // Call callback with error indication
            if (callback) {
              callback({ error: 'connection_failed', fallback: true });
            }
            return;
          }
          
          // For other runtime errors, log and continue
          console.error('[FB Extractor] Other runtime error:', errorMsg);
          if (callback) {
            callback({ error: errorMsg });
          }
          return;
        }

        // Success - call the original callback
        if (callback) {
          callback(response);
        }
      });

    } catch (error) {
      console.warn('[FB Extractor] safeSendMessage failed:', error.message);
      
      // Handle all known extension context errors
      if (error.message.includes('Extension context invalidated') ||
          error.message.includes('Chrome runtime not available') ||
          error.message.includes('message port closed') ||
          error.message.includes('receiving end does not exist') ||
          error.message.includes('Could not establish connection')) {
        
        console.log('[FB Extractor] Extension context error, activating fallback mode');
        this.handleExtensionInvalidation();
        this.showExtensionReloadNotification();
      }
      
      // Call callback with error indication
      if (callback) {
        callback({ error: error.message, fallback: true });
      }
    }
  }

  // Wrapper method for safe contact saving with enhanced error handling
  safeSaveContacts(contacts) {
    try {
      this.saveContacts(contacts);
    } catch (error) {
      console.warn('[FB Extractor] safeSaveContacts caught error:', error.message);
      
      // Handle extension context invalidation
      if (error.message.includes('Extension context invalidated') ||
          error.message.includes('message port closed') ||
          error.message.includes('receiving end does not exist') ||
          error.message.includes('Could not establish connection') ||
          error.message.includes('chrome.runtime.sendMessage')) {
        
        console.log('[FB Extractor] Saving contacts to local storage due to extension context error');
        this.saveContactsToLocalStorage(contacts);
        this.handleExtensionInvalidation();
        this.showExtensionReloadNotification();
      } else {
        // For other errors, try local storage as fallback
        console.log('[FB Extractor] Unexpected error, falling back to local storage');
        this.saveContactsToLocalStorage(contacts);
      }
    }
  }

  saveContacts(contacts) {
    // Enhanced check for chrome.runtime availability
    if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
      console.warn('[FB Extractor] Extension context invalidated - saving to local storage as backup');
      this.saveContactsToLocalStorage(contacts);
      this.showExtensionReloadNotification();
      return;
    }

    // Use safe message sending with enhanced error handling
    this.safeSendMessage({
      action: 'saveContacts',
      contacts: contacts
    }, (response) => {
      // Handle different response types
      if (response && response.error) {
        console.warn('[FB Extractor] Error response from safeSendMessage:', response.error);
        
        // If it's a connection error, use local storage
        if (response.fallback || 
            response.error === 'connection_failed' ||
            response.error.includes('receiving end does not exist') ||
            response.error.includes('Could not establish connection')) {
          
          console.log('[FB Extractor] Using local storage fallback due to connection error');
          this.saveContactsToLocalStorage(contacts);
          return;
        }
        
        // For other errors, also fallback to local storage
        console.log('[FB Extractor] Using local storage fallback due to other error');
        this.saveContactsToLocalStorage(contacts);
        return;
      }

      // Success response
      if (response && response.success) {
        console.log(`[FB Extractor] ✅ Saved ${response.newCount} new contacts. Total: ${response.totalCount}`);
        
        // Update UI to show successful sync
        if (document.getElementById('extractor-count')) {
          const countElement = document.getElementById('extractor-count');
          countElement.style.color = 'green';
          countElement.title = 'Contacts synced successfully with extension storage';
        }
      } else {
        console.warn('[FB Extractor] No valid response from background script, using local storage fallback');
        this.saveContactsToLocalStorage(contacts);
      }
    });
  }

  saveContactsToLocalStorage(contacts) {
    try {
      // Get existing backup contacts
      const existingBackup = localStorage.getItem('fb-extractor-backup-contacts');
      let allBackupContacts = existingBackup ? JSON.parse(existingBackup) : [];
      
      // Add new contacts to backup
      const existingNumbers = new Set(allBackupContacts.map(c => c.number));
      const newBackupContacts = contacts.filter(contact => !existingNumbers.has(contact.number));
      
      allBackupContacts.push(...newBackupContacts);
      
      // Save to localStorage
      localStorage.setItem('fb-extractor-backup-contacts', JSON.stringify(allBackupContacts));
      localStorage.setItem('fb-extractor-backup-timestamp', new Date().toISOString());
      
      console.log(`[FB Extractor] Saved ${newBackupContacts.length} contacts to local storage backup. Total backup: ${allBackupContacts.length}`);
      
      // Update UI to show backup status
      if (document.getElementById('extractor-count')) {
        const countElement = document.getElementById('extractor-count');
        countElement.textContent = `${this.extractedNumbers.size} (${allBackupContacts.length} backed up)`;
        countElement.style.color = 'orange';
        countElement.title = 'Contacts backed up locally - refresh page to sync with extension';
      }
      
    } catch (error) {
      console.error('[FB Extractor] Error saving to local storage:', error);
    }
  }

  handleExtensionInvalidation() {
    // Stop all active operations when extension context is invalidated
    console.log('[FB Extractor] Handling extension invalidation...');
    
    // Stop extraction
    this.isActive = false;
    this.isScrolling = false;
    
    // Set fallback mode flag
    this.fallbackMode = true;
    
    // Clear all intervals
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
    if (this.extractInterval) {
      clearInterval(this.extractInterval);
      this.extractInterval = null;
    }
    if (this.navigationInterval) {
      clearInterval(this.navigationInterval);
      this.navigationInterval = null;
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Start periodic reconnection attempts
    this.startReconnectionAttempts();
    
    // Update UI to show invalidated state
    if (document.getElementById('extractor-status')) {
      this.updateStatus('Extension Reloaded - Fallback Mode', 'orange');
    }
    if (document.getElementById('extractor-toggle')) {
      document.getElementById('extractor-toggle').textContent = 'Reload Page';
      document.getElementById('extractor-toggle').onclick = () => location.reload();
    }
    if (document.getElementById('extractor-scroll')) {
      document.getElementById('extractor-scroll').textContent = 'Stopped';
    }
    
    console.log('[FB Extractor] All operations stopped due to extension invalidation');
  }

  startReconnectionAttempts() {
    // Try to reconnect every 5 seconds for up to 2 minutes
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes
    
    this.reconnectionInterval = setInterval(() => {
      attempts++;
      
      try {
        // Test if extension context is restored
        if (chrome && chrome.runtime && chrome.runtime.id) {
          console.log('[FB Extractor] ✅ Extension context restored! Clearing fallback mode.');
          
          // Extension is back online
          this.fallbackMode = false;
          clearInterval(this.reconnectionInterval);
          
          // Try to sync any backup contacts
          this.syncBackupContacts();
          
          // Update UI
          this.updateStatus('Reconnected - Ready', 'green');
          if (document.getElementById('extractor-toggle')) {
            document.getElementById('extractor-toggle').textContent = 'Start';
            document.getElementById('extractor-toggle').onclick = () => this.toggle();
          }
          
          return;
        }
      } catch (error) {
        // Still not available
      }
      
      if (attempts >= maxAttempts) {
        console.log('[FB Extractor] Reconnection attempts timed out. Manual page refresh needed.');
        clearInterval(this.reconnectionInterval);
      }
      
    }, 5000); // Check every 5 seconds
  }

  syncBackupContacts() {
    try {
      const backupContacts = localStorage.getItem('fb-extractor-backup-contacts');
      if (backupContacts) {
        const contacts = JSON.parse(backupContacts);
        console.log(`[FB Extractor] Syncing ${contacts.length} backup contacts...`);
        
        this.safeSaveContacts(contacts);
        
        // Clear backup after successful sync
        localStorage.removeItem('fb-extractor-backup-contacts');
        localStorage.removeItem('fb-extractor-backup-timestamp');
        
        console.log('[FB Extractor] ✅ Backup contacts synced successfully');
      }
    } catch (error) {
      console.warn('[FB Extractor] Error syncing backup contacts:', error);
    }
  }

  showExtensionReloadNotification() {
    // Create a notification banner
    const notification = document.createElement('div');
    notification.id = 'fb-extractor-reload-notification';
    notification.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ff6b6b;
      color: white;
      text-align: center;
      padding: 10px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      z-index: 999999;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    notification.innerHTML = `
      🔄 Extension connection lost - using fallback mode. Data is safely stored locally.
      <br><small>📊 ${this.extractedNumbers.size} contacts secured • Attempting automatic reconnection...</small>
      <br>
      <button onclick="location.reload()" style="margin-left: 10px; padding: 8px 15px; background: white; color: #ff6b6b; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Refresh for Full Sync</button>
      <button onclick="this.parentElement.remove()" style="margin-left: 5px; padding: 8px 12px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 4px; cursor: pointer;">Dismiss</button>
    `;

    // Remove existing notification if present
    const existing = document.getElementById('fb-extractor-reload-notification');
    if (existing) {
      existing.remove();
    }

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }
  
  updateContactCount() {
    document.getElementById('extractor-count').textContent = this.extractedNumbers.size;
    
    // Update interaction stats
    const interactions = this.humanBehavior.mouseMovements + this.humanBehavior.clickEvents;
    document.getElementById('extractor-interactions').textContent = interactions;
  }
  
  updateStatus(status, color = 'black') {
    const statusElement = document.getElementById('extractor-status');
    statusElement.textContent = status;
    statusElement.style.color = color;
  }
  
  hide() {
    this.statusElement.style.display = 'none';
  }
  
  show() {
    this.statusElement.style.display = 'block';
  }
  
  toggleUI() {
    if (this.statusElement.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }
  
  exportCSV() {
    if (!chrome.runtime || !chrome.runtime.sendMessage) {
      console.warn('[FB Extractor] Extension context invalidated - cannot export contacts. Please reload the page.');
      this.showExtensionReloadNotification();
      return;
    }

    try {
      chrome.runtime.sendMessage({ action: 'getContacts' }, (response) => {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
            console.warn('[FB Extractor] Extension was reloaded during export. Please refresh the page.');
            this.showExtensionReloadNotification();
            return;
          }
          console.error('[FB Extractor] Error getting contacts for export:', chrome.runtime.lastError.message);
          return;
        }

        if (response && response.contacts) {
          this.downloadWhatsAppTXT(response.contacts);
        } else {
          console.warn('[FB Extractor] No contacts received for export');
        }
      });
    } catch (error) {
      console.error('[FB Extractor] Error in exportCSV:', error.message);
      if (error.message.includes('Extension context invalidated')) {
        this.showExtensionReloadNotification();
      }
    }
  }
  
  downloadWhatsAppTXT(contacts) {
    // Convert contacts to WhatsApp format: number@c.us
    const whatsappNumbers = contacts.map(contact => {
      let cleanNumber = contact.number;
      
      // Remove any non-digits except +
      cleanNumber = cleanNumber.replace(/[^\d+]/g, '');
      
      // Remove + if present
      if (cleanNumber.startsWith('+')) {
        cleanNumber = cleanNumber.substring(1);
      }
      
      // Ensure it starts with 92 for Pakistani numbers
      if (cleanNumber.startsWith('0')) {
        cleanNumber = '92' + cleanNumber.substring(1);
      } else if (!cleanNumber.startsWith('92')) {
        cleanNumber = '92' + cleanNumber;
      }
      
      return cleanNumber + '@c.us';
    });
    
    // Remove duplicates
    const uniqueNumbers = [...new Set(whatsappNumbers)];
    
    // Create TXT content
    const txtContent = uniqueNumbers.join('\n');
    
    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp_contacts_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log(`[FB Extractor] Exported ${uniqueNumbers.length} WhatsApp contacts to TXT format`);
  }
  
  clearContacts() {
    if (confirm('Are you sure you want to clear all extracted contacts?')) {
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        console.warn('[FB Extractor] Extension context invalidated - cannot clear contacts. Please reload the page.');
        this.showExtensionReloadNotification();
        return;
      }

      try {
        chrome.runtime.sendMessage({ action: 'clearContacts' }, (response) => {
          if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
              console.warn('[FB Extractor] Extension was reloaded during clear. Please refresh the page.');
              this.showExtensionReloadNotification();
              return;
            }
            console.error('[FB Extractor] Error clearing contacts:', chrome.runtime.lastError.message);
            return;
          }

          if (response && response.success) {
            this.extractedNumbers.clear();
            this.updateContactCount();
            alert('All contacts cleared!');
          } else {
            console.warn('[FB Extractor] Failed to clear contacts');
          }
        });
      } catch (error) {
        console.error('[FB Extractor] Error in clearContacts:', error.message);
        if (error.message.includes('Extension context invalidated')) {
          this.showExtensionReloadNotification();
        }
      }
    }
  }
  
  viewContacts() {
    if (!chrome.runtime || !chrome.runtime.sendMessage) {
      console.warn('[FB Extractor] Extension context invalidated - cannot view contacts. Please reload the page.');
      this.showExtensionReloadNotification();
      return;
    }

    try {
      chrome.runtime.sendMessage({ action: 'getContacts' }, (response) => {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
            console.warn('[FB Extractor] Extension was reloaded during view. Please refresh the page.');
            this.showExtensionReloadNotification();
            return;
          }
          console.error('[FB Extractor] Error getting contacts for view:', chrome.runtime.lastError.message);
          return;
        }

        if (response && response.contacts) {
          this.showContactsModal(response.contacts);
        } else {
          console.warn('[FB Extractor] No contacts received for view');
          alert('No contacts found. Start extraction first.');
        }
      });
    } catch (error) {
      console.error('[FB Extractor] Error in viewContacts:', error.message);
      if (error.message.includes('Extension context invalidated')) {
        this.showExtensionReloadNotification();
      }
    }
  }
  
  showContactsModal(contacts) {
    const modal = document.createElement('div');
    modal.id = 'contacts-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Extracted Contacts (${contacts.length})</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="contacts-list">
            ${contacts.map(contact => `
              <div class="contact-item">
                <div class="contact-number">${contact.number}</div>
                <div class="contact-context">${contact.context}</div>
                <div class="contact-meta">${contact.timestamp}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
  
  // Debug function - call manually in console
  testExtraction() {
    console.log('=== TESTING PHONE NUMBER EXTRACTION ===');
    
    // Test the regex patterns with your sample numbers
    const testNumbers = [
      '03171991804',
      '+923379921437', 
      '03028185226',
      '03132197696',
      '03356540071'
    ];
    
    console.log('Testing regex patterns:');
    testNumbers.forEach(num => {
      console.log(`Testing: "${num}"`);
      this.phonePatterns.forEach((pattern, index) => {
        const matches = num.match(pattern);
        if (matches) {
          console.log(`  Pattern ${index} matched:`, matches);
        }
      });
      const cleaned = this.cleanPhoneNumber(num);
      console.log(`  Cleaned result: "${cleaned}"`);
      
      // Test WhatsApp format conversion
      const whatsappFormat = this.convertToWhatsAppFormat(cleaned);
      console.log(`  WhatsApp format: "${whatsappFormat}"`);
    });
    
    // Test on actual page content
    console.log('\nTesting on current page:');
    const posts = this.getPosts();
    console.log(`Found ${posts.length} posts`);
    
    posts.slice(0, 3).forEach((post, i) => {
      const text = this.getPostText(post);
      console.log(`\nPost ${i + 1} text:`, text.substring(0, 200));
      const numbers = this.extractPhoneNumbers(text);
      console.log(`Found numbers:`, numbers);
    });
  }
  
  convertToWhatsAppFormat(phoneNumber) {
    if (!phoneNumber) return null;
    
    let cleanNumber = phoneNumber;
    
    // Remove any non-digits except +
    cleanNumber = cleanNumber.replace(/[^\d+]/g, '');
    
    // Remove + if present
    if (cleanNumber.startsWith('+')) {
      cleanNumber = cleanNumber.substring(1);
    }
    
    // Ensure it starts with 92 for Pakistani numbers
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '92' + cleanNumber.substring(1);
    } else if (!cleanNumber.startsWith('92')) {
      cleanNumber = '92' + cleanNumber;
    }
    
    return cleanNumber + '@c.us';
  }
}

// Initialize the extractor when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.fbContactExtractor = new FacebookContactExtractor();
  });
} else {
  window.fbContactExtractor = new FacebookContactExtractor();
}

// Make it globally accessible
window.fbContactExtractor = window.fbContactExtractor || new FacebookContactExtractor();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'toggle') {
      if (window.fbContactExtractor) {
        window.fbContactExtractor.toggle();
        sendResponse({ isActive: window.fbContactExtractor.isActive });
      } else {
        console.log('[FB Extractor] Content script not ready, initializing...');
        // Initialize if not already done
        if (typeof FacebookContactExtractor !== 'undefined') {
          window.fbContactExtractor = new FacebookContactExtractor();
          window.fbContactExtractor.toggle();
          sendResponse({ isActive: window.fbContactExtractor.isActive });
        } else {
          sendResponse({ isActive: false, error: 'Content script not loaded' });
        }
      }
      return true;
    }
    
    if (request.action === 'getStatus') {
      if (window.fbContactExtractor) {
        sendResponse({ isActive: window.fbContactExtractor.isActive });
      } else {
        sendResponse({ isActive: false });
      }
      return true;
    }
  } catch (error) {
    console.error('[FB Extractor] Error handling message:', error);
    sendResponse({ isActive: false, error: error.message });
  }
  
  return true; // Keep message channel open
});

// Initialize the extractor when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (!window.fbContactExtractor && typeof FacebookContactExtractor !== 'undefined') {
        window.fbContactExtractor = new FacebookContactExtractor();
        console.log('[FB Extractor] Content script initialized and ready');
      }
    }, 1000);
  });
} else {
  // DOM is already ready
  setTimeout(() => {
    if (!window.fbContactExtractor && typeof FacebookContactExtractor !== 'undefined') {
      window.fbContactExtractor = new FacebookContactExtractor();
      console.log('[FB Extractor] Content script initialized and ready');
    }
  }, 1000);
}
