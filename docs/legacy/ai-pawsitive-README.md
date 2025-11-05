# AI Pawsitive Dog Care Schedule

This is a simple web application that helps you manage your dog's daily care schedule.

## Setup

1.  Create a `config.js` file in the root of the project.
2.  Add the following content to `config.js`:

    ```javascript
    const API_KEY = "YOUR_GEMINI_API_KEY";
    ```

3.  Replace `"YOUR_GEMINI_API_KEY"` with your actual Gemini API key.
4.  Open `ai-pawsitive-dog-care-schedule.html` in your browser.

## ⚠️ Security Note

**This archived application exposes API keys in client-side code, which is a security risk.** This approach was used in an early prototype and is preserved here for historical reference only. 

For production applications, use:
- Environment variables with server-side API calls
- API proxy servers to hide keys
- OAuth or other secure authentication mechanisms

Do not use this pattern in production code.
