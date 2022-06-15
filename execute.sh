start=`date +%s`
cmd.exe /c yarn workspace @cloud-carbon-footprint/prediction start --btFile C:\\Users\\alber\\repositories\\school\\cloud-carbon-footprint\\packages\\prediction\\input\\btInputTesco.csv --weights C:\\Users\\alber\\repositories\\school\\cloud-carbon-footprint\\packages\\prediction\\input\\ahpWeights.csv -d -m
end=`date +%s`

runtime=$((end-start))
echo $runtime