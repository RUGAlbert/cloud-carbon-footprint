/*
 * © 2021 Thoughtworks, Inc.
 */
import { createObjectCsvWriter } from 'csv-writer'

export type PredictionOutput = {
  host: string
	localServiceName: string
	awsServiceName: string
	kilowattHours: number
	co2e: number
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
      { id: 'kilowattHours', title: 'kilowattHours' },
      { id: 'co2e', title: 'co2e' },
    ],
  })
  await csvWriter.writeRecords(outputData)
}
