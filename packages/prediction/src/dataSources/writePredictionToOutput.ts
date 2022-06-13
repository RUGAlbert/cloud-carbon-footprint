/*
 * © 2021 Thoughtworks, Inc.
 */
import { createObjectCsvWriter } from 'csv-writer'

export type PredictionOutput = {
  host: string
	localServiceName: string
	awsServiceName: string
	awsKilowattHours: number
	awsCo2e: number
	localKilowattHours: number
	localCo2e: number
  }
  

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
