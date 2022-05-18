/*
 * © 2021 Thoughtworks, Inc.
 */
// import {awsMain} from './reportTests'
import { Prediction } from './application'
import { BTDataReader } from './dataSources'
import { privateToAws } from './matching'
// let pred = BTDataReader("C:\Users\alber\repositories\school\cloud-carbon-footprint\packages\prediction\btInput.csv");
let BT = BTDataReader(
  'C:\\Users\\alber\\repositories\\school\\cloud-carbon-footprint\\packages\\prediction\\btInput.csv',
)
// let pred = BTDataReader("C:/Users/alber/repositories/school/cloud-carbon-footprint/packages/prediction/btInput.csv");

async function aysncDefeater(bt: any): Promise<void> {
  let abt = await bt
  //console.log(bt);
  //serviceName	region	usageType	usageUnit	vCpus
  let lookupInput = []
  let i = 0
  while (i < 2) {
    let res = await privateToAws(abt[i])
    console.log(res)
    i++
  }
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
