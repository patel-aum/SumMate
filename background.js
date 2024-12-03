// Background service worker
console.log('Background service worker started');

// Store for managing transcript and summary data
const StorageManager = {
  async saveTranscript(videoId, data) {
    try {
      await chrome.storage.local.set({
        [`transcript_${videoId}`]: {
          ...data,
          timestamp: Date.now()
        }
      });
      console.log('Transcript saved successfully');
    } catch (error) {
      console.error('Error saving transcript:', error);
      throw error;
    }
  },

  async saveSummary(videoId, data) {
    try {
      await chrome.storage.local.set({
        [`summary_${videoId}`]: {
          ...data,
          timestamp: Date.now()
        }
      });
      console.log('Summary saved successfully');
    } catch (error) {
      console.error('Error saving summary:', error);
      throw error;
    }
  }
};

// AI capabilities checker
async function checkAICapabilities() {
  console.log('Checking Chrome AI capabilities');
  try {
    const capabilities = await ai.languageModel.capabilities();
    console.log('AI capabilities:', capabilities);
    return capabilities;
  } catch (error) {
    console.error('Error checking AI capabilities:', error);
    return { available: 'no' };
  }
}

// Summary generator
async function createSummary(text, prompt) {
  console.log('Creating summary, text length:', text.length);
  try {
    const summarizer = await ai.languageModel.create({
      systemPrompt: prompt || `You are a helpful assistant that helps people with understanding what people said in simple way and in points. You are humble, creative, friendly and expressive. The videos often say things like to subscribe, follow or ask for likes neglect that part and if [music] is there then also neglect`,
    });
    
    if (!summarizer.ready) {
      console.log('Waiting for summarizer to be ready');
      await summarizer.ready;
    }

    const summary = await summarizer.prompt(text);
    console.log('Summary generated:', summary);
    return summary;
  } catch (error) {
    console.error('Summarization error:', error);
    throw error;
  }
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message.action);
  
  if (message.action === 'checkAICapabilities') {
    checkAICapabilities().then(sendResponse);
    return true;
  }
  
  if (message.action === 'summarize') {
    console.log('Processing summarization request');
    const { transcript, prompt } = message.data;
    
    createSummary(transcript, prompt)
      .then(async summary => {
        console.log('Summary created:', summary);
        sendResponse({ success: true, summary: summary });
      })
      .catch(error => {
        console.error('Summarization failed:', error);
        sendResponse({ error: error.message });
      });
    
    return true;
  }
});