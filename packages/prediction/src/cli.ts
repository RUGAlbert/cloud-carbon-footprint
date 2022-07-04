import commander from 'commander'
import moment from 'moment'
import csv from 'csvtojson'
import path from 'path'
import * as process from 'process'

import { predictAWS } from './application'
import { writePredictionToCsv } from './dataSources'
import { createAHPTable } from './ahp'

export default async function cli(argv: string[] = process.argv) {
  console.time('cli')
  const program = new commander.Command()
  program.storeOptionsAsProperties(false)

  program
    .option('-s', 'Force Storage')
    .option('-m', 'Force metal')
    .option('-d', 'Force DHS')
    .option('--btFile <string>', 'btFile')
    .option('--weights <string>', 'weight table')

  program.parse(argv)
  const programOptions = program.opts()

  console.log(programOptions)
  if (!('btFile' in programOptions)) {
    console.log('No BT file specified, terminating')
    return
  }

  if (!('weights' in programOptions)) {
    console.log('No weights file specified, terminating')
    return
  }

  let forceConfig = {
	  forceStorage:'s' in programOptions,
	  forceMetal:'m' in programOptions,
	  forceDHS:'d' in programOptions
  }

  console.log(forceConfig)

  //'C:\\Users\\alber\\repositories\\school\\cloud-carbon-footprint\\packages\\prediction\\btInputTesco.csv',
  let bt = await csv().fromFile(programOptions.btFile)

  //'C:\\Users\\alber\\repositories\\school\\cloud-carbon-footprint\\packages\\prediction\\ahpWeights.csv',
  let weights = createAHPTable(programOptions.weights)
  let abt = await bt
  let aweights = await weights
  let res = await predictAWS(abt, aweights, forceConfig)
  const predictionOutputFile = path.join(process.cwd(), 'output', 'predictionOutput.csv')
  writePredictionToCsv(predictionOutputFile, res)

  
console.timeEnd('cli')
}
