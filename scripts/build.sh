#!/usr/bin/env bash

anchor build

# copy the types & IDL into dev environment
cp ./target/types/* $HOME/the-roundies/marketing-site/lib
cp ./target/idl/* $HOME/the-roundies/marketing-site/lib
