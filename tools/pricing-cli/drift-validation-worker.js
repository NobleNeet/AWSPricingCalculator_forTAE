import { parentPort, workerData } from 'node:worker_threads';
import { loadPackages } from './package-loader.js';
import { runDriftTask } from './drift-task.js';

const packages = await loadPackages();

parentPort.on('message', async message => {
  if (message.type === 'stop') {
    parentPort.close();
    return;
  }
  if (message.type !== 'task') return;
  try {
    parentPort.postMessage({
      type: 'result',
      result: await runDriftTask(packages, message.task, {
        previousDirectory: workerData.previousDirectory,
        candidateDirectory: workerData.candidateDirectory
      })
    });
  } catch (error) {
    parentPort.postMessage({
      type: 'error',
      taskId: message.task.taskId,
      serviceCode: message.task.serviceCode,
      region: message.task.region,
      error: error.stack ?? error.message
    });
  }
});
