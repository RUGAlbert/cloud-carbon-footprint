/*
 * © 2021 Thoughtworks, Inc.
 */
import csv from 'csvtojson'
import path from 'path'

import { getAWSData } from './../dataSources'

export default async function privateToAws(privateData: any): Promise<any[]> {
  let awsConfigs = await getAWSData();
  //console.log(awsConfigs)
  let instances = awsConfigs;

  // fix some data types

  privateData['# CPU'] = parseInt(privateData['# CPU']);
  privateData['# Cores'] = parseInt(privateData['# Cores']);

  privateData['GPUs'] = 0;

  privateData['Speed'] = privateData['Speed'].replace(',', '.');
  privateData['Speed'] = parseFloat(privateData['Speed']);

  privateData['vRAM'] = privateData['vRAM'].replace(',', '.');
  privateData['vRAM'] = parseFloat(privateData['vRAM']);

  let i = instances.length;

  console.log(instances.length);
  while (i--) {
    let instance = instances[i]
    //start with cpus
    // console.log(parseInt(instance["vCPUs"]), parseInt(privateData["# CPU"]))
    if (
      parseInt(instance['vCPUs']) < privateData['# CPU'] ||
      parseInt(instance['Cores']) < privateData['# Cores'] ||
      instance['Sustained clock speed (GHz)'] < privateData['Speed']
    ) {
      instances.splice(i, 1);
      continue;
    }

    //ram
    if (parseFloat(instance['Memory (GiB)']) < privateData['vRAM']) {
      instances.splice(i, 1);
      continue;
    }

    //gpus, remove all instances with gpus if not needed or if it is needed remove all those with not enough gpus
    if (
      (privateData['GPUs'] == 0 && instance['GPUs'] !== '-') ||
      (privateData['GPUs'] != 0 && instance['GPUs'] === '-') ||
      (instance['GPUs'] !== '-' &&
        parseInt(instance['GPUs']) < privateData['GPUs'])
    ) {
      instances.splice(i, 1);
      continue;
    }
    //break;

    //experimental: architecture (doesn't work super good, but makes it a bit better)
    if(!instance['Architecture'].includes('x86_64')){
      instances.splice(i, 1);
      continue;
    }


    //experimental: 
    if(!instance['Architecture'].includes('x86_64')){
      instances.splice(i, 1);
      continue;
    }
  }
  console.log(instances.length)

  let prevFamliy = 'Uknown'

  i = instances.length

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

  console.log(instances.length)

  i = instances.length
  while (i--) {
    let instance = instances[i]
    console.log(instance['Instance type'])
  }
  return awsConfigs
}
