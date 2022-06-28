import { App } from '@cloud-carbon-footprint/app'
import {
  LookupTableInput,
  LookupTableOutput,
} from '@cloud-carbon-footprint/common'

/**
 * Finds the minimum and maximum values of a property
 * @param instances the instances to be used
 * @param property the property to create the dict for
 * @returns dict with min and max score
 */
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

/**
 * calculates for all used properties the min and max value
 * @param instances the instances to be used
 * @param weights An array which includes all the properties to be used
 * @returns an array with all the min max values
 */
function createPropertiesDict(instances: any[], weights: any): any {
  var dict: { [id: string]: Object } = {}
  weights.forEach((value: boolean, key: string) => {
    let pDict = createDictForPropery(instances, key)
    dict[key] = pDict
  })
  return dict
}

/**
 * Makes sure all the instances have the correct format
 * @param instances instances to be fixed
 * @returns the fixed instances
 */
function prepareInstances(instances: any[]) : any[] {
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

    // get emission
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
    instance['Emission'] = awsEstimatesData[0]['co2e']
  }

  return instances
}

/**
 * Calculates the score of an the instance
 *
 * @param instance the AWS instance to calculate the score of
 * @param weights the weights of the different properties
 * @param propertyDict the propertydict which has the minimum and maximum to be used for the utility function
 * @returns the score
 */
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

/**
 * Fits all instances based on a score function. The instances with the highest score is returned
 * @param instances the instances to score from
 * @param weights the weights of the properties used to generate the score
 * @returns instances with the best score
 */
export function instanceFitter(
  instances: any[],
  weights: any,
): any[] {
  // remove those which are way too different
  let instanceScores: number[] = []
  let maxScore = 0

  instances = prepareInstances(instances)

  let propertyDict = createPropertiesDict(instances, weights['values'])

  let i = 0

  //determine max score and calculate all scores
  while (i < instances.length) {
    let score = getScore(instances[i], weights, propertyDict)
    if (score > maxScore) {
      maxScore = score
    }

    instanceScores.push(score)
    i++
  }

  //get all those instances with the max score
  i = instances.length
  while (i--) {
    if (instanceScores[i] < maxScore) {
      instances.splice(i, 1)
    }
  }
  return instances
}
