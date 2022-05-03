/*
 * © 2021 Thoughtworks, Inc.
 */

import { ComputeEstimator, MemoryEstimator } from '@cloud-carbon-footprint/core'
import {
  Logger,
  OnPremiseDataInput,
  OnPremiseDataOutput,
} from '@cloud-carbon-footprint/common'

import {
  EC2_INSTANCE_TYPES,
  INSTANCE_TYPE_COMPUTE_PROCESSOR_MAPPING,
} from '@cloud-carbon-footprint/aws'

import { COMPUTE_PROCESSOR_TYPES } from '@cloud-carbon-footprint/core'

import { ON_PREMISE_CLOUD_CONSTANTS } from '@cloud-carbon-footprint/on-premise'
import { OnPremiseDataReport } from '@cloud-carbon-footprint/on-premise'

export default class Prediction {
  private logger: Logger
  constructor() {
    this.logger = new Logger('Prediction')
  }

  static getPredictionDataFromInputData(
    inputData: OnPremiseDataInput[],
  ): OnPremiseDataOutput[] {
    const onPremiseDataReport = new OnPremiseDataReport(
      new ComputeEstimator(),
      new MemoryEstimator(ON_PREMISE_CLOUD_CONSTANTS.MEMORY_COEFFICIENT),
    )
    return onPremiseDataReport.getEstimates(inputData)
  }

  static getInstanceData(instance: string): number[] {
    //at index 0 the type is specified and at 1 the size
    let specs = instance.split('.')
    specs[0] = specs[0].toLowerCase()
    specs[1] = specs[1].toLowerCase()
    // console.log(specs)
    // some weird shit happens here, still have to figure this out
    if (!(specs[1] in EC2_INSTANCE_TYPES[specs[0]])) {
      return []
    }
    let instanceData = EC2_INSTANCE_TYPES[specs[0]][specs[1]] // [vcpus, memory, scope3 emissions ]
    return instanceData
  }

  static serverStructureToAWSStructure(
    cpu: string,
    minvcpus: number,
    minmemory: number,
  ): void {
    let cpuEnum = cpu as COMPUTE_PROCESSOR_TYPES
    //check if cpu is known, cpuEnum is not used further in this function
    if (Object.values(COMPUTE_PROCESSOR_TYPES).indexOf(cpuEnum) < 0) {
      console.log('CPU unknown')
      return
    }

    //get only instances which use this cpu
    let instances: string[] = []
    Object.entries(INSTANCE_TYPE_COMPUTE_PROCESSOR_MAPPING).forEach(
      ([key, value]) => {
        if (value.length > 1) {
          // TODO add something smart here
          //console.log('There should be now instance with multiple CPUS')
        }
        if (value[0] === cpu) {
          instances.push(key)
        }
      },
    )
    // console.log(instances.length)

    var i = instances.length
    while (i--) {
      let instance = instances[i]
      let instanceData = this.getInstanceData(instance)
      //console.log(instanceData)
      if (instanceData[0] < minvcpus || instanceData[1] < minmemory) {
        instances.splice(i, 1)
      }
    }
    // console.log(instances.length)
    // console.log(instances)

    //remove doubles (we do not ask for a better solution, only the first one that works)
    i = instances.length
    let prevSpec = ''

    //TODO make this better and use the properties as defined above
    while (i--) {
      let instance = instances[i]
      //at index 0 the type is specified and at 1 the size
      let specs = instance.split('.')
      specs[0] = specs[0].toLowerCase()
      if (specs[0] === prevSpec) {
        instances.splice(i + 1, 1)
      }
      prevSpec = specs[0]
    }
    console.log(instances.length)
    console.log(instances)

    // get with lowest and biggest emmision
    var i = instances.length
    let maxCo2 = 0
    let maxCo2Instance = ''
    let minCo2 = Infinity
    let minCo2Instance = ''

    while (i--) {
      let instance = instances[i]
      let instanceData = this.getInstanceData(instance)
      //get emmision
      if (instanceData[2] > maxCo2) {
        maxCo2 = instanceData[2]
        maxCo2Instance = instance
      }

      if (instanceData[2] < minCo2) {
        minCo2 = instanceData[2]
        minCo2Instance = instance
      }
    }

    console.log(maxCo2)
    console.log(minCo2)
  }
}
