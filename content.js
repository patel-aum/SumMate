console.log('Content script loaded');

let summarizeButton;
let buttonAdded = false;
let sidePanel;

class SidePanel {
  constructor() {
    this.panel = null;
    this.currentVideoId = null;
    this.currentTranscript = null;
    this.videoMetadata = null;
  }

  create() {
    if (document.getElementById('summary-side-panel')) {
      return;
    }

    this.panel = document.createElement('div');
    this.panel.id = 'summary-side-panel';
    this.panel.innerHTML = `
      <div class="panel-header">
        <h2>Video Summary</h2>
        <div class="format-buttons">
          <button class="format-btn" data-format="paragraph">Paragraph</button>
          <button class="format-btn" data-format="bullets">Bullets</button>
          <button class="format-btn" data-format="detailed">Detailed</button>
        </div>
        <button class="close-btn">✕</button>
      </div>
      <div class="panel-content">
        <div id="summary-content"></div>
        <div class="action-buttons">
          <button id="save-summary" class="save-btn">Save Summary</button>
        </div>
      </div>
    `;

    this.applyStyles();
    this.attachEventListeners();
    document.body.appendChild(this.panel);
  }

  applyStyles() {
    const styles = document.createElement('style');
    styles.textContent = `
      #summary-side-panel {
        position: fixed;
        right: -450px;
        top: 56px;
        width: 450px;
        height: calc(100vh - 56px);
        background: var(--yt-spec-base-background);
        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
        z-index: 2000;
        transition: right 0.3s ease;
        display: flex;
        flex-direction: column;
        border-left: 1px solid var(--yt-spec-10-percent-layer);
        font-family: "YouTube Sans", Roboto, Arial, sans-serif;
      }

      .panel-header {
        padding: 16px;
        border-bottom: 1px solid var(--yt-spec-10-percent-layer);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .panel-header h2 {
        margin: 0;
        font-size: 20px;
        color: var(--yt-spec-text-primary);
        font-weight: 500;
      }

      .format-buttons {
        display: flex;
        gap: 8px;
      }

      .format-btn {
        padding: 8px 16px;
        border: 1px solid var(--yt-spec-10-percent-layer);
        border-radius: 20px;
        background: transparent;
        color: var(--yt-spec-text-primary);
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }

      .format-btn:hover {
        background: var(--yt-spec-badge-chip-background);
      }

      .format-btn.active {
        background: var(--yt-spec-brand-button-background);
        color: white;
        border-color: transparent;
      }

      .close-btn {
        position: absolute;
        right: 16px;
        top: 16px;
        background: none;
        border: none;
        color: var(--yt-spec-text-secondary);
        cursor: pointer;
        padding: 8px;
        font-size: 18px;
      }

      .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      #summary-content {
        font-size: 16px;
        line-height: 1.6;
        color: var(--yt-spec-text-primary);
        white-space: pre-wrap;
      }

      #summary-content h1 {
        font-size: 24px;
        margin-bottom: 16px;
        font-weight: bold;
      }

      #summary-content h2 {
        font-size: 20px;
        margin: 16px 0;
        font-weight: bold;
      }

      #summary-content ul {
        margin: 12px 0;
        padding-left: 24px;
      }

      #summary-content li {
        margin: 8px 0;
      }

      .action-buttons {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
      }

      .save-btn {
        background: var(--yt-spec-brand-button-background);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.2s;
      }

      .save-btn:hover {
        background: var(--yt-spec-brand-button-background-hover);
      }

      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        color: var(--yt-spec-text-secondary);
      }
      
      .loading:after {
        content: '...';
        animation: dots 1.5s steps(5, end) infinite;
      }
      
      @keyframes dots {
        0%, 20% { content: '.'; }
        40% { content: '..'; }
        60% { content: '...'; }
        80%, 100% { content: ''; }
      }
    `;
    document.head.appendChild(styles);
  }

  
  attachEventListeners() {
    const closeBtn = this.panel.querySelector('.close-btn');
    closeBtn.onclick = () => this.toggle(false);

    const formatBtns = this.panel.querySelectorAll('.format-btn');
    formatBtns.forEach(btn => {
      btn.onclick = () => this.handleFormatChange(btn.dataset.format);
    });

    const saveBtn = this.panel.querySelector('#save-summary');
    saveBtn.onclick = () => this.handleSave();
  }

  formatMarkdown(text) {
    let html = text;
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gm, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    return html;
  }

  async handleFormatChange(format) {
    if (!this.currentTranscript) return;
  
    const buttons = this.panel.querySelectorAll('.format-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.format === format);
    });
  
    const content = this.panel.querySelector('#summary-content');
    content.innerHTML = '<div class="loading">Generating summary...</div>';
  
    const prompts = {
      paragraph: `Create a concise paragraph summary of the content. Format in Markdown with appropriate emphasis using ** for important points. Focus on the main points and key takeaways. Be clear and engaging. Ignore any calls to action like subscribing or liking.`,
      bullets: `Create a bullet-point summary of the main points. Format in Markdown with:
      # Main Points
      * Key points with **emphasis** on important terms
      * Important details as sub-points
      * Clear and concise language
      Ignore any calls to action like subscribing or liking.`,
      detailed: `Create a detailed summary with sections in Markdown:
      # Video Summary
      ## Key Points
      * Important details with **emphasis**
      ## Detailed Analysis
      Comprehensive overview with **key terms** highlighted
      Ignore any calls to action like subscribing or liking.`
    };
  
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'summarize',
        data: {
          transcript: this.currentTranscript,
          prompt: prompts[format]
        }
      });
  
      if (response && response.summary) {
        const formattedContent = this.formatMarkdown(response.summary);
        this.updateContent(formattedContent);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error in handleFormatChange:', error);
      content.innerHTML = '<div class="error">Failed to generate summary. Please try again.</div>';
    }
  }

  async handleSave() {
    if (!this.currentVideoId) return;

    const content = document.getElementById('summary-content');
    const activeFormat = this.panel.querySelector('.format-btn.active');
    
    if (content && activeFormat) {
      try {
        await chrome.storage.local.set({
          [`note_${this.currentVideoId}`]: {
            content: content.innerHTML,
            type: activeFormat.dataset.format,
            timestamp: Date.now()
          }
        });

        const saveBtn = this.panel.querySelector('#save-summary');
        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
          saveBtn.textContent = 'Save Summary';
        }, 2000);
      } catch (error) {
        console.error('Error saving note:', error);
      }
    }
  }

  toggle(show) {
    if (this.panel) {
      this.panel.style.right = show ? '0' : '-450px';
    }
  }

  updateContent(summary) {
    const content = this.panel.querySelector('#summary-content');
    if (content) {
      content.innerHTML = summary;
    }
  }

  setVideoContext(videoId, transcript) {
    this.currentVideoId = videoId;
    this.currentTranscript = transcript;
  }
}

const TranscriptManager = {
  async retrieveTranscript() {
    const videoId = new URLSearchParams(window.location.search).get('v');
    if (!videoId) {
      throw new Error('No video ID found');
    }

    try {
      const player = await this.getPlayerData(videoId);
      const metadata = this.extractMetadata(player, videoId);
      const transcript = await this.extractTranscript(player);

      await chrome.storage.local.set({
        [`metadata_${videoId}`]: metadata
      });

      return {
        transcript,
        metadata
      };
    } catch (error) {
      console.error('Transcript extraction error:', error);
      throw error;
    }
  },

  async getPlayerData(videoId) {
    const YT_INITIAL_PLAYER_RESPONSE_RE = /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+(?:meta|head)|<\/script|\n)/;
    
    let player = window.ytInitialPlayerResponse;
    
    if (!player) {
      const response = await fetch('https://www.youtube.com/watch?v=' + videoId);
      const body = await response.text();
      const playerResponse = body.match(YT_INITIAL_PLAYER_RESPONSE_RE);
      if (!playerResponse) {
        throw new Error('Unable to parse playerResponse');
      }
      player = JSON.parse(playerResponse[1]);
    }

    return player;
  },

  extractMetadata(player, videoId) {
    return {
      title: player.videoDetails.title,
      duration: player.videoDetails.lengthSeconds,
      author: player.videoDetails.author,
      views: player.videoDetails.viewCount,
      videoId: videoId,
      timestamp: Date.now()
    };
  },

  async extractTranscript(player) {
    if (!player.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length) {
      throw new Error('No captions available for this video');
    }

    const tracks = player.captions.playerCaptionsTracklistRenderer.captionTracks;
    tracks.sort((a, b) => {
      if (a.languageCode === 'en' && b.languageCode !== 'en') return -1;
      if (a.languageCode !== 'en' && b.languageCode === 'en') return 1;
      if (a.kind !== 'asr' && b.kind === 'asr') return -1;
      if (a.kind === 'asr' && b.kind !== 'asr') return 1;
      return 0;
    });

    const transcriptResponse = await fetch(tracks[0].baseUrl + '&fmt=json3');
    const transcript = await transcriptResponse.json();

    return transcript.events
      .filter(x => x.segs)
      .map(x => x.segs.map(y => y.utf8).join(' '))
      .join(' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
};

const UIManager = {
  createButton() {
    if (buttonAdded || document.getElementById('yt-summary-btn')) {
      return;
    }

    const rightControls = document.querySelector('.ytp-right-controls');
    if (!rightControls) {
      return;
    }

    summarizeButton = document.createElement('button');
    summarizeButton.id = 'yt-summary-btn';
    summarizeButton.innerHTML = 'Summarize';
    summarizeButton.style.cssText = `
  background: var(--yt-spec-brand-button-background);
  color: var(--yt-spec-static-brand-white);
  border: none;
  padding: 10px 16px;
  border-radius: 18px;
  margin: 8px;
  cursor: pointer;
  font-family: "YouTube Sans", Roboto, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  position: absolute;
  top: 0px;  /* Adjust this to align with the Subscribe button */
  right: 300px;  /* Adjust this to place it near the Subscribe button */
  z-index: 10;  /* Ensure it stays on top */
    `;

    summarizeButton.addEventListener('mouseover', () => {
      summarizeButton.style.background = 'var(--yt-spec-brand-button-background-hover)';
    });

    summarizeButton.addEventListener('mouseout', () => {
      summarizeButton.style.background = 'var(--yt-spec-brand-button-background)';
    });

    summarizeButton.addEventListener('click', this.handleClick);

    // Insert the button right before the fullscreen button
    const fullscreenButton = rightControls.querySelector('.ytp-fullscreen-button');
    if (fullscreenButton) {
      rightControls.insertBefore(summarizeButton, fullscreenButton);
    } else {
      rightControls.appendChild(summarizeButton);
    }

    buttonAdded = true;
    sidePanel = new SidePanel();
    sidePanel.create();
  },


  async handleClick() {
    try {
      UIManager.updateButtonState('disabled', 'Getting transcript...');

      const aiCapabilities = await chrome.runtime.sendMessage({ action: 'checkAICapabilities' });
      if (aiCapabilities.available === 'no') {
        throw new Error('AI summarization not available');
      }

      const result = await TranscriptManager.retrieveTranscript();
      if (result) {
        UIManager.updateButtonState('disabled', 'Summarizing...');
        
        // Set video context in side panel
        sidePanel.setVideoContext(result.metadata.videoId, result.transcript);
        
        // Trigger paragraph format by default
        const paragraphBtn = document.querySelector('.format-btn[data-format="paragraph"]');
        if (paragraphBtn) {
          paragraphBtn.click();
        }

        sidePanel.toggle(true);
        UIManager.updateButtonState('enabled', 'Summarized!');
      }
    } catch (error) {
      console.error('Process failed:', error);
      UIManager.updateButtonState('enabled', error.message === 'AI summarization not available' ? 'AI Not Available' : 'Failed');
    } finally {
      setTimeout(() => {
        UIManager.updateButtonState('enabled', 'Summarize');
      }, 2000);
    }
  },

  updateButtonState(state, message) {
    if (summarizeButton) {
      summarizeButton.innerHTML = message;
      summarizeButton.disabled = state === 'disabled';
      summarizeButton.style.opacity = state === 'disabled' ? '0.7' : '1';
    }
  }
};

// Initialize page observer
const PageObserver = {
  init() {
    const observer = new MutationObserver(() => {
      if (!buttonAdded && window.location.pathname === '/watch') {
        this.debouncedCreateButton();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    if (window.location.pathname === '/watch') {
      this.debouncedCreateButton();
    }
  },

  debouncedCreateButton: debounce(() => {
    if (window.location.pathname === '/watch' && !buttonAdded) {
      UIManager.createButton();
    }
  }, 250)
};

function loadMarkedJS() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.2/marked.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}


// Utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize
PageObserver.init();