import { App } from '@cloud-carbon-footprint/app'
import {
  LookupTableInput,
  LookupTableOutput,
} from '@cloud-carbon-footprint/common'

function createDictForPropery(instances: any, property: string): any {
  var dict: { [id: string]: Object } = {}
  let minScore = Infinity
  let maxScore = 0
  let i = instances.length
  while (i--) {
    let instance = instances[i]
    minScore = Math.min(minScore, instance[property])
    maxScore = Math.max(maxScore, instance[property])
  }
  dict['min'] = minScore
  dict['max'] = maxScore
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

function prepeareInstances(instances: any[]) {
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

  return instances
}

function getScore(instance: any, weights: any, propertyDict: any) {
  let score = 0
  weights['values'].forEach((value: number, key: string) => {
    let pDict = propertyDict[key]
    let val =
      (parseFloat(instance[key]) - pDict['min']) / (pDict['max'] - pDict['min'])
    if (weights['config'][key] === '-') {
      val = 1 - val
    }
    score += val * value
  })
  return score
}

export function instanceFitter(
  privateData: any,
  instances: any[],
  weights: any,
): any[] {
  // remove those which are way too different
  let instanceScores: number[] = []
  let maxScore = 0

  instances = prepeareInstances(instances)

  let propertyDict = createPropertiesDict(instances, weights['values'])

  let i = 0

  while (i < instances.length) {
    let score = getScore(instances[i], weights, propertyDict)
    if (score > maxScore) {
      maxScore = score
    }

    instanceScores.push(score)
    i++
  }

  i = instances.length
  while (i--) {
    if (instanceScores[i] < maxScore) {
      instances.splice(i, 1)
    }
  }
  return instances
}
