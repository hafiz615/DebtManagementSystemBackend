import cron from 'node-cron';
console.log('i am here');

class CronJob {
  startCronJob() {
    cron.schedule('* * * * *', () => {
      console.log('Running a task every minute');
    });
  }
}

export default new CronJob();
