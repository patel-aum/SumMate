// popup.js
document.addEventListener('DOMContentLoaded', () => {
  loadSummaries();
  
  document.getElementById('refresh-btn')?.addEventListener('click', loadSummaries);
  document.getElementById('clear-all-btn')?.addEventListener('click', clearAll);
});

async function loadSummaries() {
  const container = document.getElementById('summaries-container');
  const emptyState = document.getElementById('empty-state');
  
  if (!container || !emptyState) {
    console.error('Required DOM elements not found');
    return;
  }

  try {
    const storage = await chrome.storage.local.get(null);
    const items = Object.entries(storage)
      .filter(([key]) => key.startsWith('note_'))
      .map(([key, value]) => ({
        videoId: key.replace('note_', ''),
        ...value
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

    if (items.length === 0) {
      showEmptyState(emptyState, container);
      return;
    }

    await renderSummaries(items, container, emptyState);
  } catch (error) {
    console.error('Error loading summaries:', error);
    showError(container);
  }
}



async function renderSummaries(items, container, emptyState) {
  emptyState.style.display = 'none';
  container.innerHTML = ''; // Clear container first

  for (const item of items) {
    const summaryElement = await createSummaryElement(item);
    container.insertAdjacentHTML('beforeend', summaryElement);
  }

  attachEventListeners();
}
async function createSummaryElement(data) {
  const videoData = await chrome.storage.local.get(`metadata_${data.videoId}`);
  const metadata = videoData[`metadata_${data.videoId}`] || {};

  const formattedContent = formatContent(data.content || '');

  return `
    <div class="summary-item" data-video-id="${data.videoId}">
      <div class="summary-header">
        <div class="title-container">
          <h3 class="video-title">${metadata.title || 'YouTube Video Summary'}</h3>
          <p class="channel-name">${metadata.author || ''}</p>
        </div>
        <span class="summary-type">${data.type || 'paragraph'}</span>
        <span class="toggle-icon">▼</span>
      </div>
      <div class="summary-content-wrapper collapsed">
        <div class="summary-content">
          ${formattedContent}
        </div>
        <a class="view-full-button" href="https://www.youtube.com/watch?v=${data.videoId}" target="_blank">
          Watch Video
        </a>
      </div>
    </div>
  `;
}

function formatContent(content) {
  return content
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\* (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)\n*/g, '<ul>$1</ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\n\s*\n/g, '\n')
    .replace(/<\/h[234]>\s*<ul>/g, '</h4><ul>')
    .trim();
}



async function attachEventListeners() {
  document.querySelectorAll('.summary-header').forEach(header => {
    header.addEventListener('click', (e) => {
      e.stopPropagation();

      // Get the wrapper for content
      const wrapper = header.nextElementSibling;
      const icon = header.querySelector('.toggle-icon');

      if (wrapper.classList.contains('collapsed')) {
        wrapper.classList.remove('collapsed');
        wrapper.classList.add('expanded');
        icon.textContent = '▲'; // Update the icon to indicate collapse
      } else {
        wrapper.classList.remove('expanded');
        wrapper.classList.add('collapsed');
        icon.textContent = '▼'; // Update the icon to indicate expand
      }
    });
  });
}



  
  // Handle clicking on summary items to open YouTube
  document.querySelectorAll('.summary-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.summary-header')) { // Only trigger if not clicking header
        const videoId = item.dataset.videoId;
        chrome.tabs.create({
          url: `https://www.youtube.com/watch?v=${videoId}`
        });
      }
    });
  });


function showEmptyState(emptyState, container) {
  container.innerHTML = '';
  emptyState.style.display = 'block';
  emptyState.innerHTML = `
    <p>No summaries saved yet. Watch a YouTube video and click the Summarize button to create one!</p>
  `;
}

function showError(container) {
  container.innerHTML = `
    <div class="error-state">
      <p>An error occurred while loading the summaries. Please try again.</p>
    </div>
  `;
}

async function clearAll() {
  if (!confirm('Are you sure you want to delete all saved summaries?')) {
    return;
  }

  try {
    const storage = await chrome.storage.local.get(null);
    const keys = Object.keys(storage).filter(key => 
      key.startsWith('note_') || key.startsWith('metadata_')
    );
    await chrome.storage.local.remove(keys);
    await loadSummaries();
  } catch (error) {
    console.error('Clear all failed:', error);
    showError(document.getElementById('summaries-container'));
  }
}