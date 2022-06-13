import { privateToAws } from './../matching'
import {
  writeLUTInputToCsv,
  writeLUTOutputToCsv,
  PredictionOutput,
} from './../dataSources'
import {
  LookupTableInput,
  LookupTableOutput,
} from '@cloud-carbon-footprint/common'
import { App } from '@cloud-carbon-footprint/app'
import { MAP_LOCATIONS } from './../matching'
import path from 'path'

async function createLookupTable(
  configs: any,
  weights: any,
): Promise<LookupTableInput[]> {
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

function getTotals(
  configs: any,
  awsEstimatesData: LookupTableOutput[],
): PredictionOutput[] {
  let totalEmission = 0
  let totalKwh = 0
  let i = 0

  let predictionOutput: any[] = []

  let emissionDownloaded = 0
  let kwhDownloaded = 0
  let emissionStored = 0
  let kwhStored = 0

  //asume it is the same order as before, this means we can do / 3
  awsEstimatesData.forEach((element) => {
    let btConfig = configs[Math.floor(i / 3)]
    if (element['usageUnit'] === 'Hrs') {
      let cpuHours = parseFloat(btConfig['cpuHours'])

      let res: PredictionOutput = {} as PredictionOutput
      res['host'] = btConfig['Host']
      res['localServiceName'] = btConfig['CPU Model']
      res['awsServiceName'] = element['serviceName'] + ':' + element['usageType']

      //convert from tons to kg
      res['co2e'] = element['co2e'] * cpuHours * 1000
      res['kilowattHours'] = element['kilowattHours'] * cpuHours

      predictionOutput.push(res)

      totalEmission += res['co2e']
      totalKwh += res['kilowattHours']
    } else if (element['usageUnit'] === 'GB') {
      let gbDownloaded = parseFloat(btConfig['network'])
      //convert from tons to kg
      emissionDownloaded += element['co2e'] * gbDownloaded * 1000
      kwhDownloaded += element['kilowattHours'] * gbDownloaded
    } else if (element['usageUnit'] === 'GB-Hours') {
      let storage =
        parseFloat(btConfig['storage']) * parseFloat(btConfig['storageHours'])
      //convert from tons to kg
      emissionStored += element['co2e'] * storage * 1000
      kwhStored += element['kilowattHours'] * storage
    }
    i++
  })

  let resStored: PredictionOutput = {} as PredictionOutput
  resStored['host'] = '--'
  resStored['localServiceName'] = 'Storage'
  resStored['co2e'] = emissionStored
  resStored['kilowattHours'] = kwhStored
  predictionOutput.push(resStored)

  let resDownloaded: PredictionOutput = {} as PredictionOutput
  resDownloaded['host'] = '--'
  resDownloaded['localServiceName'] = 'Network usage'
  resDownloaded['co2e'] = emissionDownloaded
  resDownloaded['kilowattHours'] = kwhDownloaded
  predictionOutput.push(resDownloaded)

  totalEmission += emissionStored + emissionDownloaded
  totalKwh += kwhDownloaded + kwhStored


  let resTotal: PredictionOutput = {} as PredictionOutput
  resTotal['host'] = 'Total'
  resTotal['localServiceName'] = '--'
  resTotal['co2e'] = totalEmission
  resTotal['kilowattHours'] = totalKwh
  predictionOutput.push(resTotal)

  return predictionOutput
}

export default async function predictAWS(
  configs: any,
  weights: any,
): Promise<any> {
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
