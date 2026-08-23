const axios = require('axios');

const webhooks = [];

const notify = async (event, payload) => {
    webhooks.forEach(hook => {
        if (hook.events.includes(event)) {
            axios.post(hook.url, { event, data: payload, timestamp: new Date() })
                .then(() => console.log('Webhook sent to', hook.url))
                .catch(err => console.error('Webhook failed:', err.message));
        }
    });
};

module.exports = { notify };