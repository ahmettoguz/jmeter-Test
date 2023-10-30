#!/bin/bash

# Up pod
kubectl apply -f k8.yaml

# Wait for the pod to be ready
kubectl wait --for=condition=Ready pod -l jmeter_mode=master -n test

# Get master name
masterName=$(kubectl get pods -n test -l jmeter_mode=master -o=jsonpath='{.items[0].metadata.name}')

echo "$masterName" > masterName.txt

# Get slave pod IPs and save to slaveIps.txt
kubectl get pods -n test -l jmeter_mode=slave -o jsonpath='{.items[*].status.podIP}' > slaveIps.txt

# Copy files to the jmeter-master container
kubectl cp slaveIps.txt -n test "$masterName:/jmeter/apache-jmeter-5.1/bin"
kubectl cp test.sh -n test "$masterName:/jmeter/apache-jmeter-5.1/bin"
kubectl cp loadtest.jmx -n test "$masterName:/jmeter/apache-jmeter-5.1/bin"

# Remove template ip txt
rm slaveIps.txt

