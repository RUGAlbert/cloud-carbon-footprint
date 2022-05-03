/*
 * © 2021 Thoughtworks, Inc.
 */
// import {awsMain} from './reportTests'
import {Prediction} from './application'

let pred = new Prediction()
// let res = Prediction.serverStructureToAWSStructure("AMD EPYC 1st Gen", 4, 32)
// Prediction.serverStructureToAWSStructure("AMD EPYC 1st Gen", 8, 32)
Prediction.serverStructureToAWSStructure("AMD EPYC 1st Gen", 32, 128)
let resU = Prediction.serverStructureToAWSStructure("Undefined2", 4, 32)
// console.log(res)

// awsMain()

export * from './application'
