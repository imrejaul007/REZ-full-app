// Notification unit test
const sendNotification = async (user, message) => {
  return { sent: true, user, message };
};
test('notification send', async () => {
  const result = await sendNotification('user123', 'Hello');
  expect(result.sent).toBe(true);
});

const schedule = (time, notification) => ({ scheduled: true, time });
test('notification schedule', () => {
  const result = schedule('2024-12-25', {});
  expect(result.scheduled).toBe(true);
});
