const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // Use axios instead of node-fetch
const cron = require('node-cron');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

const scheduledNotifications = {};

app.post('/schedule-notification', async (req, res) => {
  const { token, title, body, data, scheduleTime } = req.body;

  const notificationId = `${token}-${scheduleTime}`;
  if (scheduledNotifications[notificationId]) {
    scheduledNotifications[notificationId].stop();
  }

  const cronTime = new Date(scheduleTime);
  const cronExpression = `${cronTime.getMinutes()} ${cronTime.getHours()} ${cronTime.getDate()} ${cronTime.getMonth() + 1} *`;

  const task = cron.schedule(cronExpression, async () => {
    const message = {
      to: token,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      const response = await axios.post(EXPO_PUSH_ENDPOINT, message, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('Notification sent:', response.data);
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    task.stop();
    delete scheduledNotifications[notificationId];
  });

  scheduledNotifications[notificationId] = task;

  res.status(200).json({ message: 'Notification scheduled' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});