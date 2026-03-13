/* Replaced JS with a single clean fetch + parser */
function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    // ignore blank lines and comment/filepath lines that sometimes appear in attachments
    .filter(line => line !== "" && !line.startsWith("//") && !line.startsWith("#") && !/filepath:/i.test(line))
    .map(line => line.split(",").map(cell => cell.trim()));
}

fetch("datamc.csv")
  .then(response => {
    if (!response.ok) throw new Error("Network response was not ok");
    return response.text();
  })
  .then(text => {
    const table = parseCsv(text);
    const container = document.getElementById("leaderboard");
    if (!container) {
      console.error("No #leaderboard element found in the page.");
      return;
    }

    if (!table || table.length === 0) {
      container.innerHTML = "<p style='color:#f66'>No data found in datamc.csv. Check file contents and that the file is served over HTTP.</p>";
      return;
    }

    // find header row (if any) by looking for a cell that contains "username"
    const headerIndex = table.findIndex(row => row.some(cell => /username/i.test(cell)));
    let dataRows = headerIndex >= 0 ? table.slice(headerIndex + 1) : table;

    // remove any empty rows just in case
    dataRows = dataRows.filter(r => r && r.length > 0 && r.some(c => c !== ""));

    if (dataRows.length === 0) {
      container.innerHTML = "<p style='color:#f66'>No data rows found after header removal.</p>";
      return;
    }

    container.innerHTML = "";

    // sort by position column (index 3) numeric when possible
    dataRows.sort((a, b) => {
      const pa = Number(a[3]) || 0;
      const pb = Number(b[3]) || 0;
      return pa - pb;
    });

    dataRows.forEach(cols => {
      if (!cols || cols.length < 1) return;
      const username = cols[0] || "";
      const rank = cols[1] || "";
      const kills = cols[2] || "";
      const position = cols[3] || "";

      if (!username) return;

      const avatar = `https://minotar.net/avatar/${encodeURIComponent(username)}`;

      const card = document.createElement("div");
      card.className = "player-card";

      card.innerHTML = `
        <img src="${avatar}" class="avatar" alt="${username}">
        <div class="info">
          <h2>${rank}</h2>
          <p><b>${username}</b></p>
          <p>Position: ${position}</p>
          <p>Kills: ${kills}</p>
        </div>
      `;

      container.appendChild(card);
    });
  })
  .catch(error => {
    console.error("Error loading CSV:", error);
    const container = document.getElementById("leaderboard");
    if (container) {
      container.innerHTML = "<p style='color:#f66'>Failed to load datamc.csv. If you opened the HTML file via file:// the browser blocks fetch — run a local server (see instructions).</p>";
    }
  });