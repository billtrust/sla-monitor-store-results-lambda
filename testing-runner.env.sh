#!/bin/bash

export SLARUNNER_DRYRUN=1
export SLARUNNER_DELAY=15
export SLARUNNER_SERVICE=store-results-lambda
export SLARUNNER_SNSTOPICNAME=sla-monitor-result-published-dev
export SLARUNNER_COMMAND="/bin/bash ./invoke.sh"