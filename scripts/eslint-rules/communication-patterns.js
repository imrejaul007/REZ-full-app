module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce communication layer patterns'
    },
    messages: {
      redisQueue: 'Use BullMQ for background jobs, not Redis lists',
      socketAsync: 'Use BullMQ for async work, not Socket.IO'
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        const code = context.getSourceCode().getText(node);
        if (code.includes('redis.lpush') && code.includes('queue')) {
          context.report({ node, messageId: 'redisQueue' });
        }
        if (code.includes('socket.emit') && code.includes('background')) {
          context.report({ node, messageId: 'socketAsync' });
        }
      }
    };
  }
};
