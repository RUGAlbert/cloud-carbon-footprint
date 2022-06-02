import csv from 'csvtojson'

export default async function createAHPTable(params : string[]) : Promise<number[]> {
	let w = await getWeights(params)
	return []
}

async function getWeights(params: string[]) : Promise<Map<string, number>> {
	const matrix = await csv().fromFile('C:\\Users\\alber\\repositories\\school\\cloud-carbon-footprint\\packages\\prediction\\ahpWeights.csv')
	console.log(matrix)
	let length = params.length
	let totals = new Map<string, number>();
	let weights = new Map<string, number>();

	//get totals
	for (var i=0; i< length; i++) {
		let val = 0
		for (var j=0; j< length; j++) {
			matrix[j][params[i]] = parseFloat(matrix[j][params[i]])
			val += matrix[j][params[i]]
		}
		totals.set(params[i], val);
	}

	//get weighted matrix
	for (var i=0; i< length; i++) {
		for (var j=0; j< length; j++) {
			//matrix[j][params[i]] /= 
		}
	}

	//get weighted weights
	for (var i=0; i< length; i++) {
		let val = 0
		for (var j=0; j< length; j++) {
			val += matrix[i][params[j]] / totals.get(params[j])
		}
		weights.set(params[i], val  / length);
	}



	console.log(totals)
	console.log(matrix)
	console.log(weights)

	let lambda = 0
	//calculate consistency
	for (var i=0; i< length; i++) {
		let val = 0
		for (var j=0; j< length; j++) {
			val += matrix[i][params[j]] * weights.get(params[j])
		}
		console.log(val / weights.get(params[i]))
		lambda += val / weights.get(params[i])
	}
	lambda /= length
	console.log(lambda)

	let CI = (lambda - length) / (length - 1)
	console.log(CI)

	//give warning for some reason
	if(CI >= 0.1){
		console.log("Be carefull APH is not correct")
	}

	return weights
}