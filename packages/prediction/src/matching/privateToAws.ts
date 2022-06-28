/*
 * © 2021 Thoughtworks, Inc.
 */

import { getAWSData } from './../dataSources'

import { instanceFitter } from './fitter'
import { filterInstances } from './filter'

function keepBestOfFamily(instances: any): any[] {
  let prevFamliy = 'Unknown'

  let i = instances.length
  //do something fancy to remove doubles, assumes the biggest is the latest in the array
  while (i--) {
    let instance = instances[i]
    //at index 0 the type is specified and at 1 the size
    let famliy = instance['Instance family']
    if (famliy === prevFamliy) {
      instances.splice(i + 1, 1)
    }
    prevFamliy = famliy
  }
  return instances
}

function keepInstanceWithLowestCost(instances: any[]): any {
  // remove those which are way too different
  let minCost = Infinity
  let bestInstance = instances[0]

  let i = 0
  while (i < instances.length) {
    let instance = instances[i]
    let cost = instance['On-Demand Linux pricing']

    if (cost < minCost) {
      minCost = cost
      bestInstance = instance
    }
    i++
  }

  return bestInstance
}

function formatPrivateData(privateData: any): any {
  // fix some data types

  privateData['# CPU'] = parseInt(privateData['# CPU'])
  privateData['# Cores'] = parseInt(privateData['# Cores'])

  privateData['GPUs'] = 0

  privateData['Speed'] = privateData['Speed'].replace(',', '.')
  privateData['Speed'] = parseFloat(privateData['Speed'])

  privateData['vRAM'] = privateData['vRAM'].replace(',', '.')
  privateData['vRAM'] = parseFloat(privateData['vRAM'])

  privateData['# NICs'] = parseInt(privateData['# NICs'])

  // Config
  return privateData
}

export default async function privateToAws(
  privateData: any,
  weights: any,
  forceConfig: any,
): Promise<any> {
  let instances = await getAWSData()
  privateData = formatPrivateData(privateData)

  instances = filterInstances(privateData, instances, forceConfig)

  if (!privateData['forceMetal']) {
    instances = keepBestOfFamily(instances)
  }

  instances = instanceFitter(instances, weights)

  return keepInstanceWithLowestCost(instances)
}
