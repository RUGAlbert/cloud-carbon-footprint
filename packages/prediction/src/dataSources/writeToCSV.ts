import { createObjectCsvWriter } from 'csv-writer'
import {
  LookupTableInput,
  LookupTableOutput,
} from '@cloud-carbon-footprint/common'
import { PredictionOutput } from './predictionOutput'

/**
 * Writes LUT input output to csv file
 * @param outputFileName the name of the file
 * @param outputData the data to be saved
 */
export async function writeLUTInputToCsv(
  outputFileName: string,
  outputData: LookupTableInput[],
) {
  const csvWriter = createObjectCsvWriter({
    path: outputFileName,
    header: [
      { id: 'serviceName', title: 'serviceName' },
      { id: 'region', title: 'region' },
      { id: 'usageType', title: 'usageType' },
      { id: 'usageUnit', title: 'usageUnit' },
      { id: 'vCpus', title: 'vCpus' },
      { id: 'machineType', title: 'machineType' },
    ],
  })
  await csvWriter.writeRecords(outputData)
}

/**
 * Writes lutOutput output to csv file
 * @param outputFileName the name of the file
 * @param outputData the data to be saved
 */
export async function writeLUTOutputToCsv(
  outputFileName: string,
  outputData: LookupTableOutput[],
) {
  const csvWriter = createObjectCsvWriter({
    path: outputFileName,
    header: [
      { id: 'serviceName', title: 'serviceName' },
      { id: 'region', title: 'region' },
      { id: 'usageType', title: 'usageType' },
      { id: 'usageUnit', title: 'usageUnit' },
      { id: 'vCpus', title: 'vCpus' },
      { id: 'machineType', title: 'machineType' },
      { id: 'kilowattHours', title: 'kilowattHours' },
      { id: 'co2e', title: 'co2e' },
    ],
  })
  await csvWriter.writeRecords(outputData)
}



/**
 * Writes Prediction output to csv file
 * @param outputFileName the name of the file
 * @param outputData the data to be saved
 */
 export async function writePredictionToCsv(
  outputFileName: string,
  outputData: PredictionOutput[],
) {
  const csvWriter = createObjectCsvWriter({
    path: outputFileName,
    header: [
      { id: 'host', title: 'host' },
      { id: 'localServiceName', title: 'localServiceName' },
      { id: 'awsServiceName', title: 'awsServiceName' },
      { id: 'awsKilowattHours', title: 'awsKilowattHours' },
      { id: 'awsCo2e', title: 'awsCo2e' },
      { id: 'localKilowattHours', title: 'localKilowattHours' },
      { id: 'localCo2e', title: 'localCo2e' },
    ],
  })
  await csvWriter.writeRecords(outputData)
}