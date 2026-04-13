fetch('http://localhost:3002/api/productivity/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ context: { upcomingTasks: [], recentDoubts: [], recentTests: [], upcomingSessions: [] } })
}).then(r => r.text()).then(console.log).catch(console.error);
