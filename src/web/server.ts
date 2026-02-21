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
        headers: {
          'Content-Type': 'text/html',
          'Content-Security-Policy': "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' https://cdn.7tv.app; connect-src 'self'",
        },
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
          count: usedEmote?.count ?? 0,
          lastUsed: usedEmote?.lastUsed ?? 0,
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
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="data:,">
  <title>SmokeyBot - Emote Statistics</title>
  <script>(function(){var t=localStorage.getItem('smokeybot-theme');if(t!=='dark'&&t!=='light')t='dark';document.documentElement.setAttribute('data-theme',t);document.documentElement.classList.add('no-transition');})()</script>
  <style>
    :root {
      --font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      --font-size-xs: 0.75rem;
      --font-size-sm: 0.875rem;
      --font-size-base: 1rem;
      --font-size-lg: 1.125rem;
      --font-size-xl: 1.5rem;
      --font-size-2xl: 2rem;
      --space-xs: 4px;
      --space-sm: 8px;
      --space-md: 16px;
      --space-lg: 24px;
      --space-xl: 32px;
      --space-2xl: 48px;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --transition-fast: 150ms ease;
      --transition-base: 250ms ease;
      --transition-theme: 300ms ease;
      --max-width: 1400px;
    }

    html[data-theme="dark"] {
      --color-bg-primary: #0f1923;
      --color-bg-secondary: #1a2634;
      --color-bg-card: rgba(26, 38, 52, 0.85);
      --color-bg-card-hover: rgba(26, 38, 52, 0.95);
      --color-bg-elevated: rgba(255, 255, 255, 0.06);
      --color-bg-input: rgba(255, 255, 255, 0.08);
      --color-border: rgba(255, 255, 255, 0.1);
      --color-border-hover: rgba(255, 255, 255, 0.2);
      --color-text-primary: #e8edf2;
      --color-text-secondary: rgba(232, 237, 242, 0.7);
      --color-text-muted: rgba(232, 237, 242, 0.5);
      --color-accent: #3b82f6;
      --color-accent-hover: #60a5fa;
      --color-accent-muted: rgba(59, 130, 246, 0.15);
      --color-success: #66bb6a;
      --color-error: #ef5350;
      --color-badge-used: #3b82f6;
      --color-badge-unused: rgba(255, 255, 255, 0.15);
      --color-badge-text: #ffffff;
      --color-row-hover: rgba(255, 255, 255, 0.04);
      --color-scrollbar-track: rgba(255, 255, 255, 0.05);
      --color-scrollbar-thumb: rgba(255, 255, 255, 0.2);
      --color-scrollbar-thumb-hover: rgba(255, 255, 255, 0.35);
      --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.3);
      --shadow-elevated: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    html[data-theme="light"] {
      --color-bg-primary: #f5f7fa;
      --color-bg-secondary: #ffffff;
      --color-bg-card: rgba(255, 255, 255, 0.9);
      --color-bg-card-hover: rgba(255, 255, 255, 1);
      --color-bg-elevated: rgba(0, 0, 0, 0.04);
      --color-bg-input: rgba(0, 0, 0, 0.05);
      --color-border: rgba(0, 0, 0, 0.1);
      --color-border-hover: rgba(0, 0, 0, 0.2);
      --color-text-primary: #1a1a2e;
      --color-text-secondary: rgba(26, 26, 46, 0.65);
      --color-text-muted: rgba(26, 26, 46, 0.4);
      --color-accent: #2563eb;
      --color-accent-hover: #3b82f6;
      --color-accent-muted: rgba(37, 99, 235, 0.1);
      --color-success: #16a34a;
      --color-error: #dc2626;
      --color-badge-used: #2563eb;
      --color-badge-unused: rgba(0, 0, 0, 0.08);
      --color-badge-text: #ffffff;
      --color-row-hover: rgba(0, 0, 0, 0.03);
      --color-scrollbar-track: rgba(0, 0, 0, 0.05);
      --color-scrollbar-thumb: rgba(0, 0, 0, 0.15);
      --color-scrollbar-thumb-hover: rgba(0, 0, 0, 0.25);
      --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
      --shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    html.no-transition, html.no-transition * {
      transition: none !important;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body, .controls-bar, .stat-card, .channel-card,
    .emote-table-section, .emote-item, .top-emotes,
    .emote-table, .emote-table th, .emote-table td,
    .table-stats, .table-search-input, .toggle-slider, .btn {
      transition: background-color var(--transition-theme),
                  color var(--transition-theme),
                  border-color var(--transition-theme),
                  box-shadow var(--transition-theme);
    }

    body {
      font-family: var(--font-family);
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      padding: var(--space-lg);
      min-height: 100vh;
    }

    .container { max-width: var(--max-width); margin: 0 auto; }

    header { text-align: center; margin-bottom: var(--space-2xl); }

    h1 {
      font-size: clamp(1.5rem, 4vw, 2.5rem);
      margin-bottom: var(--space-sm);
      color: var(--color-text-primary);
    }

    .subtitle { font-size: var(--font-size-lg); color: var(--color-text-secondary); }

    /* Controls bar */
    .controls-bar {
      display: flex;
      align-items: center;
      gap: var(--space-lg);
      padding: var(--space-md) var(--space-lg);
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-xl);
      flex-wrap: wrap;
    }
    .controls-group {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }
    .controls-group--right { margin-left: auto; }
    .text-muted { color: var(--color-text-muted); font-size: var(--font-size-sm); }

    /* Toggle switch */
    .toggle { display: flex; align-items: center; gap: var(--space-sm); cursor: pointer; }
    .toggle input { display: none; }
    .toggle-slider {
      width: 40px; height: 22px;
      background: var(--color-bg-elevated);
      border-radius: 11px;
      position: relative;
      transition: background var(--transition-fast);
      border: 1px solid var(--color-border);
      flex-shrink: 0;
    }
    .toggle-slider::after {
      content: '';
      position: absolute;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: var(--color-text-secondary);
      top: 2px; left: 2px;
      transition: transform var(--transition-fast), background var(--transition-fast);
    }
    .toggle input:checked + .toggle-slider {
      background: var(--color-accent-muted);
      border-color: var(--color-accent);
    }
    .toggle input:checked + .toggle-slider::after {
      transform: translateX(18px);
      background: var(--color-accent);
    }
    .toggle-label { font-size: var(--font-size-sm); color: var(--color-text-primary); }

    /* Buttons */
    .btn {
      padding: var(--space-sm) var(--space-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-bg-elevated);
      color: var(--color-text-primary);
      cursor: pointer;
      font-size: var(--font-size-sm);
      transition: background var(--transition-fast), border-color var(--transition-fast);
    }
    .btn:hover { background: var(--color-bg-card-hover); border-color: var(--color-border-hover); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .theme-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      border-radius: 50%;
      color: var(--color-text-secondary);
    }
    .theme-toggle-btn:hover { color: var(--color-accent); }
    .theme-toggle-btn svg { width: 18px; height: 18px; }

    /* Spinner */
    .spinner {
      display: inline-block;
      width: 18px; height: 18px;
      border: 2px solid var(--color-text-muted);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Stats grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-md);
      margin-bottom: var(--space-xl);
    }

    .stat-card {
      background: var(--color-bg-card);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      box-shadow: var(--shadow-card);
      border: 1px solid var(--color-border);
    }
    .stat-card h2 {
      font-size: var(--font-size-base);
      margin-bottom: var(--space-sm);
      color: var(--color-text-secondary);
      font-weight: 500;
    }
    .stat-value {
      font-size: clamp(1.5rem, 5vw, 2.5rem);
      font-weight: bold;
      color: var(--color-accent);
    }
    .stat-value--changed { animation: valueFlash 0.6s ease; }
    @keyframes valueFlash {
      0% { color: var(--color-accent); transform: scale(1); }
      30% { color: var(--color-success); transform: scale(1.05); }
      100% { color: var(--color-accent); transform: scale(1); }
    }

    /* Channel section */
    .channel-section { margin-bottom: var(--space-xl); }

    .channel-card {
      background: var(--color-bg-card);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      margin-bottom: var(--space-lg);
      box-shadow: var(--shadow-card);
      border: 1px solid var(--color-border);
    }
    .channel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-md);
      flex-wrap: wrap;
      gap: var(--space-md);
    }
    .channel-name {
      font-size: clamp(1.25rem, 3vw, 2rem);
      font-weight: bold;
      color: var(--color-accent);
    }
    .channel-stats { display: flex; gap: var(--space-xl); font-size: var(--font-size-base); }
    .channel-stat { display: flex; flex-direction: column; align-items: center; }
    .channel-stat-value { font-size: var(--font-size-2xl); font-weight: bold; color: var(--color-text-primary); }
    .channel-stat-label { font-size: var(--font-size-sm); color: var(--color-text-muted); }

    /* Emote grid */
    .emote-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--space-sm);
      margin-top: var(--space-md);
    }
    .emote-item {
      background: var(--color-bg-elevated);
      padding: var(--space-md);
      border-radius: var(--radius-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-sm);
      transition: background var(--transition-base), transform var(--transition-base);
      text-decoration: none;
      color: inherit;
      border: 1px solid transparent;
    }
    .emote-item:hover {
      background: var(--color-bg-card-hover);
      transform: translateY(-2px);
      cursor: pointer;
      border-color: var(--color-border);
    }
    .emote-info { display: flex; align-items: center; gap: var(--space-sm); flex: 1; min-width: 0; }
    .emote-image { width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; }
    .emote-name {
      font-weight: 600;
      font-size: var(--font-size-base);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 200px;
    }
    .emote-count {
      background: var(--color-badge-used);
      color: var(--color-badge-text);
      padding: var(--space-xs) var(--space-md);
      border-radius: 20px;
      font-weight: bold;
      font-size: var(--font-size-sm);
      flex-shrink: 0;
    }
    .emote-count--zero {
      background: var(--color-badge-unused);
      color: var(--color-text-muted);
    }
    .no-emote-image {
      width: 32px; height: 32px;
      background: var(--color-bg-elevated);
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-lg);
      flex-shrink: 0;
    }

    /* Top emotes */
    .top-emotes {
      background: var(--color-bg-card);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      box-shadow: var(--shadow-card);
      border: 1px solid var(--color-border);
    }
    .top-emotes h2 {
      font-size: var(--font-size-xl);
      margin-bottom: var(--space-md);
      text-align: center;
    }

    /* Loading */
    .loading {
      text-align: center;
      font-size: var(--font-size-xl);
      padding: var(--space-2xl);
      color: var(--color-text-secondary);
    }
    .loading .spinner { width: 32px; height: 32px; margin-bottom: var(--space-md); }

    /* Emote table section */
    .emote-table-section {
      background: var(--color-bg-card);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      margin-top: var(--space-lg);
      box-shadow: var(--shadow-card);
      border: 1px solid var(--color-border);
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      padding: var(--space-md);
      user-select: none;
      border-radius: var(--radius-md);
      transition: background var(--transition-fast);
    }
    .table-header:hover { background: var(--color-bg-elevated); }
    .table-header h3 { font-size: var(--font-size-lg); margin: 0; }
    .collapse-icon {
      font-size: var(--font-size-xl);
      transition: transform var(--transition-base);
      color: var(--color-text-muted);
    }
    .collapse-icon.expanded { transform: rotate(180deg); }

    .table-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }
    .table-content.expanded {
      max-height: none;
      margin-top: var(--space-md);
      overflow: visible;
    }

    /* Search input */
    .table-search { margin-bottom: var(--space-md); }
    .table-search-input {
      width: 100%;
      padding: var(--space-sm) var(--space-md);
      background: var(--color-bg-input);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-text-primary);
      font-size: var(--font-size-base);
      outline: none;
      transition: border-color var(--transition-fast);
    }
    .table-search-input:focus { border-color: var(--color-accent); }
    .table-search-input::placeholder { color: var(--color-text-muted); }

    .table-wrapper {
      max-height: 600px;
      overflow-y: auto;
      overflow-x: auto;
      border-radius: var(--radius-md);
      -webkit-overflow-scrolling: touch;
    }
    .table-wrapper::-webkit-scrollbar { width: 8px; height: 8px; }
    .table-wrapper::-webkit-scrollbar-track { background: var(--color-scrollbar-track); border-radius: 4px; }
    .table-wrapper::-webkit-scrollbar-thumb { background: var(--color-scrollbar-thumb); border-radius: 4px; }
    .table-wrapper::-webkit-scrollbar-thumb:hover { background: var(--color-scrollbar-thumb-hover); }

    .emote-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--color-bg-elevated);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .emote-table thead {
      background: var(--color-bg-secondary);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .emote-table th {
      padding: var(--space-md);
      text-align: left;
      font-weight: 600;
      cursor: pointer;
      user-select: none;
      background: var(--color-bg-secondary);
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: color var(--transition-fast);
    }
    .emote-table th:hover { color: var(--color-text-primary); }
    .sort-indicator {
      display: inline-block;
      margin-left: var(--space-xs);
      opacity: 0.4;
      transition: opacity var(--transition-fast);
      vertical-align: middle;
    }
    .emote-table th:hover .sort-indicator { opacity: 0.7; }
    .emote-table th[aria-sort="ascending"] .sort-indicator,
    .emote-table th[aria-sort="descending"] .sort-indicator {
      opacity: 1;
      color: var(--color-accent);
    }
    .emote-table th[aria-sort="ascending"],
    .emote-table th[aria-sort="descending"] { color: var(--color-text-primary); }

    .emote-table td {
      padding: var(--space-sm) var(--space-md);
      border-top: 1px solid var(--color-border);
    }
    .emote-table tr:hover { background: var(--color-row-hover); }
    .emote-table-row { transition: background var(--transition-fast); }
    .emote-table-row--unused { opacity: 0.45; }
    .emote-table-row--unused:hover { opacity: 0.7; }
    .emote-table-row--new { animation: rowAppear 0.5s ease; }
    @keyframes rowAppear {
      from { background: var(--color-accent-muted); }
      to { background: transparent; }
    }

    .emote-table-image { width: 28px; height: 28px; object-fit: contain; vertical-align: middle; }
    .emote-table-link {
      color: var(--color-accent);
      text-decoration: none;
      font-weight: 600;
      font-size: var(--font-size-sm);
    }
    .emote-table-link:hover { text-decoration: underline; color: var(--color-accent-hover); }

    .table-stats {
      padding: var(--space-sm) var(--space-md);
      background: var(--color-bg-elevated);
      border-radius: var(--radius-sm);
      margin-bottom: var(--space-md);
      display: flex;
      gap: var(--space-lg);
      flex-wrap: wrap;
    }
    .table-stat-item { display: flex; flex-direction: column; }
    .table-stat-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }
    .table-stat-value { font-size: var(--font-size-lg); font-weight: bold; color: var(--color-accent); }

    /* Toast system */
    .toast-container {
      position: fixed;
      bottom: var(--space-lg);
      right: var(--space-lg);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      padding: var(--space-md) var(--space-lg);
      border-radius: var(--radius-md);
      color: var(--color-badge-text);
      font-size: var(--font-size-sm);
      box-shadow: var(--shadow-elevated);
      animation: toastIn var(--transition-base) forwards;
      max-width: 400px;
    }
    .toast--error { background: var(--color-error); }
    .toast--info { background: var(--color-accent); }
    .toast--leaving { animation: toastOut var(--transition-base) forwards; }
    @keyframes toastIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(20px); }
    }

    /* Tablet */
    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
      .emote-list { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
    }

    /* Mobile */
    @media (max-width: 768px) {
      body { padding: var(--space-md); }
      .stats-grid { grid-template-columns: 1fr; gap: var(--space-sm); }
      .channel-header { flex-direction: column; align-items: flex-start; }
      .channel-stats { width: 100%; justify-content: space-around; }
      .emote-list { grid-template-columns: 1fr 1fr; gap: var(--space-sm); }
      .emote-item { padding: var(--space-sm); }
      .emote-name { max-width: 100px; font-size: var(--font-size-sm); }
      .emote-table { min-width: 400px; }
      .controls-bar { flex-direction: column; gap: var(--space-sm); align-items: stretch; }
      .controls-group { justify-content: center; }
      .controls-group--right { margin-left: 0; justify-content: center; }
      .btn { min-height: 44px; padding: var(--space-md); font-size: var(--font-size-base); }
      .table-header { padding: var(--space-md) var(--space-sm); min-height: 48px; }
      .emote-table th, .emote-table td { padding: var(--space-md) var(--space-sm); }
      .table-search-input { padding: var(--space-md); font-size: 16px; }
      .toast-container { left: var(--space-md); right: var(--space-md); }
      .toast { max-width: none; }
    }

    /* Small phone */
    @media (max-width: 480px) {
      .emote-list { grid-template-columns: 1fr; }
      .channel-stats { gap: var(--space-md); }
      .table-stats { flex-direction: column; gap: var(--space-sm); }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>SmokeyBot Dashboard</h1>
      <div class="subtitle">7TV Emote Statistics Tracker</div>
    </header>

    <div id="loading" class="loading">
      <div class="spinner" style="width:32px;height:32px;margin:0 auto var(--space-md)"></div>
      Loading statistics...
    </div>
    <div id="content" style="display: none;">
      <div class="controls-bar">
        <div class="controls-group">
          <label class="toggle" id="toggleLabel">
            <input type="checkbox" id="autoRefreshCheckbox">
            <span class="toggle-slider"></span>
            <span class="toggle-label">Auto-refresh</span>
          </label>
          <span class="text-muted" id="autoRefreshStatus">Every 5s</span>
        </div>
        <div class="controls-group">
          <button id="refreshBtn" class="btn">Refresh Now</button>
          <span id="loadingSpinner" class="spinner" style="display:none"></span>
        </div>
        <div class="controls-group controls-group--right">
          <span class="text-muted">Updated <span id="lastUpdated">never</span></span>
          <button class="btn theme-toggle-btn" id="themeToggle" aria-label="Toggle theme">
            <span id="themeIcon"></span>
          </button>
        </div>
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
        <h2>Top Emotes (All Channels)</h2>
        <div class="emote-list" id="topEmotes"></div>
      </div>

      <div class="channel-section" id="channels"></div>

      <div id="emoteTables"></div>
    </div>
  </div>

  <div id="toastContainer" class="toast-container"></div>

  <script>
  (function() {
    'use strict';

    // =========== State ===========
    var state = {
      tableStates: {},
      sortStates: {},
      searchFilters: {},
      latestChannelData: [],
      previousEmotes: {},
      autoRefreshEnabled: true,
      refreshInterval: null,
      lastUpdated: null
    };

    // =========== DOM Cache ===========
    var dom = {};
    function cacheDom() {
      dom.loading = document.getElementById('loading');
      dom.content = document.getElementById('content');
      dom.totalMessages = document.getElementById('totalMessages');
      dom.totalEmotes = document.getElementById('totalEmotes');
      dom.totalChannels = document.getElementById('totalChannels');
      dom.topEmotes = document.getElementById('topEmotes');
      dom.channels = document.getElementById('channels');
      dom.emoteTables = document.getElementById('emoteTables');
      dom.lastUpdated = document.getElementById('lastUpdated');
      dom.autoRefreshCheckbox = document.getElementById('autoRefreshCheckbox');
      dom.autoRefreshStatus = document.getElementById('autoRefreshStatus');
      dom.toastContainer = document.getElementById('toastContainer');
      dom.refreshBtn = document.getElementById('refreshBtn');
      dom.loadingSpinner = document.getElementById('loadingSpinner');
      dom.themeToggle = document.getElementById('themeToggle');
      dom.themeIcon = document.getElementById('themeIcon');
    }

    // =========== HTML Escaping ===========
    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // =========== Theme ===========
    var THEME_KEY = 'smokeybot-theme';
    var SUN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    var MOON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

    function getTheme() {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    }

    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem(THEME_KEY, theme); } catch(e) {}
      updateThemeIcon(theme);
    }

    function toggleTheme() {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    }

    function updateThemeIcon(theme) {
      if (!dom.themeIcon) return;
      dom.themeIcon.innerHTML = theme === 'dark' ? SUN_SVG : MOON_SVG;
    }

    // =========== Persistence ===========
    var STORAGE_KEY = 'smokeybot-dashboard';

    function loadState() {
      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        var parsed = JSON.parse(saved);
        if (parsed.tableStates) state.tableStates = parsed.tableStates;
        if (parsed.sortStates) state.sortStates = parsed.sortStates;
        if (typeof parsed.autoRefreshEnabled === 'boolean') {
          state.autoRefreshEnabled = parsed.autoRefreshEnabled;
        }
      } catch (e) {
        console.warn('[Dashboard] Failed to load saved state:', e);
      }
    }

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          tableStates: state.tableStates,
          sortStates: state.sortStates,
          autoRefreshEnabled: state.autoRefreshEnabled
        }));
      } catch (e) {
        console.warn('[Dashboard] Failed to save state:', e);
      }
    }

    // =========== Toast ===========
    function showToast(message, type) {
      type = type || 'info';
      var toast = document.createElement('div');
      toast.className = 'toast toast--' + type;
      toast.textContent = message;
      dom.toastContainer.appendChild(toast);
      setTimeout(function() {
        toast.classList.add('toast--leaving');
        toast.addEventListener('animationend', function() { toast.remove(); });
      }, 4000);
    }

    // =========== Relative Time ===========
    function relativeTime(timestamp) {
      if (!timestamp) return 'never';
      var seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 5) return 'just now';
      if (seconds < 60) return seconds + 's ago';
      var minutes = Math.floor(seconds / 60);
      if (minutes < 60) return minutes + 'm ago';
      var hours = Math.floor(minutes / 60);
      if (hours < 24) return hours + 'h ago';
      return new Date(timestamp).toLocaleDateString();
    }

    function updateTimeDisplay() {
      if (dom.lastUpdated) {
        dom.lastUpdated.textContent = relativeTime(state.lastUpdated);
      }
    }

    // =========== Value Animation ===========
    function animateValueChange(element, newValue) {
      var formatted = newValue.toLocaleString();
      if (element.textContent !== formatted) {
        element.textContent = formatted;
        element.classList.remove('stat-value--changed');
        void element.offsetWidth;
        element.classList.add('stat-value--changed');
      }
    }

    // =========== API ===========
    async function fetchStats() {
      if (dom.loadingSpinner) dom.loadingSpinner.style.display = 'inline-block';
      if (dom.refreshBtn) dom.refreshBtn.disabled = true;
      try {
        var response = await fetch('/api/stats');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        var data = await response.json();
        updateDashboard(data);
      } catch (error) {
        var msg = error instanceof Error ? error.message : String(error);
        showToast('Failed to fetch stats: ' + msg, 'error');
      } finally {
        if (dom.loadingSpinner) dom.loadingSpinner.style.display = 'none';
        if (dom.refreshBtn) dom.refreshBtn.disabled = false;
      }
    }

    // =========== Rendering ===========
    function renderEmote(emote) {
      var hasMetadata = emote.emoteId && emote.imageUrl;
      var safeName = escapeHtml(emote.emoteName);
      var safeUrl = escapeHtml(emote.imageUrl);
      var safeId = escapeHtml(emote.emoteId);
      var emoteLink = hasMetadata ? 'https://7tv.app/emotes/' + safeId : '#';
      var imageHtml = hasMetadata
        ? '<img src="' + safeUrl + '" alt="' + safeName + '" class="emote-image" loading="lazy">'
        : '<div class="no-emote-image">?</div>';

      var displayName = emote.emoteName.length > 16
        ? escapeHtml(emote.emoteName.substring(0, 14)) + '...'
        : safeName;

      var wrapper = hasMetadata ? 'a' : 'div';
      var linkAttrs = hasMetadata ? 'href="' + emoteLink + '" target="_blank" rel="noopener noreferrer"' : '';
      var countClass = emote.count === 0 ? 'emote-count emote-count--zero' : 'emote-count';

      return '<' + wrapper + ' class="emote-item" ' + linkAttrs + ' title="' + safeName + '">'
        + '<div class="emote-info">' + imageHtml
        + '<span class="emote-name">' + displayName + '</span></div>'
        + '<span class="' + countClass + '">' + emote.count + '</span>'
        + '</' + wrapper + '>';
    }

    function renderTableRow(emote, isNew) {
      var hasMetadata = emote.emoteId && emote.imageUrl;
      var safeName = escapeHtml(emote.emoteName);
      var safeUrl = escapeHtml(emote.imageUrl);
      var safeId = escapeHtml(emote.emoteId);
      var imageHtml = hasMetadata
        ? '<img src="' + safeUrl + '" alt="' + safeName + '" class="emote-table-image" loading="lazy">'
        : '?';
      var linkHtml = hasMetadata
        ? '<a href="https://7tv.app/emotes/' + safeId + '" target="_blank" rel="noopener noreferrer" class="emote-table-link">View</a>'
        : '-';

      var rowClass = 'emote-table-row';
      if (emote.count === 0) rowClass += ' emote-table-row--unused';
      if (isNew) rowClass += ' emote-table-row--new';

      return '<tr class="' + rowClass + '">'
        + '<td>' + imageHtml + '</td>'
        + '<td>' + safeName + '</td>'
        + '<td><strong>' + emote.count + '</strong></td>'
        + '<td>' + linkHtml + '</td></tr>';
    }

    function updateDashboard(data) {
      dom.loading.style.display = 'none';
      dom.content.style.display = 'block';

      var totalMessages = data.channels.reduce(function(sum, ch) { return sum + ch.totalMessages; }, 0);
      var totalEmotes = data.channels.reduce(function(sum, ch) { return sum + ch.totalEmotesUsed; }, 0);

      animateValueChange(dom.totalMessages, totalMessages);
      animateValueChange(dom.totalEmotes, totalEmotes);
      animateValueChange(dom.totalChannels, data.channels.length);

      dom.topEmotes.innerHTML = data.topEmotes.map(renderEmote).join('');

      dom.channels.innerHTML = data.channels.map(function(channel) {
        var safeChannel = escapeHtml(channel.channelName);
        return '<div class="channel-card">'
          + '<div class="channel-header">'
          + '<div class="channel-name">#' + safeChannel + '</div>'
          + '<div class="channel-stats">'
          + '<div class="channel-stat"><div class="channel-stat-value">' + channel.totalMessages.toLocaleString() + '</div><div class="channel-stat-label">Messages</div></div>'
          + '<div class="channel-stat"><div class="channel-stat-value">' + channel.totalEmotesUsed.toLocaleString() + '</div><div class="channel-stat-label">Emotes</div></div>'
          + '</div></div>'
          + '<div class="emote-list">' + channel.emotes.slice(0, 10).map(renderEmote).join('') + '</div>'
          + '</div>';
      }).join('');

      // Track new emotes for highlight animation
      var newEmoteSets = {};
      data.channels.forEach(function(channel) {
        var prev = state.previousEmotes[channel.channelName];
        if (prev) {
          var newSet = {};
          channel.emotes.forEach(function(e) {
            if (e.count > 0 && !prev[e.emoteName]) newSet[e.emoteName] = true;
          });
          newEmoteSets[channel.channelName] = newSet;
        }
        var current = {};
        channel.emotes.forEach(function(e) {
          if (e.count > 0) current[e.emoteName] = true;
        });
        state.previousEmotes[channel.channelName] = current;
      });

      state.latestChannelData = data.channels;
      renderEmoteTables(data.channels, newEmoteSets);

      state.lastUpdated = Date.now();
      updateTimeDisplay();
    }

    function renderEmoteTables(channels, newEmoteSets) {
      newEmoteSets = newEmoteSets || {};

      // Save focused search input
      var focusedChannel = null;
      var focusedCursor = 0;
      var activeEl = document.activeElement;
      if (activeEl && activeEl.dataset && activeEl.dataset.action === 'search') {
        focusedChannel = activeEl.dataset.channel;
        focusedCursor = activeEl.selectionStart || 0;
      }

      dom.emoteTables.innerHTML = channels.map(function(channel) {
        var channelId = channel.channelName;
        var safeChannelId = escapeHtml(channelId);
        var isExpanded = state.tableStates[channelId] || false;
        var usedEmotes = channel.emotes.filter(function(e) { return e.count > 0; });
        var unusedCount = channel.emotes.length - usedEmotes.length;
        var newSet = newEmoteSets[channelId] || {};

        var sortState = state.sortStates[channelId] || { column: 'count', direction: 'desc' };

        function ariaSort(col) {
          if (sortState.column !== col) return 'none';
          return sortState.direction === 'asc' ? 'ascending' : 'descending';
        }
        function sortIcon(col) {
          if (sortState.column !== col) return '<span class="sort-indicator">&#x21C5;</span>';
          return sortState.direction === 'asc'
            ? '<span class="sort-indicator">&#x2191;</span>'
            : '<span class="sort-indicator">&#x2193;</span>';
        }

        // Sort emotes based on current sort state
        var sortedEmotes = channel.emotes.slice();
        if (sortState.column === 'name') {
          sortedEmotes.sort(function(a, b) {
            var cmp = a.emoteName.localeCompare(b.emoteName);
            return sortState.direction === 'asc' ? cmp : -cmp;
          });
        } else if (sortState.column === 'count') {
          sortedEmotes.sort(function(a, b) {
            var cmp = a.count - b.count;
            return sortState.direction === 'asc' ? cmp : -cmp;
          });
        }

        var tableContent = '';
        if (isExpanded) {
          var searchVal = escapeHtml(state.searchFilters[channelId] || '');
          tableContent = '<div class="table-stats">'
            + '<div class="table-stat-item"><span class="table-stat-label">Total Emotes</span><span class="table-stat-value">' + channel.emotes.length + '</span></div>'
            + '<div class="table-stat-item"><span class="table-stat-label">Used</span><span class="table-stat-value">' + usedEmotes.length + '</span></div>'
            + '<div class="table-stat-item"><span class="table-stat-label">Unused</span><span class="table-stat-value">' + unusedCount + '</span></div>'
            + '</div>'
            + '<div class="table-search"><input type="text" class="table-search-input" placeholder="Filter emotes..." data-channel="' + safeChannelId + '" data-action="search" value="' + searchVal + '"></div>'
            + '<div class="table-wrapper">'
            + '<table class="emote-table" id="emote-table-' + safeChannelId + '">'
            + '<thead><tr>'
            + '<th>Preview</th>'
            + '<th data-action="sort" data-channel="' + safeChannelId + '" data-column="name" aria-sort="' + ariaSort('name') + '">Name ' + sortIcon('name') + '</th>'
            + '<th data-action="sort" data-channel="' + safeChannelId + '" data-column="count" aria-sort="' + ariaSort('count') + '">Uses ' + sortIcon('count') + '</th>'
            + '<th>Link</th>'
            + '</tr></thead>'
            + '<tbody id="table-body-' + safeChannelId + '">'
            + sortedEmotes.map(function(emote) { return renderTableRow(emote, !!newSet[emote.emoteName]); }).join('')
            + '</tbody></table></div>';
        } else {
          tableContent = '<p style="text-align:center;padding:var(--space-lg);color:var(--color-text-muted);">Click to expand and view all emotes</p>';
        }

        return '<div class="emote-table-section">'
          + '<div class="table-header" data-action="toggle-table" data-channel="' + safeChannelId + '">'
          + '<h3>All Emotes for #' + safeChannelId + ' (' + channel.emotes.length + ' total)</h3>'
          + '<span class="collapse-icon ' + (isExpanded ? 'expanded' : '') + '">&#x25BC;</span>'
          + '</div>'
          + '<div class="table-content ' + (isExpanded ? 'expanded' : '') + '" id="table-' + safeChannelId + '">'
          + tableContent
          + '</div></div>';
      }).join('');

      // Restore search filters and focus
      Object.keys(state.searchFilters).forEach(function(channelId) {
        if (state.searchFilters[channelId]) {
          filterTableRows(channelId);
        }
      });
      if (focusedChannel) {
        var restored = dom.emoteTables.querySelector('[data-channel="' + focusedChannel + '"][data-action="search"]');
        if (restored) {
          restored.focus();
          restored.setSelectionRange(focusedCursor, focusedCursor);
        }
      }
    }

    // =========== Search/Filter ===========
    function filterTableRows(channelId) {
      var filter = (state.searchFilters[channelId] || '').toLowerCase();
      var tbody = document.getElementById('table-body-' + channelId);
      if (!tbody) return;
      var rows = tbody.querySelectorAll('tr');
      rows.forEach(function(row) {
        var nameCell = row.querySelector('td:nth-child(2)');
        if (!nameCell) return;
        var name = nameCell.textContent.toLowerCase();
        row.style.display = name.indexOf(filter) !== -1 ? '' : 'none';
      });
    }

    // =========== Table Interactions ===========
    function toggleTable(channelId) {
      state.tableStates[channelId] = !state.tableStates[channelId];
      saveState();
      renderEmoteTables(state.latestChannelData);
    }

    function sortTable(channelId, column) {
      if (!state.sortStates[channelId]) {
        state.sortStates[channelId] = { column: 'count', direction: 'desc' };
      }

      if (state.sortStates[channelId].column === column) {
        state.sortStates[channelId].direction = state.sortStates[channelId].direction === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortStates[channelId].column = column;
        state.sortStates[channelId].direction = column === 'count' ? 'desc' : 'asc';
      }

      saveState();
      renderEmoteTables(state.latestChannelData);
    }

    // =========== Auto-Refresh ===========
    function syncAutoRefreshUI() {
      dom.autoRefreshCheckbox.checked = state.autoRefreshEnabled;
      dom.autoRefreshStatus.textContent = state.autoRefreshEnabled ? 'Every 5s' : 'Paused';
    }

    function toggleAutoRefresh() {
      state.autoRefreshEnabled = !state.autoRefreshEnabled;
      syncAutoRefreshUI();
      saveState();
      if (state.autoRefreshEnabled) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    }

    function startAutoRefresh() {
      if (state.refreshInterval) clearInterval(state.refreshInterval);
      state.refreshInterval = setInterval(function() {
        if (state.autoRefreshEnabled) fetchStats();
      }, 5000);
    }

    function stopAutoRefresh() {
      if (state.refreshInterval) {
        clearInterval(state.refreshInterval);
        state.refreshInterval = null;
      }
    }

    // =========== Event Binding ===========
    function bindEvents() {
      // Event delegation on emote tables
      dom.emoteTables.addEventListener('click', function(e) {
        var toggleEl = e.target.closest('[data-action="toggle-table"]');
        if (toggleEl) {
          toggleTable(toggleEl.dataset.channel);
          return;
        }
        var sortEl = e.target.closest('[data-action="sort"]');
        if (sortEl) {
          sortTable(sortEl.dataset.channel, sortEl.dataset.column);
          return;
        }
      });

      // Search input
      dom.emoteTables.addEventListener('input', function(e) {
        if (e.target.matches && e.target.matches('[data-action="search"]')) {
          var channelId = e.target.dataset.channel;
          state.searchFilters[channelId] = e.target.value;
          filterTableRows(channelId);
        }
      });

      // Auto-refresh toggle
      document.getElementById('toggleLabel').addEventListener('click', function(e) {
        e.preventDefault();
        toggleAutoRefresh();
      });

      // Refresh button
      dom.refreshBtn.addEventListener('click', function() { fetchStats(); });

      // Theme toggle
      dom.themeToggle.addEventListener('click', toggleTheme);
    }

    // =========== Init ===========
    function init() {
      cacheDom();
      loadState();
      updateThemeIcon(getTheme());
      syncAutoRefreshUI();
      bindEvents();
      fetchStats();
      if (state.autoRefreshEnabled) startAutoRefresh();
      // Update relative time every second
      setInterval(updateTimeDisplay, 1000);
      // Remove no-transition class after first paint (double-rAF for robustness)
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          document.documentElement.classList.remove('no-transition');
        });
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
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
