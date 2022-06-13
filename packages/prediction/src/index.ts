/*
 * © 2021 Thoughtworks, Inc.
 */
// import {awsMain} from './reportTests'
import { predictAWS } from './application'
import { BTDataReader, writePredictionToCsv } from './dataSources'
import { createAHPTable } from './ahp'
import process from 'process'
import path from 'path'

// let pred = BTDataReader("C:\Users\alber\repositories\school\cloud-carbon-footprint\packages\prediction\btInput.csv");
let BT = BTDataReader(
  'C:\\Users\\alber\\repositories\\school\\cloud-carbon-footprint\\packages\\prediction\\btInputTesco.csv',
)
// let pred = BTDataReader("C:/Users/alber/repositories/school/cloud-carbon-footprint/packages/prediction/btInput.csv");



async function aysncDefeater(bt: any): Promise<void> {
  let weights = createAHPTable('C:\\Users\\alber\\repositories\\school\\cloud-carbon-footprint\\packages\\prediction\\ahpWeights.csv');
  let abt = await bt
  let aweights = await weights
  console.log(aweights)
  let res = await predictAWS(abt, aweights)
  const predictionOutputFile = path.join(process.cwd(), 'predictionOutput.csv')
  writePredictionToCsv(predictionOutputFile, res)
  console.log(res)

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
