#!/bin/sh -l

if output=$(pycodestyle $1 .); then
    exitcode=0
    echo "Success"
else
    exitcode=1
    echo "Errors"
    echo "$output"
fi

echo "::set-output name=exit-code::$exitcode"
echo "::set-output name=output::$output"
