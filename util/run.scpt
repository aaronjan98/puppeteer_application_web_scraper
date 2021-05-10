tell application "iTerm" to activate

tell application "System Events"
    key code 17 using command down
    delay 0.5
    --keystroke "node --inspect=9222 ~/Documents/dev/web_scraping/application_automation_puppeteer/web_server.js"
    keystroke "/Applications/Brave\\ Browser.app/Contents/MacOS/Brave\\ Browser --disable-web-security --remote-debugging-port=9222&"
    delay 0.5
    key code 36
    delay 0.5
    key code {18, 37} using command down
end tell
