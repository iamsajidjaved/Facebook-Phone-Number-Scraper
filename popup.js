// Popup script for Facebook Contact Extractor
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('toggle-extraction');
  const exportBtn = document.getElementById('export-csv');
  const viewBtn = document.getElementById('view-contacts');
  const clearBtn = document.getElementById('clear-contacts');
  const testSeeMoreBtn = document.getElementById('test-see-more');
  const statusText = document.getElementById('status-text');
  const statusDiv = document.getElementById('status');
  const totalContactsSpan = document.getElementById('total-contacts');
  const sessionContactsSpan = document.getElementById('session-contacts');
  const pageStatusSpan = document.getElementById('page-status');
  
  let isExtracting = false;
  let currentTab = null;
  
  // Initialize popup
  init();
  
  async function init() {
    // Get current tab
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tabs[0];
      
      // Check if we're on Facebook
      updatePageStatus();
      
      // Load statistics
      loadStats();
      
      // Check extraction status
      checkExtractionStatus();
    } catch (error) {
      console.error('Error initializing popup:', error);
    }
  }
  
  function updatePageStatus() {
    if (currentTab && currentTab.url.includes('facebook.com')) {
      pageStatusSpan.textContent = 'Facebook ✓';
      pageStatusSpan.style.color = '#42b883';
    } else {
      pageStatusSpan.textContent = 'Not on Facebook';
      pageStatusSpan.style.color = '#e74c3c';
      toggleBtn.disabled = true;
      toggleBtn.textContent = 'Go to Facebook';
    }
  }
  
  function loadStats() {
    chrome.storage.local.get(['extractedContacts'], (result) => {
      const contacts = result.extractedContacts || [];
      totalContactsSpan.textContent = contacts.length;
      
      // Calculate session contacts (today)
      const today = new Date().toDateString();
      const sessionContacts = contacts.filter(contact => 
        new Date(contact.timestamp).toDateString() === today
      );
      sessionContactsSpan.textContent = sessionContacts.length;
    });
  }
  
  function checkExtractionStatus() {
    if (currentTab && currentTab.url.includes('facebook.com')) {
      chrome.tabs.sendMessage(currentTab.id, { action: 'getStatus' }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script not loaded or page not ready
          console.log('Content script not ready:', chrome.runtime.lastError.message || chrome.runtime.lastError);
          updateStatus(false);
          return;
        }
        
        if (response && typeof response === 'object' && 'isActive' in response) {
          updateStatus(response.isActive);
        } else {
          console.log('No valid status response from content script');
          updateStatus(false);
        }
      });
    } else {
      updateStatus(false);
    }
  }
  
  function updateStatus(active) {
    isExtracting = active;
    
    if (active) {
      statusText.textContent = 'Active - Extracting';
      statusDiv.className = 'status active';
      toggleBtn.textContent = 'Stop Extraction';
      toggleBtn.className = 'btn btn-danger';
    } else {
      statusText.textContent = 'Inactive';
      statusDiv.className = 'status inactive';
      toggleBtn.textContent = 'Start Extraction';
      toggleBtn.className = 'btn btn-primary';
    }
  }
  
  // Event listeners
  toggleBtn.addEventListener('click', function() {
    if (!currentTab || !currentTab.url.includes('facebook.com')) {
      chrome.tabs.create({ url: 'https://facebook.com' });
      return;
    }
    
    chrome.tabs.sendMessage(currentTab.id, { action: 'toggle' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError.message || chrome.runtime.lastError);
        // Try to inject content script
        injectContentScript();
        return;
      }
      
      if (response && typeof response === 'object' && 'isActive' in response) {
        updateStatus(response.isActive);
        if (response.isActive) {
          // Refresh stats periodically while extracting
          startStatsRefresh();
        }
      } else {
        console.warn('Invalid response from content script:', response);
        // Assume extraction is not active
        updateStatus(false);
      }
    });
  });
  
  exportBtn.addEventListener('click', function() {
    chrome.storage.local.get(['extractedContacts'], (result) => {
      const contacts = result.extractedContacts || [];
      
      if (contacts.length === 0) {
        alert('No contacts to export. Start extraction first.');
        return;
      }
      
      exportToWhatsAppTXT(contacts);
    });
  });
  
  viewBtn.addEventListener('click', function() {
    chrome.storage.local.get(['extractedContacts'], (result) => {
      const contacts = result.extractedContacts || [];
      
      if (contacts.length === 0) {
        alert('No contacts found. Start extraction first.');
        return;
      }
      
      showContactsWindow(contacts);
    });
  });
  
  clearBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all extracted contacts? This action cannot be undone.')) {
      chrome.storage.local.set({ extractedContacts: [] }, () => {
        loadStats();
        alert('All contacts cleared successfully!');
      });
    }
  });
  
  testSeeMoreBtn.addEventListener('click', function() {
    if (!currentTab || !currentTab.url.includes('facebook.com')) {
      alert('Please navigate to Facebook first!');
      return;
    }
    
    chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: () => {
        if (window.fbExtractor) {
          window.fbExtractor.testSeeMoreDetection();
          alert('See More detection test completed! Check browser console (F12) for detailed results.');
        } else {
          alert('Facebook Contact Extractor is not active. Please start extraction first.');
        }
      }
    });
  });
  
  function injectContentScript() {
    chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      files: ['content.js']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error injecting script:', chrome.runtime.lastError);
        alert('Please refresh the Facebook page and try again.');
      } else {
        // Try the toggle again after injection
        setTimeout(() => {
          chrome.tabs.sendMessage(currentTab.id, { action: 'toggle' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error after script injection:', chrome.runtime.lastError.message || chrome.runtime.lastError);
              return;
            }
            if (response && typeof response === 'object' && 'isActive' in response) {
              updateStatus(response.isActive);
            }
          });
        }, 1000);
      }
    });
  }
  
  function startStatsRefresh() {
    const refreshInterval = setInterval(() => {
      if (!isExtracting) {
        clearInterval(refreshInterval);
        return;
      }
      
      loadStats();
    }, 2000);
  }
  
  function exportToWhatsAppTXT(contacts) {
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
    const url = URL.createObjectURL(blob);
    
    const filename = `whatsapp_contacts_${new Date().toISOString().split('T')[0]}.txt`;
    
    // Check if downloads API is available
    if (chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download error:', chrome.runtime.lastError);
          // Fallback: copy to clipboard
          copyToClipboard(txtContent);
        } else {
          console.log('WhatsApp TXT file downloaded:', downloadId);
          alert(`Exported ${uniqueNumbers.length} WhatsApp contacts as TXT file!`);
        }
      });
    } else {
      // Fallback: trigger manual download
      console.log('Downloads API not available, using manual download');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert(`Exported ${uniqueNumbers.length} WhatsApp contacts as TXT file!`);
    }
  }
  
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      const lineCount = text.split('\n').length;
      alert(`WhatsApp contacts copied to clipboard! You can paste ${lineCount} contacts into a text file.`);
    }).catch((err) => {
      console.error('Failed to copy to clipboard:', err);
      alert('Export failed. Please try again or check browser permissions.');
    });
  }
  
  function showContactsWindow(contacts) {
    // Create a new window/tab to display contacts
    const contactsHtml = generateContactsHTML(contacts);
    const blob = new Blob([contactsHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    chrome.tabs.create({ url: url });
  }
  
  function generateContactsHTML(contacts) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Extracted Contacts - Facebook Contact Extractor</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
        }
        
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            color: #1877f2;
            margin: 0 0 10px 0;
        }
        
        .stats {
            display: flex;
            gap: 20px;
            color: #65676b;
        }
        
        .contacts-container {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .contact-item {
            padding: 15px 20px;
            border-bottom: 1px solid #e4e6ea;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .contact-item:last-child {
            border-bottom: none;
        }
        
        .contact-item:hover {
            background: #f8f9fa;
        }
        
        .contact-info {
            flex: 1;
        }
        
        .contact-number {
            font-weight: 600;
            color: #1877f2;
            font-size: 16px;
            margin-bottom: 5px;
        }
        
        .contact-context {
            color: #65676b;
            font-size: 14px;
            margin-bottom: 3px;
        }
        
        .contact-meta {
            color: #8a8d91;
            font-size: 12px;
        }
        
        .contact-actions {
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            text-decoration: none;
            color: white;
        }
        
        .btn-whatsapp {
            background: #25d366;
        }
        
        .btn-copy {
            background: #6c757d;
        }
        
        .search-box {
            padding: 15px 20px;
            border-bottom: 1px solid #e4e6ea;
            background: #f8f9fa;
        }
        
        .search-box input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .export-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1877f2;
            color: white;
            border: none;
            padding: 15px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Extracted Contacts</h1>
        <div class="stats">
            <span>Total Contacts: <strong>${contacts.length}</strong></span>
            <span>Extracted: <strong>${new Date().toLocaleDateString()}</strong></span>
        </div>
    </div>
    
    <div class="contacts-container">
        <div class="search-box">
            <input type="text" placeholder="Search contacts..." onkeyup="filterContacts(this.value)">
        </div>
        
        <div id="contacts-list">
            ${contacts.map((contact, index) => `
                <div class="contact-item" data-contact='${JSON.stringify(contact)}'>
                    <div class="contact-info">
                        <div class="contact-number">${contact.number}</div>
                        <div class="contact-context">${contact.context || 'No context available'}</div>
                        <div class="contact-meta">${new Date(contact.timestamp).toLocaleString()}</div>
                    </div>
                    <div class="contact-actions">
                        <a href="https://wa.me/${contact.number.replace(/[^0-9]/g, '')}" 
                           target="_blank" class="btn btn-whatsapp">WhatsApp</a>
                        <button class="btn btn-copy" onclick="copyNumber('${contact.number.replace(/[^0-9]/g, '')}@c.us')">Copy WA</button>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <button class="export-btn" onclick="exportAll()">Export WhatsApp TXT</button>
    
    <script>
        function filterContacts(searchTerm) {
            const contactItems = document.querySelectorAll('.contact-item');
            const term = searchTerm.toLowerCase();
            
            contactItems.forEach(item => {
                const contact = JSON.parse(item.dataset.contact);
                const searchText = (contact.number + ' ' + (contact.context || '')).toLowerCase();
                
                if (searchText.includes(term)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        }
        
        function copyNumber(number) {
            navigator.clipboard.writeText(number).then(() => {
                alert('WhatsApp format copied: ' + number);
            });
        }
        
        function exportAll() {
            const contacts = ${JSON.stringify(contacts)};
            
            // Convert to WhatsApp format
            const whatsappNumbers = contacts.map(contact => {
                let cleanNumber = contact.number;
                
                // Remove any non-digits except +
                cleanNumber = cleanNumber.replace(/[^\\d+]/g, '');
                
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
            const txtContent = uniqueNumbers.join('\\n');
            
            const blob = new Blob([txtContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'whatsapp_contacts_' + new Date().toISOString().split('T')[0] + '.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    </script>
</body>
</html>`;
  }
  
  // Listen for storage changes to update stats in real-time
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.extractedContacts) {
      loadStats();
    }
  });
});
