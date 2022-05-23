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

const locationMapper : { [key: string]: string } = {
  'NIEUWEGEIN': 'eu-central-1',
  'LONDON': 'eu-west-2',
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
    let input: LookupTableInput = {} as LookupTableInput
    input['serviceName'] = 'AmazonEC2'
    input['region'] = locationMapper[(btConfig['SiteName']).toString()]
    input['usageType'] = res['Instance type']
    input['usageUnit'] = 'Hrs'
    input['vCpus'] = ''
    input['machineType'] = ''
    lookupInput.push(input)
    i++
  }

  //network
  let input: LookupTableInput = {} as LookupTableInput
  input['serviceName'] = 'AmazonEC2'
  input['region'] = 'us-east-1'
  input['usageType'] = 'DOWNLOAD'
  input['usageUnit'] = 'GB'
  input['vCpus'] = ''
  input['machineType'] = ''
  lookupInput.push(input)

  //storage
  input = {} as LookupTableInput
  input['serviceName'] = 'AmazonS3'
  input['region'] = 'us-east-1'
  input['usageType'] = 'APS2-TimedStorage-ByteHrs'
  input['usageUnit'] = 'GB-Hours'
  input['vCpus'] = ''
  input['machineType'] = ''
  lookupInput.push(input)

  const inputLUTFile = path.join(process.cwd(), 'AWS_inputLut.csv')
  writeLUTInputToCsv(inputLUTFile, lookupInput)
  const outputLUTFile = path.join(process.cwd(), 'AWS_outputLut.csv')
  const awsEstimatesData: LookupTableOutput[] =
    new App().getAwsEstimatesFromInputData(lookupInput)

  writeLUTOutputToCsv(outputLUTFile, awsEstimatesData)
  let cpuHours = 24 * 7
  let gbDownloaded = 168.2856
  let storage = 1510 * 24 * 7

  let totalEmmision = 0
  awsEstimatesData.forEach((element) => {
    if (element['usageUnit'] === 'Hrs') {
      totalEmmision += element['co2e'] * cpuHours
      console.log('cpu', element['kilowattHours'] * cpuHours)
    } else if (element['usageUnit'] === 'GB') {
      totalEmmision += element['co2e'] * gbDownloaded
      console.log('network', element['kilowattHours'] * gbDownloaded)
    } else if (element['usageUnit'] === 'GB-Hours') {
      totalEmmision += element['co2e'] * storage
      console.log('storage', element['kilowattHours'] * storage)
    }
  })
  console.log(totalEmmision)
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
