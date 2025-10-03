import type { StatisticsService } from '../services/statistics-service';
import type { EmoteService } from '../services/emote-service';

/**
 * Web dashboard server
 */
export class DashboardServer {
  private server: any;

  constructor(
    private statisticsService: StatisticsService,
    private emoteService: EmoteService,
    private port: number = 3000
  ) {}

  /**
   * Starts the web server
   */
  start(): void {
    this.server = Bun.serve({
      port: this.port,
      fetch: (req) => this.handleRequest(req),
    });

    console.log(`[Dashboard] Server running at http://localhost:${this.port}`);
  }

  /**
   * Handles incoming HTTP requests
   */
  private async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // API endpoint for statistics
    if (url.pathname === '/api/stats') {
      return this.handleStatsAPI();
    }

    // Main dashboard page
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(this.getHTML(), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Returns statistics as JSON with all available emotes
   */
  private handleStatsAPI(): Response {
    const stats = this.statisticsService.exportStats();

    // Enhance channel data with all available emotes (including unused ones)
    const enhancedChannels = stats.channels.map(channel => {
      const allEmotesMetadata = this.emoteService.getAllEmoteMetadata(channel.channelName);

      if (!allEmotesMetadata) {
        return channel;
      }

      // Create a map of used emotes
      const usedEmotesMap = new Map(channel.emotes.map(e => [e.emoteName, e]));

      // Merge all available emotes with usage data
      const allEmotes = Array.from(allEmotesMetadata.values()).map(metadata => {
        const usedEmote = usedEmotesMap.get(metadata.name);
        return {
          emoteName: metadata.name,
          count: usedEmote?.count || 0,
          lastUsed: usedEmote?.lastUsed || 0,
          channel: channel.channelName,
          emoteId: metadata.id,
          imageUrl: metadata.imageUrl,
          animated: metadata.animated
        };
      });

      return {
        ...channel,
        emotes: allEmotes.sort((a, b) => b.count - a.count)
      };
    });

    return new Response(JSON.stringify({
      ...stats,
      channels: enhancedChannels
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Generates the HTML dashboard
   */
  private getHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmokeyBot - Emote Statistics</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      padding: 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 40px;
    }

    h1 {
      font-size: 3rem;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .subtitle {
      font-size: 1.2rem;
      opacity: 0.9;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 25px;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }

    .stat-card h2 {
      font-size: 1.5rem;
      margin-bottom: 15px;
      color: #fff;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: #ffd700;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    .channel-section {
      margin-bottom: 40px;
    }

    .channel-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 30px;
      margin-bottom: 25px;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }

    .channel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .channel-name {
      font-size: 2rem;
      font-weight: bold;
      color: #ffd700;
      text-transform: capitalize;
    }

    .channel-stats {
      display: flex;
      gap: 30px;
      font-size: 1rem;
    }

    .channel-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .channel-stat-value {
      font-size: 1.8rem;
      font-weight: bold;
      color: #fff;
    }

    .channel-stat-label {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .emote-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }

    .emote-item {
      background: rgba(255, 255, 255, 0.1);
      padding: 15px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      transition: all 0.3s ease;
      text-decoration: none;
      color: inherit;
    }

    .emote-item:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
      cursor: pointer;
    }

    .emote-info {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .emote-image {
      width: 32px;
      height: 32px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .emote-name {
      font-weight: bold;
      font-size: 1.1rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 150px;
    }

    .emote-count {
      background: #ffd700;
      color: #333;
      padding: 5px 12px;
      border-radius: 20px;
      font-weight: bold;
      flex-shrink: 0;
    }

    .no-emote-image {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .top-emotes {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }

    .top-emotes h2 {
      font-size: 2rem;
      margin-bottom: 20px;
      text-align: center;
    }

    .loading {
      text-align: center;
      font-size: 1.5rem;
      padding: 50px;
    }

    .refresh-info {
      text-align: center;
      margin-top: 20px;
      opacity: 0.7;
      font-size: 0.9rem;
    }

    .emote-table-section {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 20px;
      margin-top: 30px;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      padding: 15px;
      user-select: none;
    }

    .table-header:hover {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }

    .table-header h3 {
      font-size: 1.5rem;
      margin: 0;
    }

    .collapse-icon {
      font-size: 1.5rem;
      transition: transform 0.3s ease;
    }

    .collapse-icon.expanded {
      transform: rotate(180deg);
    }

    .table-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    .table-content.expanded {
      max-height: none;
      margin-top: 20px;
      overflow: visible;
    }

    .table-wrapper {
      max-height: 600px;
      overflow-y: auto;
      overflow-x: auto;
      border-radius: 10px;
    }

    .table-wrapper::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    .table-wrapper::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
    }

    .table-wrapper::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 5px;
    }

    .table-wrapper::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }

    .emote-table {
      width: 100%;
      border-collapse: collapse;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      overflow: hidden;
    }

    .emote-table thead {
      background: rgba(255, 255, 255, 0.15);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .emote-table th {
      padding: 12px;
      text-align: left;
      font-weight: bold;
      cursor: pointer;
      user-select: none;
      position: relative;
      background: rgba(255, 255, 255, 0.15);
    }

    .emote-table th:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .emote-table th.sortable::after {
      content: '↕';
      margin-left: 5px;
      opacity: 0.5;
    }

    .emote-table th.sorted-asc::after {
      content: '↑';
      opacity: 1;
    }

    .emote-table th.sorted-desc::after {
      content: '↓';
      opacity: 1;
    }

    .emote-table td {
      padding: 10px 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .emote-table tr:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .emote-table-row {
      transition: background 0.2s ease;
    }

    .emote-table-image {
      width: 28px;
      height: 28px;
      object-fit: contain;
      vertical-align: middle;
    }

    .emote-table-link {
      color: #ffd700;
      text-decoration: none;
      font-weight: bold;
    }

    .emote-table-link:hover {
      text-decoration: underline;
    }

    .table-stats {
      padding: 10px 15px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      margin-bottom: 15px;
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .table-stat-item {
      display: flex;
      flex-direction: column;
    }

    .table-stat-label {
      font-size: 0.85rem;
      opacity: 0.8;
    }

    .table-stat-value {
      font-size: 1.2rem;
      font-weight: bold;
      color: #ffd700;
    }

    .auto-refresh-control {
      background: rgba(255, 255, 255, 0.1);
      padding: 15px 20px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s ease;
    }

    .auto-refresh-control:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .auto-refresh-control input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .auto-refresh-control label {
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .auto-refresh-status {
      font-size: 0.9rem;
      opacity: 0.8;
      margin-left: auto;
    }

    @media (max-width: 768px) {
      h1 {
        font-size: 2rem;
      }

      .channel-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .emote-list {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔥 SmokeyBot Dashboard 🔥</h1>
      <div class="subtitle">7TV Emote Statistics Tracker</div>
    </header>

    <div id="loading" class="loading">Loading statistics...</div>
    <div id="content" style="display: none;">
      <div class="auto-refresh-control" onclick="toggleAutoRefresh()">
        <input type="checkbox" id="autoRefreshCheckbox" checked>
        <label for="autoRefreshCheckbox">Auto-Refresh (Every 5 seconds)</label>
        <span class="auto-refresh-status" id="autoRefreshStatus">Enabled</span>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <h2>Total Messages</h2>
          <div class="stat-value" id="totalMessages">0</div>
        </div>
        <div class="stat-card">
          <h2>Total Emotes Used</h2>
          <div class="stat-value" id="totalEmotes">0</div>
        </div>
        <div class="stat-card">
          <h2>Channels Tracked</h2>
          <div class="stat-value" id="totalChannels">0</div>
        </div>
      </div>

      <div class="top-emotes">
        <h2>🏆 Top Emotes (All Channels)</h2>
        <div class="emote-list" id="topEmotes"></div>
      </div>

      <div class="channel-section" id="channels"></div>

      <div id="emoteTables"></div>

      <div class="refresh-info">
        Auto-refreshing every 5 seconds • Last updated: <span id="lastUpdated">Never</span>
      </div>
    </div>
  </div>

  <script>
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        updateDashboard(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }

    function updateDashboard(data) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';

      // Calculate totals
      const totalMessages = data.channels.reduce((sum, ch) => sum + ch.totalMessages, 0);
      const totalEmotes = data.channels.reduce((sum, ch) => sum + ch.totalEmotesUsed, 0);

      document.getElementById('totalMessages').textContent = totalMessages.toLocaleString();
      document.getElementById('totalEmotes').textContent = totalEmotes.toLocaleString();
      document.getElementById('totalChannels').textContent = data.channels.length;

      // Helper function to render an emote item
      function renderEmote(emote) {
        const hasMetadata = emote.emoteId && emote.imageUrl;
        const emoteLink = hasMetadata ? \`https://7tv.app/emotes/\${emote.emoteId}\` : '#';
        const imageHtml = hasMetadata
          ? \`<img src="\${emote.imageUrl}" alt="\${emote.emoteName}" class="emote-image" loading="lazy">\`
          : \`<div class="no-emote-image">?</div>\`;

        // Truncate long emote names (over 8 chars)
        const displayName = emote.emoteName.length > 8
          ? emote.emoteName.substring(0, 8) + '...'
          : emote.emoteName;

        const wrapper = hasMetadata ? 'a' : 'div';
        const linkAttrs = hasMetadata ? \`href="\${emoteLink}" target="_blank" rel="noopener noreferrer"\` : '';
        const titleAttr = emote.emoteName.length > 8 ? \`title="\${emote.emoteName}"\` : '';

        return \`
          <\${wrapper} class="emote-item" \${linkAttrs} \${titleAttr}>
            <div class="emote-info">
              \${imageHtml}
              <span class="emote-name">\${displayName}</span>
            </div>
            <span class="emote-count">\${emote.count}</span>
          </\${wrapper}>
        \`;
      }

      // Update top emotes
      const topEmotesEl = document.getElementById('topEmotes');
      topEmotesEl.innerHTML = data.topEmotes.map(renderEmote).join('');

      // Update channel sections
      const channelsEl = document.getElementById('channels');
      channelsEl.innerHTML = data.channels.map(channel => \`
        <div class="channel-card">
          <div class="channel-header">
            <div class="channel-name">#\${channel.channelName}</div>
            <div class="channel-stats">
              <div class="channel-stat">
                <div class="channel-stat-value">\${channel.totalMessages.toLocaleString()}</div>
                <div class="channel-stat-label">Messages</div>
              </div>
              <div class="channel-stat">
                <div class="channel-stat-value">\${channel.totalEmotesUsed.toLocaleString()}</div>
                <div class="channel-stat-label">Emotes</div>
              </div>
            </div>
          </div>
          <div class="emote-list">
            \${channel.emotes.slice(0, 10).map(renderEmote).join('')}
          </div>
        </div>
      \`).join('');

      // Store latest data and update emote tables
      latestChannelData = data.channels;
      renderEmoteTables(data.channels);

      // Update timestamp
      document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
    }

    // State for collapsed tables
    const tableStates = {};

    function renderEmoteTables(channels) {
      const tablesContainer = document.getElementById('emoteTables');

      tablesContainer.innerHTML = channels.map(channel => {
        const channelId = channel.channelName;
        const isExpanded = tableStates[channelId] || false;
        const usedEmotes = channel.emotes.filter(e => e.count > 0);
        const unusedCount = channel.emotes.length - usedEmotes.length;

        // Only render table contents if expanded (performance optimization)
        const tableContent = isExpanded
          ? \`
              <div class="table-stats">
                <div class="table-stat-item">
                  <span class="table-stat-label">Total Emotes</span>
                  <span class="table-stat-value">\${channel.emotes.length}</span>
                </div>
                <div class="table-stat-item">
                  <span class="table-stat-label">Used</span>
                  <span class="table-stat-value">\${usedEmotes.length}</span>
                </div>
                <div class="table-stat-item">
                  <span class="table-stat-label">Unused</span>
                  <span class="table-stat-value">\${unusedCount}</span>
                </div>
              </div>
              <div class="table-wrapper">
                <table class="emote-table" id="emote-table-\${channelId}">
                  <thead>
                    <tr>
                      <th class="sortable" onclick="sortTable('\${channelId}', 'preview')">Preview</th>
                      <th class="sortable" onclick="sortTable('\${channelId}', 'name')">Name</th>
                      <th class="sortable sorted-desc" onclick="sortTable('\${channelId}', 'count')">Uses</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody id="table-body-\${channelId}">
                    \${channel.emotes.map(emote => renderTableRow(emote)).join('')}
                  </tbody>
                </table>
              </div>
            \`
          : '<p style="text-align: center; padding: 20px; opacity: 0.7;">Click to expand and view all emotes</p>';

        return \`
          <div class="emote-table-section">
            <div class="table-header" onclick="toggleTable('\${channelId}')">
              <h3>📊 All Emotes for #\${channel.channelName} (\${channel.emotes.length} total)</h3>
              <span class="collapse-icon \${isExpanded ? 'expanded' : ''}">▼</span>
            </div>
            <div class="table-content \${isExpanded ? 'expanded' : ''}" id="table-\${channelId}">
              \${tableContent}
            </div>
          </div>
        \`;
      }).join('');
    }

    function renderTableRow(emote) {
      const hasMetadata = emote.emoteId && emote.imageUrl;
      const imageHtml = hasMetadata
        ? \`<img src="\${emote.imageUrl}" alt="\${emote.emoteName}" class="emote-table-image" loading="lazy">\`
        : '❓';
      const linkHtml = hasMetadata
        ? \`<a href="https://7tv.app/emotes/\${emote.emoteId}" target="_blank" rel="noopener noreferrer" class="emote-table-link">View</a>\`
        : '-';

      return \`
        <tr class="emote-table-row">
          <td>\${imageHtml}</td>
          <td>\${emote.emoteName}</td>
          <td><strong>\${emote.count}</strong></td>
          <td>\${linkHtml}</td>
        </tr>
      \`;
    }

    // Store the latest channel data
    let latestChannelData = [];

    function toggleTable(channelId) {
      tableStates[channelId] = !tableStates[channelId];

      // Re-render tables to update the content
      renderEmoteTables(latestChannelData);
    }

    // Sorting state
    const sortStates = {};

    function sortTable(channelId, column) {
      // Initialize sort state for this channel
      if (!sortStates[channelId]) {
        sortStates[channelId] = { column: 'count', direction: 'desc' };
      }

      // Toggle direction if same column, otherwise default to desc
      if (sortStates[channelId].column === column) {
        sortStates[channelId].direction = sortStates[channelId].direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortStates[channelId].column = column;
        sortStates[channelId].direction = column === 'count' ? 'desc' : 'asc';
      }

      // Get the current data for this channel
      const tableBody = document.getElementById('table-body-' + channelId);
      const rows = Array.from(tableBody.querySelectorAll('tr'));

      // Extract emote data from rows
      const emotes = rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
          row: row,
          name: cells[1].textContent,
          count: parseInt(cells[2].textContent) || 0
        };
      });

      // Sort
      emotes.sort((a, b) => {
        let comparison = 0;
        if (column === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (column === 'count') {
          comparison = a.count - b.count;
        }
        return sortStates[channelId].direction === 'asc' ? comparison : -comparison;
      });

      // Re-render
      tableBody.innerHTML = '';
      emotes.forEach(emote => tableBody.appendChild(emote.row));

      // Update header styles
      const table = document.getElementById('emote-table-' + channelId);
      const headers = table.querySelectorAll('th');
      headers.forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
      });

      const columnIndex = column === 'name' ? 1 : (column === 'count' ? 2 : 0);
      const activeHeader = headers[columnIndex];
      activeHeader.classList.add(sortStates[channelId].direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }

    // Auto-refresh management
    let autoRefreshEnabled = true;
    let refreshInterval = null;

    function toggleAutoRefresh() {
      const checkbox = document.getElementById('autoRefreshCheckbox');
      const status = document.getElementById('autoRefreshStatus');

      autoRefreshEnabled = checkbox.checked;
      status.textContent = autoRefreshEnabled ? 'Enabled' : 'Disabled';

      if (autoRefreshEnabled) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    }

    function startAutoRefresh() {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      refreshInterval = setInterval(() => {
        if (autoRefreshEnabled) {
          fetchStats();
        }
      }, 5000);
    }

    function stopAutoRefresh() {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    }

    // Make sure checkbox click also toggles
    document.addEventListener('DOMContentLoaded', () => {
      const checkbox = document.getElementById('autoRefreshCheckbox');
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          toggleAutoRefresh();
        });
      }
    });

    // Initial fetch
    fetchStats();

    // Start auto-refresh
    startAutoRefresh();
  </script>
</body>
</html>`;
  }

  /**
   * Stops the web server
   */
  stop(): void {
    if (this.server) {
      this.server.stop();
      console.log('[Dashboard] Server stopped');
    }
  }
}
