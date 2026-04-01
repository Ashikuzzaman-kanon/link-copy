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
          text = txt;
        } else if (pr) {
          text = "PR #" + pr[1];
          html = `<a href='${url}'>${text}</a>`;
        } else if (jira) {
          text = `${jira[1]}: ${jira[2]}`;
          html = `<a href='${url}'>${esc(jira[1])}</a>: ${esc(jira[2])}`;
        } else {
          text = title;
          html = `<a href='${url}'>${esc(title)}</a>`;
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "text/html": new Blob([html], { type: "text/html" }),
              "text/plain": new Blob([text], { type: "text/plain" })
            })
          ]);
          console.log("Copied:", text);
        } catch {
          await navigator.clipboard.writeText(text);
        }
      }
    });
  }
});