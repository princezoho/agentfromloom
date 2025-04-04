/**
 * Integration Suggestions Module
 * 
 * This module identifies applications in Loom videos and suggests 
 * Make.com/Zapier integrations as alternatives to browser automation.
 */

// Database of known applications and their integration suggestions
const KNOWN_APPS = {
  'google-sheets': {
    name: 'Google Sheets',
    urlPatterns: [
      'sheets.google.com',
      'docs.google.com/spreadsheets'
    ],
    keywords: [
      'Google Sheets',
      'spreadsheet',
      'sheet',
      'cell',
      'column',
      'row',
      'formula'
    ],
    makeIntegrations: [
      {
        name: 'Add a new row to Google Sheets',
        description: 'Creates a new row with your data in a specified Google Sheets spreadsheet',
        url: 'https://www.make.com/en/integrations/google-sheets',
        complexity: 'Simple'
      },
      {
        name: 'Update existing rows in Google Sheets',
        description: 'Find and update existing data in your spreadsheet',
        url: 'https://www.make.com/en/integrations/google-sheets',
        complexity: 'Medium'
      },
      {
        name: 'Watch for new rows in Google Sheets',
        description: 'Trigger actions when new data is added to your spreadsheet',
        url: 'https://www.make.com/en/integrations/google-sheets',
        complexity: 'Simple'
      }
    ],
    zapierIntegrations: [
      {
        name: 'Create Spreadsheet Row',
        description: 'Add a new row of data to a Google Sheets spreadsheet',
        url: 'https://zapier.com/apps/google-sheets/integrations',
        complexity: 'Simple'
      },
      {
        name: 'Update Spreadsheet Row',
        description: 'Update an existing row in Google Sheets',
        url: 'https://zapier.com/apps/google-sheets/integrations',
        complexity: 'Medium'
      },
      {
        name: 'New Spreadsheet Row',
        description: 'Trigger when a new row is added to a Google Sheets spreadsheet',
        url: 'https://zapier.com/apps/google-sheets/integrations',
        complexity: 'Simple'
      }
    ]
  },
  'gmail': {
    name: 'Gmail',
    urlPatterns: [
      'mail.google.com',
      'gmail.com'
    ],
    keywords: [
      'Gmail',
      'email',
      'inbox',
      'compose',
      'message',
      'send email'
    ],
    makeIntegrations: [
      {
        name: 'Send email through Gmail',
        description: 'Automatically send emails through your Gmail account',
        url: 'https://www.make.com/en/integrations/gmail',
        complexity: 'Simple'
      },
      {
        name: 'Watch for new emails in Gmail',
        description: 'Trigger actions when new emails arrive in your inbox',
        url: 'https://www.make.com/en/integrations/gmail',
        complexity: 'Simple'
      }
    ],
    zapierIntegrations: [
      {
        name: 'Send Email',
        description: 'Send an email through your Gmail account',
        url: 'https://zapier.com/apps/gmail/integrations',
        complexity: 'Simple'
      },
      {
        name: 'New Email',
        description: 'Trigger when a new email is received in Gmail',
        url: 'https://zapier.com/apps/gmail/integrations',
        complexity: 'Simple'
      }
    ]
  },
  'shopify': {
    name: 'Shopify',
    urlPatterns: [
      'myshopify.com',
      'shopify.com/admin'
    ],
    keywords: [
      'Shopify',
      'Products',
      'Orders',
      'Customers',
      'shopify admin',
      'e-commerce',
      'store'
    ],
    makeIntegrations: [
      {
        name: 'Create a product in Shopify',
        description: 'Add a new product to your Shopify store',
        url: 'https://www.make.com/en/integrations/shopify',
        complexity: 'Medium'
      },
      {
        name: 'Watch for new orders in Shopify',
        description: 'Trigger actions when a new order is placed in your store',
        url: 'https://www.make.com/en/integrations/shopify',
        complexity: 'Simple'
      }
    ],
    zapierIntegrations: [
      {
        name: 'Create Product',
        description: 'Create a new product in your Shopify store',
        url: 'https://zapier.com/apps/shopify/integrations',
        complexity: 'Medium'
      },
      {
        name: 'New Order',
        description: 'Trigger when a new order is created in Shopify',
        url: 'https://zapier.com/apps/shopify/integrations',
        complexity: 'Simple'
      }
    ]
  },
  'airtable': {
    name: 'Airtable',
    urlPatterns: [
      'airtable.com'
    ],
    keywords: [
      'Airtable',
      'base',
      'record',
      'field',
      'table',
      'database',
      'view'
    ],
    makeIntegrations: [
      {
        name: 'Create a record in Airtable',
        description: 'Add a new record to an Airtable base',
        url: 'https://www.make.com/en/integrations/airtable',
        complexity: 'Simple'
      },
      {
        name: 'Watch for new records in Airtable',
        description: 'Trigger actions when a new record is added to Airtable',
        url: 'https://www.make.com/en/integrations/airtable',
        complexity: 'Simple'
      }
    ],
    zapierIntegrations: [
      {
        name: 'Create Record',
        description: 'Create a new record in Airtable',
        url: 'https://zapier.com/apps/airtable/integrations',
        complexity: 'Simple'
      },
      {
        name: 'New Record',
        description: 'Trigger when a new record is added to Airtable',
        url: 'https://zapier.com/apps/airtable/integrations',
        complexity: 'Simple'
      }
    ]
  }
};

/**
 * Identifies applications in Loom video content
 * @param {Object} videoData - Data from the Loom video analysis
 * @param {string} videoData.url - The Loom video URL
 * @param {string[]} [videoData.transcript] - The video transcript if available
 * @param {string[]} [videoData.visitedUrls] - URLs visited in the video
 * @param {Object[]} [videoData.chunks] - Chunks from video analysis
 * @returns {Object[]} - Array of identified applications
 */
function identifyApplications(videoData) {
  // Check if we have transcript or visited URLs to analyze
  if (!videoData || (!videoData.transcript && !videoData.visitedUrls && !videoData.chunks)) {
    return [];
  }
  
  // Track matches through different methods
  let appMatches = [];
  
  // Search for app indicators in various data sources
  // URL-based detection (highest confidence)
  const urlConfidence = 0.9;
  if (videoData.visitedUrls && videoData.visitedUrls.length > 0) {
    videoData.visitedUrls.forEach(url => {
      Object.entries(KNOWN_APPS).forEach(([appId, app]) => {
        if (app.urlPatterns && app.urlPatterns.some(pattern => 
          url.toLowerCase().includes(pattern.toLowerCase())
        )) {
          appMatches.push({
            appId,
            appName: app.name,
            confidence: urlConfidence,
            detectionMethod: 'url',
            matchedUrl: url
          });
        }
      });
    });
  }
  
  // Chunk name-based detection (medium confidence)
  const chunkConfidence = 0.7;
  if (videoData.chunks && videoData.chunks.length > 0) {
    videoData.chunks.forEach(chunk => {
      if (chunk.name) {
        Object.entries(KNOWN_APPS).forEach(([appId, app]) => {
          if (app.keywords && app.keywords.some(keyword => 
            chunk.name.toLowerCase().includes(keyword.toLowerCase())
          )) {
            appMatches.push({
              appId,
              appName: app.name,
              confidence: chunkConfidence,
              detectionMethod: 'chunk_name',
              matchedChunk: chunk.name
            });
          }
        });
      }
    });
  }
  
  // Transcript-based detection (lower confidence)
  const transcriptConfidence = 0.6;
  try {
    if (videoData.transcript) {
      let transcriptText = '';
      
      // Handle both array format and string format
      if (Array.isArray(videoData.transcript) && videoData.transcript.length > 0) {
        // Handle array of transcript objects
        transcriptText = videoData.transcript
          .filter(line => line && typeof line === 'object' && line.text)
          .map(line => line.text)
          .join(' ');
      } else if (typeof videoData.transcript === 'string') {
        // Handle string format
        transcriptText = videoData.transcript;
      } else {
        // Unknown format
        console.log('Unknown transcript format:', typeof videoData.transcript);
        transcriptText = '';
      }
      
      transcriptText = transcriptText.toLowerCase();
      
      if (transcriptText) {
        // Check transcript for application mentions
        appMatches = appMatches.concat(
          Object.entries(KNOWN_APPS)
            .filter(([_, app]) => {
              const keywords = app.keywords || [];
              return keywords.some(keyword => 
                transcriptText.includes(keyword.toLowerCase())
              );
            })
            .map(([appId, app]) => ({
              appId,
              appName: app.name,
              confidence: transcriptConfidence,
              detectionMethod: 'transcript'
            }))
        );
      }
    }
  } catch (error) {
    console.error('Error processing transcript data:', error);
    // Continue execution despite transcript error
  }
  
  // Deduplicate and sort by confidence
  const seenApps = new Set();
  return appMatches
    .sort((a, b) => b.confidence - a.confidence)
    .filter(match => {
      if (seenApps.has(match.appId)) return false;
      seenApps.add(match.appId);
      return true;
    });
}

/**
 * Generates suggestions for Make.com and Zapier integrations based on identified apps
 * @param {Object[]} identifiedApps - Apps identified in the video
 * @returns {Object} - Integration suggestions
 */
function generateIntegrationSuggestions(identifiedApps) {
  if (!identifiedApps || identifiedApps.length === 0) {
    return {
      suggestions: [],
      message: "No applications identified for integration suggestions."
    };
  }
  
  const suggestions = {
    make: [],
    zapier: [],
    message: `Identified ${identifiedApps.length} application(s) with potential integrations.`
  };
  
  identifiedApps.forEach(app => {
    // Add Make.com integrations
    if (app.makeIntegrations) {
      app.makeIntegrations.forEach(integration => {
        suggestions.make.push({
          app: app.name,
          integration: integration.name,
          description: integration.description,
          url: integration.url,
          complexity: integration.complexity,
          confidence: app.confidence
        });
      });
    }
    
    // Add Zapier integrations
    if (app.zapierIntegrations) {
      app.zapierIntegrations.forEach(integration => {
        suggestions.zapier.push({
          app: app.name,
          integration: integration.name,
          description: integration.description,
          url: integration.url,
          complexity: integration.complexity,
          confidence: app.confidence
        });
      });
    }
  });
  
  return suggestions;
}

/**
 * Analyzes a Loom video and suggests integrations
 * @param {Object} videoData - Data from the Loom video analysis
 * @returns {Object} - Apps and integration suggestions
 */
function analyzeLoomForIntegrations(videoData) {
  try {
    // Extract video-related data from chunks if available
    let enhancedVideoData = { ...videoData };
    
    if (videoData.chunks && videoData.chunks.length > 0) {
      // Extract potential URLs from chunks
      if (!enhancedVideoData.visitedUrls) {
        enhancedVideoData.visitedUrls = [];
        
        // Look for URLs in actions
        for (const chunk of videoData.chunks) {
          if (chunk.action && chunk.action.type === 'goto' && chunk.action.url) {
            enhancedVideoData.visitedUrls.push(chunk.action.url);
          }
        }
      }
    }
    
    // Identify applications in the video
    const identifiedApps = identifyApplications(enhancedVideoData);
    
    // Generate integration suggestions
    const suggestionsData = generateIntegrationSuggestions(identifiedApps);
    
    // Format suggestions for the frontend
    const suggestions = [];
    
    // Process Make.com suggestions
    if (suggestionsData.make && suggestionsData.make.length > 0) {
      suggestionsData.make.forEach(item => {
        // Check if we already have this app in our suggestions
        let suggestion = suggestions.find(s => s.appId === item.app.toLowerCase().replace(/\s+/g, '_'));
        
        if (!suggestion) {
          suggestion = {
            appId: item.app.toLowerCase().replace(/\s+/g, '_'),
            appName: item.app,
            makeDotCom: {
              serviceName: 'Make.com',
              integrationUrl: item.url,
              description: item.description
            }
          };
          suggestions.push(suggestion);
        } else if (!suggestion.makeDotCom) {
          suggestion.makeDotCom = {
            serviceName: 'Make.com',
            integrationUrl: item.url,
            description: item.description
          };
        }
      });
    }
    
    // Process Zapier suggestions
    if (suggestionsData.zapier && suggestionsData.zapier.length > 0) {
      suggestionsData.zapier.forEach(item => {
        // Check if we already have this app in our suggestions
        let suggestion = suggestions.find(s => s.appId === item.app.toLowerCase().replace(/\s+/g, '_'));
        
        if (!suggestion) {
          suggestion = {
            appId: item.app.toLowerCase().replace(/\s+/g, '_'),
            appName: item.app,
            zapier: {
              serviceName: 'Zapier',
              integrationUrl: item.url,
              description: item.description
            }
          };
          suggestions.push(suggestion);
        } else if (!suggestion.zapier) {
          suggestion.zapier = {
            serviceName: 'Zapier',
            integrationUrl: item.url,
            description: item.description
          };
        }
      });
    }
    
    // Generate default suggestions for identified apps with no specific suggestions
    identifiedApps.forEach(app => {
      const appId = app.appId;
      const appName = app.appName;
      
      // Check if we already have suggestions for this app
      let existing = suggestions.find(s => s.appId === appId);
      
      if (!existing) {
        // Create default suggestions for this app
        const suggestion = {
          appId,
          appName,
        };
        
        // Add default Make.com suggestion
        suggestion.makeDotCom = {
          serviceName: 'Make.com',
          integrationUrl: `https://www.make.com/en/integrations?q=${encodeURIComponent(appName)}`,
          description: `Replace manual ${appName} tasks with automated workflows`
        };
        
        // Add default Zapier suggestion
        suggestion.zapier = {
          serviceName: 'Zapier',
          integrationUrl: `https://zapier.com/apps?q=${encodeURIComponent(appName)}`,
          description: `Connect ${appName} with thousands of other apps`
        };
        
        suggestions.push(suggestion);
      }
    });
    
    return {
      identifiedApps,
      suggestions
    };
  } catch (error) {
    console.error("Error in integration suggestions:", error);
    // Return empty results on error
    return {
      identifiedApps: [],
      suggestions: []
    };
  }
}

module.exports = {
  analyzeLoomForIntegrations,
  identifyApplications,
  generateIntegrationSuggestions,
  KNOWN_APPS
}; 