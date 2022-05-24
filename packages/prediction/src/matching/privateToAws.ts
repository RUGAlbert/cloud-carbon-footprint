/*
 * © 2021 Thoughtworks, Inc.
 */
import csv from 'csvtojson'
import path from 'path'

import { getAWSData } from './../dataSources'

import { INSTANCE_TYPE_COMPUTE_PROCESSOR_MAPPING } from '@cloud-carbon-footprint/aws'

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
  privateData['forceStorage'] = false
  privateData['forceMetal'] = true
  privateData['forceDHS'] = true
  return privateData
}

function filterInstances(privateData: any, instances: any[]): any[] {
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

  console.log(instances.length)
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
      (privateData['forceStorage'] && instance['Local instance storage'] !== 'TRUE') || 
      (!privateData['forceStorage'] && instance['Local instance storage'] === 'TRUE') 
    ) {
      instances.splice(i, 1)
      removedReasons['storage']++
      continue
    }

    //force metal
    if (privateData['forceMetal'] && instance['Bare metal'] !== 'TRUE') {
      instances.splice(i, 1)
      removedReasons['metal']++
      continue
    }

    //force dedicated host support
    if (
      privateData['forceDHS'] &&
      instance['Dedicated Host support'] !== 'TRUE'
    ) {
      instances.splice(i, 1)
      removedReasons['dhs']++
      continue
    }

    //intel cpu processor check
    if (
      !( instance['Instance type'] in INSTANCE_TYPE_COMPUTE_PROCESSOR_MAPPING)
    ) {
      instances.splice(i, 1)
      removedReasons['unknown']++
      continue
    }
  }

  console.log(removedReasons)
  console.log(instances.length)
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

function instanceFitter(privateData: any, instances: any[]): any[] {
  // remove those which are way too different
  let instanceCosts: number[] = []
  let minCost = Infinity

  let i = 0
  while (i < instances.length) {
    let instance = instances[i]
    let cost = 0
    cost += parseInt(instance['vCPUs']) / privateData['# CPU']

    cost += parseInt(instance['Cores']) / privateData['# Cores']

    cost +=
      parseFloat(instance['Sustained clock speed (GHz)']) / privateData['Speed']

    if (cost < minCost) {
      minCost = cost
    }

    instanceCosts.push(cost)
    i++
  }

  console.log(minCost)

  i = instances.length
  console.log(instances.length)
  while (i--) {
    if (instanceCosts[i] > minCost) {
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
    let cost = parseFloat(instance['On-Demand Linux pricing'].split(' ')[0])

    if (cost < minCost) {
      minCost = cost
      bestInstance = instance
    }
    i++
  }

  return bestInstance
}

export default async function privateToAws(privateData: any): Promise<any> {
  let instances = await getAWSData()
  privateData = formatPrivateData(privateData)

  instances = filterInstances(privateData, instances)

  if (!privateData['forceMetal']) {
    instances = keepBestOfFamily(instances)
  }

  instances = instanceFitter(privateData, instances)

  return keepInstanceWithLowestCost(instances)
}
