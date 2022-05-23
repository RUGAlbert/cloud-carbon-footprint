import { createObjectCsvWriter } from 'csv-writer'
import {
  LookupTableInput,
  LookupTableOutput,
} from '@cloud-carbon-footprint/common'

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
