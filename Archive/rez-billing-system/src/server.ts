import { createApp } from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

async function main(): Promise<void> {
  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ReZ Billing System                                       ║
║   ─────────────────────────────────────────────────────   ║
║   Server running on port ${PORT.toString().padEnd(32)}║
║   Environment: ${NODE_ENV.padEnd(43)}║
║   Health: http://localhost:${PORT}/health                    ║
║                                                            ║
║   API Endpoints:                                          ║
║   • POST   /api/wallets                    Create wallet  ║
║   • GET    /api/wallets/:id                Get wallet     ║
║   • POST   /api/wallets/:id/credit         Credit funds    ║
║   • POST   /api/wallets/:id/debit          Debit funds     ║
║   • POST   /api/wallets/:id/transfer       Transfer funds  ║
║                                                            ║
║   • POST   /api/invoices                   Create invoice ║
║   • GET    /api/invoices/:id               Get invoice    ║
║   • POST   /api/invoices/:id/pay           Mark as paid   ║
║                                                            ║
║   • POST   /api/fraud/check                Fraud check    ║
║   • GET    /api/fraud/statistics           Fraud stats    ║
║                                                            ║
║   • POST   /api/settlements                 Create settle  ║
║   • GET    /api/settlements/:id             Get settlement ║
║   • GET    /api/settlements/fee/breakdown   Fee breakdown  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = (signal: string): void => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
