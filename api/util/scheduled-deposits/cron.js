const cron = require('node-cron');
const { performAutomatedDeposits , performAutomatedTopUp } = require('./cronLogic.js')

//12:01, 1st day of the month, Every month (can fall on any weekday)
cron.schedule('1 0 1 * *', async () => {
    try {
        console.log('Running automated deposits...');
        await performAutomatedDeposits();
        console.log('Automated deposits completed successfully');

        console.log('Running automated top-ups...');
        await performAutomatedTopUp(); 
        console.log('Automated top-ups completed successfully');
      } 
      
    catch (error) {
        console.error('Error during automated operations:', error);
      }
    });

