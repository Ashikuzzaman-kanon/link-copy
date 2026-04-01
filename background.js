chrome.commands.onCommand.addListener(async (command) => {
  if (command === "copy-smart-link") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

        const title = document.title.trim();
        const url = location.href;

        const pr = url.match(/github\.com\/[^\/]+\/[^\/]+\/pull\/(\d+)/i);
        const jira = title.match(/^\[([A-Z][A-Z0-9]+-\d+)\]\s*(.*?)\s*-\s*Jira$/i);

        let input = prompt("Enter custom text (leave blank for smart link):");

        let html, text;

        if (input && input.trim()) {
          const txt = input.trim();
          html = `<a href='${url}'>${esc(txt)}</a>`;
          text = txt; // Only for console/fallback
        } else if (pr) {
          html = `<a href='${url}'>PR #${pr[1]}</a>`;
          text = `PR #${pr[1]}`;
        } else if (jira) {
          html = `<a href='${url}'>${esc(jira[1])}</a>: ${esc(jira[2])}`;
          text = `${jira[1]}: ${jira[2]}`;
        } else {
          html = `<a href='${url}'>${esc(title)}</a>`;
          text = title;
        }

        // Clipboard: HTML = hyperlink, Plain = URL
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "text/html": new Blob([html], { type: "text/html" }),
              "text/plain": new Blob([url], { type: "text/plain" }) // <-- raw URL here
            })
          ]);
          console.log("Copied! Ctrl+V = hyperlink, Ctrl+Shift+V = URL");
        } catch {
          await navigator.clipboard.writeText(url); // fallback plain URL
        }
      }
    });
  }
});