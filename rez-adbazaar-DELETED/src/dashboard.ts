<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AdBazaar - Intent-Based Ads</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f1419;
      color: #e7e9ea;
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #2f3336;
    }
    .header h1 { font-size: 1.8rem; color: #ffd400; }
    .header .subtitle { color: #71767b; font-size: 0.9rem; }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .card {
      background: #16181c;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #2f3336;
    }
    .card h3 { font-size: 0.8rem; color: #71767b; margin-bottom: 8px; text-transform: uppercase; }
    .card .value { font-size: 2.2rem; font-weight: 700; }
    .card .sub { font-size: 0.85rem; color: #71767b; margin-top: 5px; }
    .card.highlight { border-color: #ffd400; }

    .section {
      background: #16181c;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      border: 1px solid #2f3336;
    }
    .section h2 { font-size: 1.1rem; margin-bottom: 15px; color: #e7e9ea; }

    .intent-flow {
      display: flex;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;
      margin: 20px 0;
    }
    .intent-step {
      background: #2f3336;
      padding: 15px 20px;
      border-radius: 8px;
      text-align: center;
      flex: 1;
      min-width: 150px;
    }
    .intent-step .icon { font-size: 2rem; margin-bottom: 5px; }
    .intent-step .label { font-size: 0.85rem; color: #71767b; }
    .intent-step .value { font-weight: 600; margin-top: 5px; }
    .arrow { color: #ffd400; font-size: 1.5rem; }

    .ad-example {
      background: linear-gradient(135deg, #ffd40015, #1d9bf015);
      border: 1px solid #ffd400;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 15px;
    }
    .ad-example .ad-badge {
      display: inline-block;
      background: #ffd400;
      color: #000;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .ad-example .ad-content {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .ad-example .ad-meta {
      font-size: 0.85rem;
      color: #71767b;
    }
    .ad-example .ad-target {
      margin-top: 10px;
      padding: 10px;
      background: #2f3336;
      border-radius: 6px;
      font-size: 0.8rem;
    }
    .ad-example .ad-target .target-label { color: #71767b; margin-bottom: 5px; }
    .ad-example .ad-target .target-value { color: #1d9bf0; }

    .campaigns {
      display: grid;
      gap: 15px;
    }
    .campaign {
      background: #2f3336;
      padding: 15px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .campaign-info .name { font-weight: 600; }
    .campaign-info .target { font-size: 0.85rem; color: #71767b; }
    .campaign-stats { text-align: right; }
    .campaign-stats .impressions { font-size: 1.2rem; font-weight: 600; }
    .campaign-stats .ctr { color: #00ba7c; font-size: 0.85rem; }

    .segments {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .segment {
      padding: 8px 16px;
      background: #2f3336;
      border-radius: 20px;
      font-size: 0.9rem;
    }
    .segment.active { background: #ffd400; color: #000; }

    .privacy-note {
      background: #00ba7c15;
      border: 1px solid #00ba7c;
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
      font-size: 0.9rem;
      color: #00ba7c;
    }

    .create-btn {
      background: #ffd400;
      color: #000;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .create-btn:hover { background: #e6c700; }

    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #2f3336;
    }
    th { color: #71767b; font-weight: 500; font-size: 0.85rem; }
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
    }
    .status-dot.active { background: #00ba7c; }
    .status-dot.paused { background: #ffd400; }
    .status-dot.inactive { background: #f4212e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>AdBazaar</h1>
        <div class="subtitle">Intent-Based Ad Targeting</div>
      </div>
      <button class="create-btn" onclick="createCampaign()">+ New Campaign</button>
    </div>

    <div class="grid">
      <div class="card highlight">
        <h3>Active Campaigns</h3>
        <div class="value">12</div>
        <div class="sub">Running today</div>
      </div>
      <div class="card">
        <h3>Impressions</h3>
        <div class="value">45.2K</div>
        <div class="sub">+12% vs yesterday</div>
      </div>
      <div class="card">
        <h3>Click Rate</h3>
        <div class="value">4.8%</div>
        <div class="sub">Intent-based CTR</div>
      </div>
      <div class="card">
        <h3>Revenue</h3>
        <div class="value">₹8.5K</div>
        <div class="sub">Ad revenue today</div>
      </div>
    </div>

    <div class="section">
      <h2>How Intent-Based Targeting Works</h2>

      <div class="intent-flow">
        <div class="intent-step">
          <div class="icon">👤</div>
          <div class="label">User</div>
          <div class="value">Searches "spa"</div>
        </div>
        <div class="arrow">→</div>
        <div class="intent-step">
          <div class="icon">🧠</div>
          <div class="label">ReZ Mind</div>
          <div class="value">Detects intent</div>
        </div>
        <div class="arrow">→</div>
        <div class="intent-step">
          <div class="icon">📢</div>
          <div class="label">AdBazaar</div>
          <div class="value">Shows spa ads</div>
        </div>
      </div>

      <div class="privacy-note">
        ✅ <strong>Privacy-first:</strong> We show ads based on current intent, not surveillance. No raw data stored. Users can opt-out anytime.
      </div>
    </div>

    <div class="section">
      <h2>Live Ad Examples</h2>

      <div class="ad-example">
        <div class="ad-badge">ACTIVE</div>
        <div class="ad-content">✨ Spa Bliss - 25% Off on Massages</div>
        <div class="ad-meta">Spa Bliss Salon • BTM Layout • 0.8 km away</div>
        <div class="ad-target">
          <div class="target-label">Targeting:</div>
          <div class="target-value">Intent: "looking_for_service" | Segment: "wellness"</div>
        </div>
      </div>

      <div class="ad-example">
        <div class="ad-badge">ACTIVE</div>
        <div class="ad-content">🍛 Biryani Festival - Free Delivery</div>
        <div class="ad-meta">Spice Garden • BTM Layout • 1.2 km away</div>
        <div class="ad-target">
          <div class="target-label">Targeting:</div>
          <div class="target-value">Intent: "looking_for_dinner" | Foodies segment | Evening time</div>
        </div>
      </div>

      <div class="ad-example">
        <div class="ad-badge">ACTIVE</div>
        <div class="ad-content">💆 Hair Spa Combo - ₹499 Only</div>
        <div class="ad-meta">Style Studio • Indiranagar • 2.1 km away</div>
        <div class="ad-target">
          <div class="target-label">Targeting:</div>
          <div class="target-value">Segment: "deal_seekers" | Price sensitive | Spa interest</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>User Segments</h2>
      <div class="segments">
        <span class="segment active">All Users (5.2K)</span>
        <span class="segment">Foodies (1.8K)</span>
        <span class="segment">Deal Seekers (950)</span>
        <span class="segment">Wellness (620)</span>
        <span class="segment">VIP (180)</span>
        <span class="segment">New Users (1.2K)</span>
        <span class="segment">At Risk (340)</span>
      </div>
    </div>

    <div class="section">
      <h2>Active Campaigns</h2>
      <div class="campaigns">
        <div class="campaign">
          <div class="campaign-info">
            <div class="name">🍛 Food Delivery Deals</div>
            <div class="target">Intent: looking_for_food | Foodies</div>
          </div>
          <div class="campaign-stats">
            <div class="impressions">15.2K</div>
            <div class="ctr">CTR: 5.2%</div>
          </div>
        </div>

        <div class="campaign">
          <div class="campaign-info">
            <div class="name">💆 Salon Promotions</div>
            <div class="target">Intent: looking_for_service | Wellness</div>
          </div>
          <div class="campaign-stats">
            <div class="impressions">8.5K</div>
            <div class="ctr">CTR: 4.8%</div>
          </div>
        </div>

        <div class="campaign">
          <div class="campaign-info">
            <div class="name">🏨 Hotel Bookings</div>
            <div class="target">Context: traveling | Business</div>
          </div>
          <div class="campaign-stats">
            <div class="impressions">5.1K</div>
            <div class="ctr">CTR: 3.9%</div>
          </div>
        </div>

        <div class="campaign">
          <div class="campaign-info">
            <div class="name">🎁 Rewards & Cashback</div>
            <div class="target">All users | Engagement boost</div>
          </div>
          <div class="campaign-stats">
            <div class="impressions">22.0K</div>
            <div class="ctr">CTR: 2.1%</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Recent Activity</h2>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>User Intent</th>
            <th>Ad Shown</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2 min ago</td>
            <td><span class="status-dot active"></span>looking_for_service</td>
            <td>Spa Bliss - 25% Off</td>
            <td style="color: #00ba7c;">Clicked</td>
          </tr>
          <tr>
            <td>5 min ago</td>
            <td><span class="status-dot active"></span>looking_for_dinner</td>
            <td>Biryani Festival</td>
            <td style="color: #00ba7c;">Ordered</td>
          </tr>
          <tr>
            <td>12 min ago</td>
            <td><span class="status-dot active"></span>browsing</td>
            <td>General Promo</td>
            <td style="color: #71767b;">Viewed</td>
          </tr>
          <tr>
            <td>18 min ago</td>
            <td><span class="status-dot active"></span>looking_for_food</td>
            <td>Free Delivery</td>
            <td style="color: #00ba7c;">Clicked</td>
          </tr>
          <tr>
            <td>25 min ago</td>
            <td><span class="status-dot paused"></span>intent: spa</td>
            <td>Hair Spa Combo</td>
            <td style="color: #ffd400;">Ignored</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="privacy-note">
      <strong>Privacy First:</strong><br>
      • No personal data stored<br>
      • No browsing history tracked<br>
      • No location history stored<br>
      • Consent-based personalization<br>
      • Users can opt-out anytime
    </div>
  </div>

  <script>
    function createCampaign() {
      alert('Campaign creator coming soon!\n\nFor now, campaigns are managed via API.');
    }
  </script>
</body>
</html>
