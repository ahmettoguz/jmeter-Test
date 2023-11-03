#!/bin/bash

# Get master name
masterName=$(kubectl get pods -n test -l jmeter_mode=master -o=jsonpath='{.items[0].metadata.name}')

# Copy results
kubectl cp -n test $masterName:/jmeter/apache-jmeter-5.1/bin/result.jtl ./result.jtl
kubectl cp -n test $masterName:/jmeter/apache-jmeter-5.1/bin/jmeter.log ./jmeter.log

# Clear previous file
if [ -e "summary.txt" ]; then
    rm summary.txt
fi
total_lines=$(wc -l < result.jtl)
request_200_count=$(grep -o 'Request,200,' result.jtl | wc -l)
result=$(echo "scale=2; ($total_lines - 1) / $request_200_count" | bc)
echo -e "Pass / Total\n$request_200_count / $((total_lines - 1))" > summary.txt

# Write also jmeter.log summary
echo >> summary.txt
grep 'summary =' jmeter.log >> summary.txt

# Display summary results
echo
cat summary.txt
echo