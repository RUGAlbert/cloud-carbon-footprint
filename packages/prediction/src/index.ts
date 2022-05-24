/*
 * © 2021 Thoughtworks, Inc.
 */
// import {awsMain} from './reportTests'
import { Prediction } from './application'
import { BTDataReader } from './dataSources'
import { privateToAws } from './matching'
import { writeLUTInputToCsv, writeLUTOutputToCsv } from './dataSources'
import {
  LookupTableInput,
  LookupTableOutput,
} from '@cloud-carbon-footprint/common'
import { App } from '@cloud-carbon-footprint/app'
import process from 'process'
import commander from 'commander'
import csv from 'csvtojson'
import path from 'path'

// let pred = BTDataReader("C:\Users\alber\repositories\school\cloud-carbon-footprint\packages\prediction\btInput.csv");
let BT = BTDataReader(
  'C:\\Users\\alber\\repositories\\school\\cloud-carbon-footprint\\packages\\prediction\\btInputTesco.csv',
)
// let pred = BTDataReader("C:/Users/alber/repositories/school/cloud-carbon-footprint/packages/prediction/btInput.csv");

const locationMapper: { [key: string]: string } = {
  NIEUWEGEIN: 'eu-central-1',
  LONDON: 'eu-west-2',
}

async function aysncDefeater(bt: any): Promise<void> {
  let abt = await bt
  //console.log(bt);
  //serviceName	region	usageType	usageUnit	vCpus
  let lookupInput: LookupTableInput[] = []
  let i = 0
  while (i < 4) {
    let btConfig = abt[i]
    let res = await privateToAws(btConfig)
    let loc = locationMapper[btConfig['SiteName'].toString()]

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

  const inputLUTFile = path.join(process.cwd(), 'AWS_inputLut.csv')
  writeLUTInputToCsv(inputLUTFile, lookupInput)

  const outputLUTFile = path.join(process.cwd(), 'AWS_outputLut.csv')
  const awsEstimatesData: LookupTableOutput[] =
    new App().getAwsEstimatesFromInputData(lookupInput)

  writeLUTOutputToCsv(outputLUTFile, awsEstimatesData)

  let totalEmmision = 0
  let totalKwh = 0

  i = 0

  //asume it is the same order as before, this means we can do / 3
  awsEstimatesData.forEach((element) => {
    let btConfig = abt[Math.floor(i / 3)]
    if (element['usageUnit'] === 'Hrs') {
      console.log(btConfig)
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
  //convert tons to kg
  console.log('co2e', totalEmmision * 970)
  console.log('kwh', totalKwh)
}

aysncDefeater(BT)
//let pred = new Prediction()
// let res = Prediction.serverStructureToAWSStructure("AMD EPYC 1st Gen", 4, 32)
// Prediction.serverStructureToAWSStructure("AMD EPYC 1st Gen", 8, 32)
//Prediction.serverStructureToAWSStructure("AMD EPYC 1st Gen", 32, 128)
//let resU = Prediction.serverStructureToAWSStructure("Undefined2", 4, 32)
// console.log(res)

// awsMain()

export * from './application'
