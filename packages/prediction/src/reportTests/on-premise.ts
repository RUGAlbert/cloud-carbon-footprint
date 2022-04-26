import { Prediction } from '.././application'
import { ComputeEstimator, MemoryEstimator } from '@cloud-carbon-footprint/core'

import {
  OnPremiseDataInput,
  OnPremiseDataOutput,
} from '@cloud-carbon-footprint/common'

export function main() {
  let row: OnPremiseDataInput[] = [
    {
      machineName: 'Intel(R) Xeon(R) Silver 4114 CPU @ 2.20GHz',
      memory: 130690,
      machineType: 'server',
      startTime: new Date('2022-01-17T13:38:18Z'),
      endTime: new Date('2022-01-24T18:22:29.918423Z'),
      country: 'United States',
      region: 'Texas',
      cost: 93.12,
    },
  ]
  let computeUsage = {
    cpuUtilizationAverage: 50,
    vCpuHours: 172,
    usesAverageCPUConstant: true,
  }

  let region = 'United States-Texas'
  let emissionsFactors = {
    Australia: 0.00096,
    Canada: 0.0000186,
    Finland: 0.00009532,
    France: 0.00005128,
    Germany: 0.00033866,
    India: 0.0007082,
    Ireland: 0.00033599,
    Israel: 0.00046095,
    Italy: 0.00032384,
    Malaysia: 0.000408,
    Poland: 0.00075962,
    Romania: 0.00026184,
    'South Korea': 0.0004156,
    Spain: 0.00017103,
    Sweden: 0.00000567,
    Switzerland: 0.00001152,
    'United Kingdom': 0.00021233,
    'United States': 0.00042394,
    'United States-California': 0.00017562,
    'United States-Virginia': 0.00028842,
    'United States-Louisiana': 0.00037481,
    'United States-Florida': 0.00039793,
    'United States-Illinois': 0.00032921,
    'United States-Texas': 0.00041432,
    'United States-Washington': 0.00013567,
    'United States-Ohio': 0.00056357,
    'United States-Oregon': 0.00017562,
    Unknown: 0.0003228315385,
  }

  let averageWatts: number | undefined = undefined
  let computeConstants = {
    minWatts: 88.9,
    maxWatts: 733,
    averageWatts,
    powerUsageEffectiveness: 1.58,
  }

  let res = Prediction.getPredictionDataFromInputData(row)
  console.log('test')
  console.log(res)

  //compute
  console.log('Compute estimator')
  let computeEstimator = new ComputeEstimator()

  let estimate = computeEstimator.estimate(
    [computeUsage],
    region,
    emissionsFactors,
    computeConstants,
  )[0]

  console.log(estimate)
}
