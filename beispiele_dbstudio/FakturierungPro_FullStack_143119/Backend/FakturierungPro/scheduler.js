const cron = require('node-cron');
const db = require('./models');

const initJobs = () => {
    console.log("Initializing Scheduler...");
    cron.schedule('* * * * *', async () => {
    });
};

module.exports = initJobs;