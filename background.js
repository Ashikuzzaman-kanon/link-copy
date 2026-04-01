chrome.commands.onCommand.addListener(async (command) => {
    if (command === "copy-smart-link") {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async () => {
                // Escape HTML
                const esc = (s) =>
                    s
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");

                const title = document.title.trim();
                const url = location.href;

                // GitHub PR detection
                const pr = url.match(
                    /github\.com\/[^\/]+\/[^\/]+\/pull\/(\d+)/i,
                );
                // Jira detection (any uppercase letters + numbers)
                const jira = title.match(
                    /^\[([A-Z][A-Z0-9]+-\d+)\]\s*(.*?)\s*-\s*Jira$/i,
                );

                // Prompt for custom text (optional)
                let input = prompt(
                    "Enter custom text (leave blank for smart link):",
                );

                let htmlContent, plainContent;

                if (input && input.trim()) {
                    const txt = input.trim();
                    htmlContent = `<a href='${url}'>${esc(txt)}</a>`;
                    plainContent = txt;
                } else if (pr) {
                    plainContent = "PR #" + pr[1];
                    htmlContent = `<a href='${url}'>${plainContent}</a>`;
                } else if (jira) {
                    plainContent = `${jira[1]}: ${jira[2]}`;
                    htmlContent = `<a href='${url}'>${esc(jira[1])}</a>: ${esc(jira[2])}`;
                } else {
                    plainContent = title;
                    htmlContent = `<a href='${url}'>${esc(title)}</a>`;
                }

                // Copy to clipboard: HTML + plain text
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            "text/html": new Blob([htmlContent], {
                                type: "text/html",
                            }),
                            "text/plain": new Blob([url], {
                                type: "text/plain",
                            }),
                        }),
                    ]);
                    console.log(
                        "Copied! Ctrl+V = hyperlink, Ctrl+Shift+V = raw text:",
                        plainContent,
                    );
                } catch (err) {
                    console.warn(
                        "Clipboard write failed, fallback to plain text:",
                        err,
                    );
                    await navigator.clipboard.writeText(plainContent);
                }
            },
        });
    }
});
