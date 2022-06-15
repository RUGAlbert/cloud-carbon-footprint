
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
import path from 'path'
import {
  OnPremiseDataInput,
  OnPremiseDataOutput,
} from '@cloud-carbon-footprint/common'
import {createLookupTable} from './lutMaker'



function getTotals(
  configs: any,
  awsEstimatesData: LookupTableOutput[],
  onSiteValues: OnPremiseDataOutput[],
): PredictionOutput[] {
  let awsTotalEmission = 0
  let awsTotalKwh = 0
  let localTotalEmission = 0
  let localTotalKwh = 0
  let i = 0

  let predictionOutput: any[] = []

  let emissionDownloaded = 0
  let kwhDownloaded = 0
  let emissionStored = 0
  let kwhStored = 0

  //asume it is the same order as before, this means we can do / 3
  awsEstimatesData.forEach((element) => {
    let btConfig = configs[Math.floor(i / 3)]
    let OnPremiseConfig = onSiteValues[Math.floor(i / 3)]
    if (element['usageUnit'] === 'Hrs') {
      let cpuHours = parseFloat(btConfig['cpuHours'])

      let res: PredictionOutput = {} as PredictionOutput
      res['host'] = btConfig['Host']
      res['localServiceName'] = btConfig['CPU Model']
      res['awsServiceName'] =
        element['serviceName'] + ':' + element['usageType']

      //convert from tons to kg
      res['awsCo2e'] = element['co2e'] * cpuHours * 1000
      res['awsKilowattHours'] = element['kilowattHours'] * cpuHours

      res['localCo2e'] = OnPremiseConfig['co2e'] * 1000
      res['localKilowattHours'] = OnPremiseConfig['kilowattHours']

      predictionOutput.push(res)

      awsTotalEmission += res['awsCo2e']
      awsTotalKwh += res['awsKilowattHours']

      localTotalEmission += OnPremiseConfig['co2e'] * 1000
      localTotalKwh += OnPremiseConfig['kilowattHours']
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
  resStored['awsCo2e'] = emissionStored
  resStored['awsKilowattHours'] = kwhStored
  predictionOutput.push(resStored)

  let resDownloaded: PredictionOutput = {} as PredictionOutput
  resDownloaded['host'] = '--'
  resDownloaded['localServiceName'] = 'Network usage'
  resDownloaded['awsCo2e'] = emissionDownloaded
  resDownloaded['awsKilowattHours'] = kwhDownloaded
  predictionOutput.push(resDownloaded)

  awsTotalEmission += emissionStored + emissionDownloaded
  awsTotalKwh += kwhDownloaded + kwhStored

  let resTotal: PredictionOutput = {} as PredictionOutput
  resTotal['host'] = 'Total'
  resTotal['localServiceName'] = '--'
  resTotal['awsCo2e'] = awsTotalEmission
  resTotal['awsKilowattHours'] = awsTotalKwh

  resTotal['localCo2e'] = localTotalEmission
  resTotal['localKilowattHours'] = localTotalKwh
  predictionOutput.push(resTotal)

  return predictionOutput
}

async function predictOnSite(configs: any[]): Promise<any> {
  let onPremiseInputData: OnPremiseDataInput[] = []

  configs.forEach((element) => {
    let cpuHours = parseFloat(element['cpuHours'])

    let res: OnPremiseDataInput = {
      machineName: element['CPU Model'],
      memory: element['# Memory'],
      machineType: 'server',
      startTime: new Date('2022-01-17T00:00:00Z'),
      endTime: new Date('2022-01-24T00:00:00Z'),
      country: 'Unknown',
      region: 'Unknown',
      cost: 93.12,
    }

    onPremiseInputData.push(res)
  })

  const onPremiseEstimatesData: OnPremiseDataOutput[] =
    new App().getOnPremiseEstimatesFromInputData(onPremiseInputData)

  return onPremiseEstimatesData
}

export default async function predictAWS(
  configs: any,
  weights: any,
  forceConfig: any
): Promise<any> {
  let onSiteValues = await predictOnSite(configs)
  let lookupInput = await createLookupTable(configs, weights, forceConfig)

  const inputLUTFile = path.join(process.cwd(), 'output', 'AWS_inputLut.csv')
  writeLUTInputToCsv(inputLUTFile, lookupInput)

  const outputLUTFile = path.join(process.cwd(), 'output', 'AWS_outputLut.csv')
  const awsEstimatesData: LookupTableOutput[] =
    new App().getAwsEstimatesFromInputData(lookupInput)

  writeLUTOutputToCsv(outputLUTFile, awsEstimatesData)

  let totals = getTotals(configs, awsEstimatesData, onSiteValues)
  return totals
}
