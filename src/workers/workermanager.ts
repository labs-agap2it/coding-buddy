import os from "os";
import { Worker } from "worker_threads";
import type { DbItem } from "../types/types";
import vectraIndex from "../db/vectra";

import path from "path";

function getNumberOfWorkers(): number {
  return Math.floor(os.cpus().length * 0.75);
}

function splitDataPerWorker(data: string[], numWorkers: number): string[][] {
  const dataPerWorker: number = Math.ceil(data.length / numWorkers);
  const dataPerWorkerArray: string[][] = [];
  for (let i = 0; i < numWorkers; i++) {
    dataPerWorkerArray.push(
      data.slice(i * dataPerWorker, (i + 1) * dataPerWorker)
    );
  }
  return dataPerWorkerArray;
}

function initWorkerListener(worker: Worker) {
  return new Promise<void>((resolve) => {
    worker.on("message", async (chunks: DbItem[]) => {
      await vectraIndex.addFiles(chunks);
      worker.terminate();
      resolve();
    });
  });
}

export async function initWorkers(
  data: string[],
  enableMultipleWorkers: boolean
) {
  let numWorkersAvailable: number = 1;
  let dataPerWorker: string[][] = [];
  //const APIKEY = getAPIKey();

  if (enableMultipleWorkers) {
    numWorkersAvailable = getNumberOfWorkers();
    dataPerWorker = splitDataPerWorker(data, numWorkersAvailable);
  }
  try {
    const workers: Promise<void>[] = [];

    for (let i = 0; i < numWorkersAvailable; i++) {
      const filesForWorker = enableMultipleWorkers ? dataPerWorker[i] : data;
      if (filesForWorker!.length === 0) {
        continue;
      }

      const worker = new Worker(path.join(__dirname, "worker.js"));

      worker.on("error", (err) => {
        console.error("Worker error:", err);
      });

      worker.on("exit", (code) => {
        console.log(`Worker exited with code: ${code}`);
        if (code !== 0) {
          console.error(`Worker stopped unexpectedly with code ${code}`);
        }
      });
      workers.push(initWorkerListener(worker));
      worker.postMessage({ files: filesForWorker, APIKEY: global.APIKEY });
    }

    await Promise.all(workers);
    console.log("Done indexing!");
  } catch (e: any) {
    console.log("Critical Error: " + e);
  }
}
