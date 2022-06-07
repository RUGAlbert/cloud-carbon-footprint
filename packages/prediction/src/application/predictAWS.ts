import { privateToAws } from './../matching'
import { writeLUTInputToCsv, writeLUTOutputToCsv } from './../dataSources'
import {
  LookupTableInput,
  LookupTableOutput,
} from '@cloud-carbon-footprint/common'
import { App } from '@cloud-carbon-footprint/app'
import { MAP_LOCATIONS } from './../matching'
import path from 'path'

async function createLookupTable(configs: any, weights: any): Promise<LookupTableInput[]> {
  let lookupInput: LookupTableInput[] = []
  let i = 0
  while (i < 4) {
    let config = configs[i]
    let res = await privateToAws(config, weights)
    let loc = MAP_LOCATIONS[config['SiteName'].toString()]

    let input: LookupTableInput = {} as LookupTableInput
    input['serviceName'] = 'AmazonEC2'
    input['region'] = loc
    input['usageType'] = res['Instance type']
    input['usageUnit'] = 'Hrs'
    input['vCpus'] = ''
    input['machineType'] = ''
    lookupInput.push(input)

    //network
    let network: LookupTableInput = {} as LookupTableInput
    network['serviceName'] = 'AmazonEC2'
    network['region'] = loc
    network['usageType'] = 'DOWNLOAD'
    network['usageUnit'] = 'GB'
    network['vCpus'] = ''
    network['machineType'] = ''
    lookupInput.push(network)

    //storage
    let storage = {} as LookupTableInput
    storage['serviceName'] = 'AmazonS3'
    storage['region'] = loc
    storage['usageType'] = 'APS2-TimedStorage-ByteHrs'
    storage['usageUnit'] = 'GB-Hours'
    storage['vCpus'] = ''
    storage['machineType'] = ''
    lookupInput.push(storage)

    i++
  }

  return lookupInput
}

function getTotals(configs: any, awsEstimatesData: LookupTableOutput[]): any {
  let totalEmmision = 0
  let totalKwh = 0
  let i = 0
  //asume it is the same order as before, this means we can do / 3
  awsEstimatesData.forEach((element) => {
    let btConfig = configs[Math.floor(i / 3)]
    if (element['usageUnit'] === 'Hrs') {
      let cpuHours = parseFloat(btConfig['cpuHours'])
      totalEmmision += element['co2e'] * cpuHours
      totalKwh += element['kilowattHours'] * cpuHours
    } else if (element['usageUnit'] === 'GB') {
      let gbDownloaded = parseFloat(btConfig['network'])
      totalEmmision += element['co2e'] * gbDownloaded
      totalKwh += element['kilowattHours'] * gbDownloaded
    } else if (element['usageUnit'] === 'GB-Hours') {
      let storage =
        parseFloat(btConfig['storage']) * parseFloat(btConfig['storageHours'])
      totalEmmision += element['co2e'] * storage
      totalKwh += element['kilowattHours'] * storage
    }
    i++
  })

  //convert from tons to kg
  totalEmmision *= 1000

  return { emission: totalEmmision, kwh: totalKwh }
}

export default async function predictAWS(configs: any, weights: any) : Promise<any> {
  let lookupInput = await createLookupTable(configs, weights)

  const inputLUTFile = path.join(process.cwd(), 'AWS_inputLut.csv')
  writeLUTInputToCsv(inputLUTFile, lookupInput)

  const outputLUTFile = path.join(process.cwd(), 'AWS_outputLut.csv')
  const awsEstimatesData: LookupTableOutput[] =
    new App().getAwsEstimatesFromInputData(lookupInput)

  writeLUTOutputToCsv(outputLUTFile, awsEstimatesData)

  let totals = getTotals(configs, awsEstimatesData)
  return totals
}
