
from playwright.sync_api import sync_playwright

def verify_ai_modal_accessibility():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use reduced motion to match potential test environment settings
        context = browser.new_context(
            viewport={'width': 1280, 'height': 720},
            reduced_motion='reduce'
        )
        page = context.new_page()

        # 1. Navigate to the app
        print("Navigating to app...")
        page.goto("http://localhost:5173")

        # 2. Bypass VisualLanding if present
        print("Bypassing VisualLanding...")
        page.evaluate("localStorage.setItem('dogtale-landing-seen', 'true')")
        page.reload()

        # Wait for the main content to load
        page.wait_for_selector('button[aria-label="Open AI chat"]')

        # 3. Open AI Modal
        print("Opening AI Modal...")
        page.get_by_label("Open AI chat").click()

        # Wait for modal to appear
        page.wait_for_selector('div[role="dialog"]')

        # 4. Check for accessibility attributes
        print("Checking accessibility attributes...")

        # Check Chat History container
        chat_history = page.locator('div[aria-label="Chat history"]')
        if chat_history.count() > 0:
            print("✅ Chat history container found with aria-label")
            role = chat_history.get_attribute("role")
            aria_live = chat_history.get_attribute("aria-live")
            print(f"   Role: {role}, Aria-live: {aria_live}")
        else:
            print("❌ Chat history container NOT found")

        # 5. Type a message to see typing indicator
        print("Sending message to trigger typing indicator...")
        page.get_by_label("Message input").fill("Hello")
        page.get_by_label("Send message").click()

        # Wait a brief moment for state update
        page.wait_for_timeout(100)

        # Check typing indicator
        typing_indicator = page.locator('div[role="status"]')
        if typing_indicator.count() > 0:
            print("✅ Typing indicator found with role='status'")
            sr_text = typing_indicator.locator("span.sr-only").text_content()
            print(f"   Screen reader text: '{sr_text}'")
        else:
            print("❌ Typing indicator NOT found")

        # 6. Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/ai_modal_a11y.png")

        browser.close()

if __name__ == "__main__":
    try:
        verify_ai_modal_accessibility()
        print("Verification script completed successfully.")
    except Exception as e:
        print(f"Error: {e}")
