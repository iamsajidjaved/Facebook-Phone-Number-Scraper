// Content script for Facebook Contact Extractor
class FacebookContactExtractor {
  constructor() {
    this.isActive = false;
    this.isScrolling = false;
    this.extractedNumbers = new Set();
    this.scrollInterval = null;
    this.extractInterval = null;
    this.statusElement = null;
    this.lastScrollPosition = 0;
    this.scrollTimeout = null;
    this.humanBehavior = {
      lastActivity: Date.now(),
      mouseMovements: 0,
      clickEvents: 0,
      scrollEvents: 0,
      sessionStartTime: Date.now()
    };
    
    // Phone number patterns for different formats
    this.phonePatterns = [
      // Pakistani mobile numbers - exact formats from your samples
      /\b0?3[0-9]{2}[-\s]?[0-9]{3}[-\s]?[0-9]{4}\b/g,      // 0302-8185226, 0315-5144747, 0311-9032215
      /\b0?3[0-9]{9}\b/g,                                    // 03355858980 (no separators)
      /\b\+923[0-9]{9}\b/g,                                  // +923379921437
      /\b923[0-9]{9}\b/g,                                    // 923379921437 (without +)
      
      // Contact patterns with context (from your samples)
      /(?:📞|contact|call|whatsapp|wa)[:\s]*([0-9]{4}[-\s]?[0-9]{3}[-\s]?[0-9]{4})/gi,
      /(?:📞|contact|call|whatsapp|wa)[:\s]*([0-9]{11})/gi,
      /(?:📱|mobile|phone)[:\s]*([0-9]{4}[-\s]?[0-9]{3}[-\s]?[0-9]{4})/gi,
      
      // Multi-line contact detection (common in your samples)
      /📞[^\n]*\n.*?([0-9]{4}[-\s]?[0-9]{3}[-\s]?[0-9]{4})/gi,
      /contact[^:]*:[^\n]*\n.*?([0-9]{4}[-\s]?[0-9]{3}[-\s]?[0-9]{4})/gi,
      
      // Specific patterns from your samples
      /WhatsApp[^:]*:[^\n]*([0-9]{4}[-\s]?[0-9]{3}[-\s]?[0-9]{4})/gi,
      /Feel free to contact[^0-9]*([0-9]{4}[-\s]?[0-9]{3}[-\s]?[0-9]{4})/gi,
      /Contact us[^:]*:[^0-9]*([0-9]{4}[-\s]?[0-9]{3}[-\s]?[0-9]{4})/gi,
      
      // Multiple numbers in same post (like sample 4)
      /([0-9]{4}[-\s]?[0-9]{3}[-\s]?[0-9]{4})\s*\n\s*([0-9]{4}[-\s]?[0-9]{3}[-\s]?[0-9]{4})/gi,
      
      // General 11-digit Pakistani format
      /\b0[3-9][0-9]{9}\b/g,                                 // Any Pakistani mobile starting with 0
      
      // WhatsApp format
      /(?:wa\.me\/|whatsapp\.com\/send\?phone=)(\+?[0-9]{10,15})/g,
      
      // Parentheses format
      /\(([0-9]{4}[-\s]?[0-9]{3}[-\s]?[0-9]{4})\)/g,
      
      // Fallback for any 10-11 digit number
      /\b[0-9]{10,11}\b/g
    ];
    
    this.init();
  }
  
  init() {
    this.createStatusUI();
    this.setupKeyboardShortcuts();
    this.setupHumanBehaviorTracking();
    this.setupStealthMode();
    console.log('Facebook Contact Extractor initialized with stealth mode');
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
  
  shouldPauseForSuspicion() {
    const now = Date.now();
    const sessionDuration = now - this.humanBehavior.sessionStartTime;
    const timeSinceLastActivity = now - this.humanBehavior.lastActivity;
    
    // Pause if:
    // 1. No real user activity for 5 minutes
    // 2. Session running for more than 30 minutes without break
    // 3. Very low interaction ratios
    
    if (timeSinceLastActivity > 300000) { // 5 minutes
      console.log('[Stealth] Pausing - no user activity detected');
      return true;
    }
    
    if (sessionDuration > 1800000) { // 30 minutes
      console.log('[Stealth] Pausing - long session, taking break');
      return true;
    }
    
    // Check interaction ratios (should have some real mouse/click activity)
    const totalScrolls = this.humanBehavior.scrollEvents;
    const realInteractions = this.humanBehavior.mouseMovements + this.humanBehavior.clickEvents;
    
    if (totalScrolls > 50 && realInteractions < 10) {
      console.log('[Stealth] Pausing - suspicious interaction pattern');
      return true;
    }
    
    return false;
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
        <div>Stealth: <span id="extractor-stealth">Active</span></div>
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
    
    // Check if we should start based on human behavior
    if (this.shouldPauseForSuspicion()) {
      this.updateStatus('Paused - Waiting for user activity', 'orange');
      setTimeout(() => this.start(), 60000); // Retry in 1 minute
      return;
    }
    
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
    }    console.log('Contact extraction stopped');
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
    // Check if we should pause for suspicious behavior
    if (this.shouldPauseForSuspicion()) {
      this.pauseExtraction();
      return;
    }
    
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
  
  pauseExtraction() {
    console.log('[Stealth] Pausing extraction to avoid detection');
    this.updateStatus('Paused - Stealth mode', 'orange');
    
    const pauseDuration = Math.floor(Math.random() * 300000) + 120000; // 2-7 minutes
    
    setTimeout(() => {
      if (this.isActive) {
        console.log('[Stealth] Resuming extraction');
        this.start();
      }
      }, pauseDuration);
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
      this.saveContacts(newContacts);
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
        this.saveContacts(newContacts);
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
        expandedCount++;
        
        // Add human-like delay before clicking
        setTimeout(() => {
          this.humanLikeClick(button);
        }, (expandedCount * 300) + Math.random() * 1000 + 200); // Stagger clicks
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
        
        // STRICT SAFETY CHECKS - Reject ANY potential navigation elements
        const isNavigationElement = (
          // Link elements
          div.tagName === 'A' ||
          div.closest('a') ||
          div.href ||
          div.getAttribute('href') ||
          div.querySelector('a') ||
          
          // URL indicators
          text.includes('http') ||
          text.includes('www.') ||
          text.includes('.com') ||
          text.includes('.org') ||
          text.includes('.net') ||
          
          // Data attributes that might navigate
          div.getAttribute('data-href') ||
          div.getAttribute('data-url') ||
          div.getAttribute('data-link') ||
          
          // Profile/page indicators
          div.getAttribute('data-testid')?.includes('profile') ||
          div.getAttribute('data-testid')?.includes('page') ||
          div.getAttribute('data-testid')?.includes('user') ||
          
          // Video/media indicators  
          div.getAttribute('data-testid')?.includes('video') ||
          div.getAttribute('data-testid')?.includes('reel') ||
          div.getAttribute('data-testid')?.includes('media') ||
          
          // Navigation role indicators
          div.getAttribute('role') === 'link' ||
          div.getAttribute('role') === 'navigation' ||
          
          // Parent link check
          div.closest('[role="link"]') ||
          div.closest('[href]') ||
          
          // Child element check for navigation
          div.querySelector('[role="link"]') ||
          div.querySelector('[href]') ||
          div.querySelector('a') ||
          
          // Additional safety - check for common navigation classes
          div.className.toLowerCase().includes('link') ||
          div.className.toLowerCase().includes('nav') ||
          div.className.toLowerCase().includes('url')
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
    
    if (isExactSeeMore && element.tagName === 'DIV') {
      console.log('[FB Extractor] ✅ APPROVED: Exact "See more" DIV element:', text);
      return false; // Allow the click ONLY for exact "See more" divs
    }
    
    // REJECT EVERYTHING ELSE - No exceptions
    console.log('[FB Extractor] ❌ REJECTED: Not an exact "See more" div');
    console.log('[FB Extractor] ❌ Element type:', element.tagName);
    console.log('[FB Extractor] ❌ Element text:', text.substring(0, 50));
    
    return true; // Reject all other elements
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
      this.saveContacts(newContacts);
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
    // Clean and standardize phone number
    let cleaned = number.replace(/[^\d+]/g, '');
    
    // Handle Pakistani mobile numbers
    if (cleaned.match(/^03[0-9]{9}$/)) {
      // 03171991804 -> +923171991804
      cleaned = '+92' + cleaned.substring(1);
    } else if (cleaned.match(/^3[0-9]{9}$/)) {
      // 3171991804 -> +923171991804
      cleaned = '+92' + cleaned;
    } else if (cleaned.match(/^923[0-9]{9}$/)) {
      // 923171991804 -> +923171991804
      cleaned = '+' + cleaned;
    } else if (cleaned.match(/^0[3-9][0-9]{9}$/)) {
      // Any Pakistani mobile starting with 0 -> convert to +92
      cleaned = '+92' + cleaned.substring(1);
    }
    
    // Validate length (should be 13 characters for +92 format or 10-15 for others)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return null;
    }
    
    // Ensure it's a valid Pakistani mobile number
    if (cleaned.match(/^\+923[0-9]{9}$/)) {
      return cleaned;
    }
    
    // For other formats, basic validation
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return cleaned;
    }
    
    return null;
  }
  
  saveContacts(contacts) {
    // Check if chrome.runtime is still available
    if (!chrome.runtime || !chrome.runtime.sendMessage) {
      console.warn('[FB Extractor] Extension context invalidated - cannot save contacts. Please reload the page.');
      return;
    }

    try {
      chrome.runtime.sendMessage({
        action: 'saveContacts',
        contacts: contacts
      }, (response) => {
        // Check for extension context invalidation
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
            console.warn('[FB Extractor] Extension was reloaded. Please refresh the page to continue.');
            this.showExtensionReloadNotification();
            return;
          }
          console.error('[FB Extractor] Error saving contacts:', chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success) {
          console.log(`[FB Extractor] Saved ${response.newCount} new contacts. Total: ${response.totalCount}`);
        } else {
          console.warn('[FB Extractor] Failed to save contacts - no response from background script');
        }
      });
    } catch (error) {
      console.error('[FB Extractor] Error in saveContacts:', error.message);
      if (error.message.includes('Extension context invalidated')) {
        this.showExtensionReloadNotification();
      }
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
      🔄 Facebook Contact Extractor was reloaded. Please refresh this page to continue extraction.
      <button onclick="location.reload()" style="margin-left: 10px; padding: 5px 10px; background: white; color: #ff6b6b; border: none; border-radius: 3px; cursor: pointer;">Refresh Now</button>
      <button onclick="this.parentElement.remove()" style="margin-left: 5px; padding: 5px 10px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 3px; cursor: pointer;">×</button>
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
    
    // Update stealth stats
    const interactions = this.humanBehavior.mouseMovements + this.humanBehavior.clickEvents;
    document.getElementById('extractor-interactions').textContent = interactions;
    
    // Update stealth status
    const stealthElement = document.getElementById('extractor-stealth');
    if (this.shouldPauseForSuspicion()) {
      stealthElement.textContent = 'Needs Break';
      stealthElement.style.color = 'orange';
    } else {
      stealthElement.textContent = 'Active';
      stealthElement.style.color = 'green';
    }
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
