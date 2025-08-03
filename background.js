// Background script for the Facebook Contact Extractor
chrome.runtime.onInstalled.addListener(() => {
  console.log('Facebook Contact Extractor installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveContacts') {
    // Save contacts to storage
    chrome.storage.local.get(['extractedContacts'], (result) => {
      const existingContacts = result.extractedContacts || [];
      const newContacts = request.contacts.filter(contact => 
        !existingContacts.some(existing => existing.number === contact.number)
      );
      
      const updatedContacts = [...existingContacts, ...newContacts];
      
      chrome.storage.local.set({ extractedContacts: updatedContacts }, () => {
        sendResponse({ 
          success: true, 
          newCount: newContacts.length,
          totalCount: updatedContacts.length 
        });
      });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getContacts') {
    chrome.storage.local.get(['extractedContacts'], (result) => {
      sendResponse({ contacts: result.extractedContacts || [] });
    });
    return true;
  }
  
  if (request.action === 'clearContacts') {
    chrome.storage.local.set({ extractedContacts: [] }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('facebook.com')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: toggleExtraction
    });
  }
});

function toggleExtraction() {
  // This function will be injected into the page
  if (window.fbContactExtractor) {
    window.fbContactExtractor.toggle();
  }
}
