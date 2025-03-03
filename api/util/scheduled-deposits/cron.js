const cron = require('node-cron');

const performAutomatedDeposits = () =>{
    console.log('Running monthly automated deposits');
};

cron.schedule('1 0 1 * *', performAutomatedDeposits());