import { INSTANCE_TYPE_COMPUTE_PROCESSOR_MAPPING } from '@cloud-carbon-footprint/aws'

/**
 * Removes all instances which are unable to satisfy the requirements of the private cloud
 * @param privateData the dict of the privateData 
 * @param instances all the instances to choose from
 * @param forceConfig the configuration with all the user specified stuff
 * @returns the instances which are able to satisfy the requirements of the private cloud
 */
export function filterInstances(
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


  //loop trough all the instances in reverse so you are able to remove instances
  let i = instances.length

  while (i--) {
    let instance = instances[i]
    //start with cpus
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

  //console.log(removedReasons)
  return instances
}
