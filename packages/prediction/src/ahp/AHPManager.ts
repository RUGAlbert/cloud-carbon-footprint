import csv from 'csvtojson'

/**
 * Calculates the weights based on pair-wise weights matrix
 * @param filepath the file with pairwise weights
 * @returns the weights
 */
export default async function createAHPTable(filepath : string) : Promise<{}> {
	const matrix = await csv().fromFile(filepath)
	let params = []
	for (const [k, _] of Object.entries(matrix[0])) {
		params.push(k)
	}
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

	//get weighted weights
	for (var i=0; i< length; i++) {
		let val = 0
		for (var j=0; j< length; j++) {
			val += matrix[i][params[j]] / totals.get(params[j])
		}
		weights.set(params[i], val  / length);
	}


	let lambda = 0
	//calculate consistency
	for (var i=0; i< length; i++) {
		let val = 0
		for (var j=0; j< length; j++) {
			val += matrix[i][params[j]] * weights.get(params[j])
		}
		lambda += val / weights.get(params[i])
	}
	lambda /= length

	let CI = (lambda - length) / (length - 1)

	//give warning if the APH cannot be done with these values
	if(CI >= 0.1){
		console.log("Be carefull APH is not correct")
	}

	
	const dict = {
		values: weights,
		config: matrix[length]
	}
	return dict
}