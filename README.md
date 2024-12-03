# <img src="assets/128.png" alt="SumMate Icon" width="50" height="50"> SumMate Chrome Extension

Your Personal YouTube Summarizer Powered by AI
Welcome to SumMate, the Chrome extension that allows you to automatically summarize YouTube videos using the power of AI! With SumMate, you can get quick, concise summaries of videos to save time and get straight to the important points.

## 🚀 Features
- Instant Video Summarization: Get AI-generated summaries of YouTube videos in seconds.
- Easy Installation: Simple steps to set up the extension on your local machine.
- AI-Powered: Leverages the latest AI models to provide highly accurate summaries.
## 🌟 How to Install SumMate on Your Local Machine
Follow these easy steps to install SumMate and start summarizing YouTube videos.
### Step 1:

### Clone The project Using URL:

```bash
git clone https://github.com/patel-aum/SumMate.git
```

### Step 2:

- ### Navigate to your dev Chrome browser **(Currently the api Only supports Chrome Canary and Chrome Dev)**
- ### Visit chrome://extensions/

### Step 3

- ### Enable the developer mode
- ### Then Click on load unpacked and load this folder

### Step 4

- ### The Extension Will be Loaded and ready to use
- ### Just open any youtube video and start summarizing it 



## 📽️ Watch the Demo
Want to see SumMate in action? Check out the video below to get a quick overview of how the extension works!

[SumMate Demo Video]()


---


## ⚠️ Important Disclaimer & Browser Configuration 
For SumMate to function correctly, certain experimental flags must be enabled in your browser. Please follow the instructions below to set them up.
- Enables optimization guide on device -> Enabled BypassPerfRequirement
- Prompt API for Gemini Nano -> Enabled
- Summarization API for Gemini Nano -> Enabled

for detailed instruction regarding flags,visit https://developer.chrome.com/docs/extensions/ai/prompt-api#add_support_to_localhost and https://developer.chrome.com/docs/ai/summarizer-api#add_support_to_localhost

For using the Ai explainer and planner ,please make sure that the model is downloaded on your local machine
**refer https://developer.chrome.com/docs/extensions/ai/prompt-api#model_download for more infor on how to download the model**

for using the Summarizer ,please make sure summariser model is downloaded on your local machine
**refer https://developer.chrome.com/docs/ai/summarizer-api#model-download for more info on how to download the model**
