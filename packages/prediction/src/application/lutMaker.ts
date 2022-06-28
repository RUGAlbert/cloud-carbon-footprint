import { LookupTableInput } from '@cloud-carbon-footprint/common'
import { MAP_LOCATIONS } from './../matching'
import { privateToAws } from './../matching'

/**
 * Get a list of all the private cloud configurations and creates a LUT for the model to be used
 * @param configs private cloud configurations
 * @param weights the weights and parameters used to fit the best instance for the config
 * @param forceConfig user specified user configuration
 * @returns LUT table with instances used to determine emission
 */
export async function createLookupTable(
  configs: any,
  weights: any,
  forceConfig: any,
): Promise<LookupTableInput[]> {
  let lookupInput: LookupTableInput[] = []
  let i = 0
  let length = configs.length
  while (i < length) {
    let config = configs[i]
    let res = await privateToAws(config, weights, forceConfig)
    let loc = MAP_LOCATIONS[config['SiteName'].toString()]
    if (loc == undefined) {
      loc = config['SiteName'].toString()
    }

    let input: LookupTableInput = {} as LookupTableInput
    input['serviceName'] = 'AmazonEC2'
    input['region'] = loc
    input['usageType'] = res['Instance type']
    input['usageUnit'] = 'Hrs'
    input['vCpus'] = ''
    input['machineType'] = ''
    lookupInput.push(input)

    //network
    let network: LookupTableInput = {} as LookupTableInput
    network['serviceName'] = 'AmazonEC2'
    network['region'] = loc
    network['usageType'] = 'DOWNLOAD'
    network['usageUnit'] = 'GB'
    network['vCpus'] = ''
    network['machineType'] = ''
    lookupInput.push(network)

    //storage
    let storage = {} as LookupTableInput
    storage['serviceName'] = 'AmazonS3'
    storage['region'] = loc
    storage['usageType'] = 'APS2-TimedStorage-ByteHrs'
    storage['usageUnit'] = 'GB-Hours'
    storage['vCpus'] = ''
    storage['machineType'] = ''
    lookupInput.push(storage)

    i++
  }

  return lookupInput
}
