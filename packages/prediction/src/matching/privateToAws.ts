/*
 * © 2021 Thoughtworks, Inc.
 */
import csv from 'csvtojson'
import path from 'path'

import { getAWSData } from './../dataSources'
import { App } from '@cloud-carbon-footprint/app'
import {
  LookupTableInput,
  LookupTableOutput,
} from '@cloud-carbon-footprint/common'

import { INSTANCE_TYPE_COMPUTE_PROCESSOR_MAPPING } from '@cloud-carbon-footprint/aws'
import { privateEncrypt } from 'crypto'

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

function filterInstances(
  privateData: any,
  instances: any[],
  forceConfig: any,
): any[] {
  let removedReasons = {
    cpu: 0,
    ram: 0,
    gpu: 0,
    arch: 0,
    threads: 0,
    nic: 0,
    storage: 0,
    metal: 0,
    dhs: 0,
    unknown: 0,
  }

  let i = instances.length

  while (i--) {
    let instance = instances[i]
    //start with cpus
    // console.log(parseInt(instance["vCPUs"]), parseInt(privateData["# CPU"]))
    if (
      parseInt(instance['vCPUs']) < privateData['# CPU'] ||
      parseInt(instance['Cores']) < privateData['# Cores'] ||
      parseFloat(instance['Sustained clock speed (GHz)']) < privateData['Speed']
    ) {
      instances.splice(i, 1)
      removedReasons['cpu']++
      continue
    }

    //ram
    if (parseFloat(instance['Memory (GiB)']) < privateData['vRAM']) {
      instances.splice(i, 1)
      removedReasons['ram']++
      continue
    }

    //gpus, remove all instances with gpus if not needed or if it is needed remove all those with not enough gpus
    if (
      (privateData['GPUs'] == 0 && instance['GPUs'] !== '-') ||
      (privateData['GPUs'] != 0 && instance['GPUs'] === '-') ||
      (instance['GPUs'] !== '-' &&
        parseInt(instance['GPUs']) < privateData['GPUs'])
    ) {
      instances.splice(i, 1)
      removedReasons['gpu']++
      continue
    }
    //break;

    //experimental: architecture (doesn't work super good, but makes it a bit better)
    if (!instance['Architecture'].includes('x86_64')) {
      instances.splice(i, 1)
      removedReasons['arch']++
      continue
    }

    //experimental: threads needed per core (did not do anything)
    if (2 < parseInt(instance['Threads per core'])) {
      instances.splice(i, 1)
      removedReasons['threads']++
      continue
    }

    //experimental: threads needed per core (did not do anything)
    if (
      privateData['# NICs'] >
      parseInt(instance['Maximum number of network interfaces'])
    ) {
      instances.splice(i, 1)
      removedReasons['nic']++
      continue
    }

    /* two option, there has to be storage
     * Otherwise remove those instances, since there are instances with the same config which are better suited
     */
    if (
      (forceConfig['forceStorage'] &&
        instance['Local instance storage'] !== 'TRUE') ||
      (!forceConfig['forceStorage'] &&
        instance['Local instance storage'] === 'TRUE')
    ) {
      instances.splice(i, 1)
      removedReasons['storage']++
      continue
    }

    //force metal
    if (forceConfig['forceMetal'] && instance['Bare metal'] !== 'TRUE') {
      instances.splice(i, 1)
      removedReasons['metal']++
      continue
    }

    //force dedicated host support
    if (
      forceConfig['forceDHS'] &&
      instance['Dedicated Host support'] !== 'TRUE'
    ) {
      instances.splice(i, 1)
      removedReasons['dhs']++
      continue
    }

    //intel cpu processor check
    if (
      !(instance['Instance type'] in INSTANCE_TYPE_COMPUTE_PROCESSOR_MAPPING)
    ) {
      instances.splice(i, 1)
      removedReasons['unknown']++
      continue
    }
  }

  console.log(removedReasons)
  return instances
}

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

function createDictForPropery(instances: any, property: string): any {
  var dict: { [id: string]: Object } = {}
  let minCost = Infinity
  let maxCost = 0
  let i = instances.length
  while (i--) {
    let instance = instances[i]
    minCost = Math.min(minCost, instance[property])
    maxCost = Math.max(maxCost, instance[property])
  }
  dict['min'] = minCost
  dict['max'] = maxCost
  return dict
}

function createPropertiesDict(instances: any[], weights: any): any {
  var dict: { [id: string]: Object } = {}
  weights.forEach((value: boolean, key: string) => {
    let pDict = createDictForPropery(instances, key)
    dict[key] = pDict
  })
  return dict
}

function instanceFitter(
  privateData: any,
  instances: any[],
  weights: any,
): any[] {
  // remove those which are way too different
  let instanceCosts: number[] = []
  let maxCost = 0

  //fix prices properties
  let i = instances.length
  while (i--) {
    let instance = instances[i]

    instance['On-Demand Windows pricing'] = parseFloat(
      instance['On-Demand Windows pricing'].split(' ')[0],
    )
    instance['On-Demand Linux pricing'] = parseFloat(
      instance['On-Demand Linux pricing'].split(' ')[0],
    )

    // get emmision
    let lookupInput: any[] = []
    let input: LookupTableInput = {} as LookupTableInput
    input['serviceName'] = 'AmazonEC2'
    input['region'] = 'eu-west-2'
    input['usageType'] = instance['Instance type']
    input['usageUnit'] = 'Hrs'
    input['vCpus'] = ''
    input['machineType'] = ''

    lookupInput.push(input)

    const awsEstimatesData: LookupTableOutput[] =
      new App().getAwsEstimatesFromInputData(lookupInput)

    //removes those the model doesn't know
    if (isNaN(awsEstimatesData[0]['co2e'])) {
      instances.splice(i, 1)
      continue
    }
    //splice
    instance['Emmision'] = awsEstimatesData[0]['co2e']
  }

  let propertyDict = createPropertiesDict(instances, weights['values'])

  i = 0

  while (i < instances.length) {
    let instance = instances[i]
    let cost = 0
    weights['values'].forEach((value: number, key: string) => {
      let pDict = propertyDict[key]
      let val =
        (parseFloat(instance[key]) - pDict['min']) /
        (pDict['max'] - pDict['min'])
      if (weights['config'][key] === '-') {
        val = 1 - val
      }
      cost += val * value
    })

    if (cost > maxCost) {
      maxCost = cost
    }

    instanceCosts.push(cost)
    i++
  }

  i = instances.length
  while (i--) {
    if (instanceCosts[i] < maxCost) {
      instances.splice(i, 1)
    }
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

  instances = instanceFitter(privateData, instances, weights)

  return keepInstanceWithLowestCost(instances)
}
